const express = require('express');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Donation = require('../models/Donation');
const {
  paymentHash,
  commandHash,
  isValidResponseHash,
  mapPayuStatus,
  payuConfig
} = require('../utils/payu');

const router = express.Router();

const MIN_AMOUNT = 10;
const MAX_AMOUNT = 100000;
const MAX_CALLBACK_VALUE_LENGTH = 500;
const VERIFY_COOLDOWN_MS = 10000;
const verificationAttempts = new Map();
const CALLBACK_FIELDS = [
  'txnid',
  'status',
  'mihpayid',
  'mode',
  'bankcode',
  'error',
  'error_Message',
  'field9',
  'amount',
  'productinfo',
  'key'
];

function isValidTransactionId(txnid) {
  return /^nbm\d{13}[0-9a-f]{6}$/.test(String(txnid || ''));
}

function throttleVerification(req, res, next) {
  const txnid = String(req.params.txnid || '');
  if (!isValidTransactionId(txnid)) {
    return res.status(400).json({ message: 'Invalid transaction ID.' });
  }

  const now = Date.now();
  const lastAttempt = verificationAttempts.get(txnid);
  if (lastAttempt && now - lastAttempt < VERIFY_COOLDOWN_MS) {
    return res.status(429).json({ message: 'Please wait before verifying this payment again.' });
  }
  if (verificationAttempts.size >= 5000) {
    for (const [storedTxnid, attemptedAt] of verificationAttempts) {
      if (now - attemptedAt >= VERIFY_COOLDOWN_MS) verificationAttempts.delete(storedTxnid);
    }
    if (verificationAttempts.size >= 5000) {
      verificationAttempts.delete(verificationAttempts.keys().next().value);
    }
  }
  verificationAttempts.set(txnid, now);
  next();
}

function sanitizeCallback(params) {
  return CALLBACK_FIELDS.reduce((result, field) => {
    if (params[field] !== undefined && params[field] !== null) {
      result[field] = String(params[field]).slice(0, MAX_CALLBACK_VALUE_LENGTH);
    }
    return result;
  }, {});
}

function publicPayment(doc) {
  return {
    txnid: doc.txnid,
    amount: doc.amount,
    status: doc.status,
    method: doc.method,
    mode: doc.mode || null,
    productinfo: doc.productinfo,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount.toFixed(2);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).replace(/\s+/g, ''));
}

async function applyPayuCallback(params, { requireHash = true } = {}) {
  const { key, salt } = payuConfig();
  const txnid = String(params.txnid || '');
  if (!isValidTransactionId(txnid)) {
    return { ok: false, reason: 'missing_txnid' };
  }

  const payment = await Payment.findOne({ txnid });
  if (!payment) {
    return { ok: false, reason: 'unknown_txnid' };
  }
  if (payment.gateway !== 'payu') {
    return { ok: false, reason: 'wrong_gateway' };
  }

  if (params.key && params.key !== key) {
    return { ok: false, reason: 'invalid_key', payment };
  }

  const hashOk = salt ? isValidResponseHash({ ...params, key: params.key || key }, salt) : false;
  if (requireHash && !hashOk) {
    return { ok: false, reason: 'invalid_hash', payment };
  }

  if (params.amount && formatAmount(params.amount) !== payment.amount) {
    return { ok: false, reason: 'amount_mismatch', payment };
  }

  const nextStatus = mapPayuStatus(params.status);
  if (nextStatus === 'success' && !params.amount) {
    return { ok: false, reason: 'missing_amount', payment };
  }
  const update = {
    payuStatus: String(params.status || '').slice(0, 100),
    hashVerified: hashOk,
    rawResponse: sanitizeCallback(params),
    updatedAt: new Date()
  };
  if (params.mihpayid) update.mihpayid = String(params.mihpayid).slice(0, 100);
  if (params.mode) update.mode = String(params.mode).slice(0, 50);
  if (params.bankcode) update.bankcode = String(params.bankcode).slice(0, 50);
  if (params.error) update.error = String(params.error).slice(0, 100);
  if (params.error_Message || params.field9) {
    update.errorMessage = String(params.error_Message || params.field9).slice(0, 500);
  }
  if (nextStatus === 'success' || nextStatus === 'failed' || nextStatus === 'pending') {
    update.status = nextStatus;
  }

  const query = { _id: payment._id };
  if (nextStatus !== 'success') {
    query.status = { $ne: 'success' };
  }

  const updated = await Payment.findOneAndUpdate(query, { $set: update }, { new: true });
  if (!updated) {
    return {
      ok: true,
      payment: await Payment.findById(payment._id),
      ignored: true
    };
  }
  if (updated.donation && updated.status === 'success') {
    await Donation.findByIdAndUpdate(updated.donation, { $set: { status: 'success' } });
  }
  return { ok: true, payment: updated };
}

function redirectToDonateStatus(res, payment, extra = {}) {
  const { frontendUrl } = payuConfig();
  const query = new URLSearchParams({
    txnid: payment ? payment.txnid : extra.txnid || '',
    status: payment ? payment.status : extra.status || 'failed'
  });
  res.redirect(302, `${frontendUrl}/donate/status?${query.toString()}`);
}

router.post('/payments/create', async (req, res) => {
  try {
    const { key, salt, mode, publicApiUrl, frontendUrl, baseUrl, isProduction } = payuConfig();
    const validUrlPrefix = isProduction ? 'https://' : 'http';
    if (
      !key ||
      !salt ||
      !['test', 'live'].includes(mode) ||
      !publicApiUrl.startsWith(validUrlPrefix) ||
      !frontendUrl.startsWith(validUrlPrefix)
    ) {
      return res.status(503).json({
        message: 'PayU is not configured correctly on the API server.'
      });
    }

    const amount = formatAmount(req.body.amount);
    const firstname = String(req.body.firstname || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').replace(/\s+/g, '');
    const method = ['upi', 'card', 'all'].includes(req.body.method) ? req.body.method : 'all';
    const productinfo = 'NBM Donation';

    if (!amount || Number(amount) < MIN_AMOUNT || Number(amount) > MAX_AMOUNT) {
      return res.status(400).json({ message: `Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}.` });
    }
    if (!firstname || firstname.length < 2 || firstname.length > 100) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }
    if (email.length > 254 || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email.' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    const txnid = `nbm${Date.now()}${crypto.randomBytes(3).toString('hex')}`;
    const hash = paymentHash({
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      salt
    });

    await Payment.create({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      method,
      status: 'pending'
    });

    const fields = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl: `${publicApiUrl}/api/payments/payu/success`,
      furl: `${publicApiUrl}/api/payments/payu/failure`,
      hash
    };

    if (method === 'upi') {
      fields.pg = 'UPI';
    } else if (method === 'card') {
      fields.pg = 'CC';
    }

    res.json({
      txnid,
      action: `${baseUrl}/_payment`,
      fields
    });
  } catch (error) {
    console.error('PayU create error:', error);
    res.status(500).json({ message: 'Could not start payment.' });
  }
});

router.get('/payments/:txnid', async (req, res) => {
  try {
    if (!isValidTransactionId(req.params.txnid)) {
      return res.status(400).json({ message: 'Invalid transaction ID.' });
    }
    const payment = await Payment.findOne({ txnid: req.params.txnid });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }
    if (payment.gateway !== 'payu') {
      return res.status(400).json({ message: 'This payment does not use PayU.' });
    }
    res.json(publicPayment(payment));
  } catch (error) {
    res.status(500).json({ message: 'Could not load payment.' });
  }
});

router.post('/payments/payu/success', async (req, res) => {
  try {
    const result = await applyPayuCallback(req.body);
    if (!result.ok) {
      return redirectToDonateStatus(res, null, { txnid: req.body.txnid, status: 'failed' });
    }
    redirectToDonateStatus(res, result.payment);
  } catch (error) {
    console.error('PayU success callback error:', error);
    res.status(500).send('Could not process payment callback.');
  }
});

router.post('/payments/payu/failure', async (req, res) => {
  try {
    const result = await applyPayuCallback(req.body);
    if (!result.ok) {
      return redirectToDonateStatus(res, null, {
        txnid: req.body.txnid,
        status: 'failed'
      });
    }
    redirectToDonateStatus(res, result.payment);
  } catch (error) {
    console.error('PayU failure callback error:', error);
    res.status(500).send('Could not process payment callback.');
  }
});

router.post('/payments/payu/webhook', async (req, res) => {
  try {
    const params = req.body || {};
    const result = await applyPayuCallback(params, { requireHash: true });
    if (!result.ok) {
      return res.status(400).json({ received: false });
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayU webhook error:', error);
    res.status(500).json({ received: false });
  }
});

router.post('/payments/:txnid/verify', throttleVerification, async (req, res) => {
  try {
    const { key, salt, mode } = payuConfig();
    if (!key || !salt || !['test', 'live'].includes(mode)) {
      return res.status(503).json({ message: 'PayU is not configured.' });
    }

    const payment = await Payment.findOne({ txnid: req.params.txnid });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.gateway !== 'payu') {
      return res.status(400).json({ message: 'This payment does not use PayU.' });
    }

    const command = 'verify_payment';
    const body = new URLSearchParams({
      key,
      command,
      var1: payment.txnid,
      hash: commandHash(key, command, payment.txnid, salt)
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(`${mode === 'live' ? 'https://info.payu.in' : 'https://test.payu.in'}/merchant/postservice.php?form=2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      throw new Error(`PayU verification returned HTTP ${response.status}`);
    }
    const data = await response.json();
    const txn = data && data.transaction_details && data.transaction_details[payment.txnid];
    if (txn && txn.status) {
      await applyPayuCallback(
        {
          ...txn,
          txnid: payment.txnid,
          key,
          hash: txn.hash
        },
        { requireHash: Boolean(txn.hash) }
      );
    }

    const updated = await Payment.findOne({ txnid: payment.txnid });
    res.json(publicPayment(updated));
  } catch (error) {
    console.error('PayU verify error:', error);
    res.status(500).json({ message: 'Could not verify payment with PayU.' });
  }
});

module.exports = router;
