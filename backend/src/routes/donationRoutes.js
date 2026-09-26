const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Payment = require('../models/Payment');
const payu = require('../services/payuGateway');
const phonepe = require('../services/phonepeGateway');
const { selectGateway } = require('../services/gatewaySelection');
const { applyVerifiedStatus } = require('../services/paymentState');

const router = express.Router();
const MAX_AMOUNT = 100000;

function publicDonation(donation, payment, includeCheckout = false) {
  const result = {
    id: String(donation._id),
    amount: donation.amount,
    method: donation.method,
    platform: donation.platform,
    status: donation.status === 'success' ? 'success' : payment?.status || 'pending',
    gateway: payment?.gateway || null,
    transactionId: payment?.txnid || null
  };
  if (includeCheckout) result.checkout = payment?.checkout || null;
  return result;
}

function validateDonation(body) {
  const amount = Number(body.amount);
  const firstname = String(body.firstname || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').replace(/\s+/g, '');
  const method = String(body.method || '').toLowerCase();
  const platform = String(body.platform || '').toLowerCase();
  const idempotencyKey = String(body.idempotencyKey || '');
  if (!Number.isFinite(amount) || amount < 10 || amount > MAX_AMOUNT || Math.round(amount * 100) !== amount * 100) {
    throw new Error('Enter an amount between ₹10 and ₹1,00,000, with at most two decimal places.');
  }
  if (firstname.length < 2 || firstname.length > 100) throw new Error('Enter your name.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Enter a valid Indian mobile number.');
  if (!['upi', 'card', 'netbanking'].includes(method)) throw new Error('Select a payment method.');
  if (!['web', 'app'].includes(platform)) throw new Error('Select a valid platform.');
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) throw new Error('Invalid payment request ID.');
  return { amount: amount.toFixed(2), firstname, email, phone, method, platform, idempotencyKey };
}

router.post('/donations', async (req, res) => {
  let details;
  try {
    details = validateDonation(req.body || {});
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    let donation;
    try {
      donation = await Donation.findOneAndUpdate(
        { idempotencyKey: details.idempotencyKey },
        { $setOnInsert: details },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      donation = await Donation.findOne({ idempotencyKey: details.idempotencyKey });
    }
    const same = ['amount', 'firstname', 'email', 'phone', 'method', 'platform']
      .every(key => donation[key] === details[key]);
    if (!same) return res.status(409).json({ message: 'This payment request ID belongs to a different donation.' });
    const payment = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    res.json(publicDonation(donation, payment, true));
  } catch (error) {
    console.error('Donation creation failed:', error);
    res.status(500).json({ message: 'Could not start the donation.' });
  }
});

router.post('/donations/:id/checkout', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation ID.' });
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    if (donation.status === 'success') return res.status(409).json({ message: 'This donation has already been paid.' });
    const previous = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    if (previous && previous.status !== 'failed') {
      return res.status(previous.checkout ? 200 : 409).json(previous.checkout
        ? publicDonation(donation, previous, true)
        : { message: 'The previous payment is still being verified. Please check its status before retrying.' });
    }

    const frontendUrl = String(process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')).replace(/\/$/, '');
    if (!frontendUrl || (process.env.NODE_ENV === 'production' && !frontendUrl.startsWith('https://'))) {
      throw new Error('The checkout return URL is not configured.');
    }
    const gateway = selectGateway(donation.method, donation.platform);
    const txnid = `nbm${Date.now()}${crypto.randomBytes(3).toString('hex')}`;
    const payment = await Payment.create({
      txnid, donation: donation._id, gateway, gatewayOrderId: txnid,
      amount: donation.amount, productinfo: 'NBM Donation',
      firstname: donation.firstname, email: donation.email, phone: donation.phone,
      method: donation.method, status: 'pending'
    });
    const claimed = await Donation.findOneAndUpdate({
      _id: donation._id,
      status: 'pending',
      activePayment: previous ? previous._id : null
    }, { $set: { activePayment: payment._id } }, { new: true });
    if (!claimed) {
      await Payment.deleteOne({ _id: payment._id });
      return res.status(409).json({ message: 'A payment was already started. Check its status.' });
    }

    const checkout = gateway === 'payu'
      ? (process.env.PAYU_DBQR_ENABLED === 'true' && payment.method === 'upi'
          ? await payu.createQrPayment(payment, req)
          : payu.createPayment(payment))
      : await phonepe.createPayment(payment, `${frontendUrl}/donate/status?donationId=${donation._id}`);
    if (gateway === 'phonepe') payment.gatewayOrderId = checkout.providerOrderId;
    payment.checkout = checkout;
    await payment.save();
    res.json(publicDonation(claimed, payment, true));
  } catch (error) {
    console.error('Donation checkout failed:', error);
    res.status(503).json({ message: error.message || 'Could not start checkout.' });
  }
});

async function verifyPayment(payment) {
  if (payment.gateway === 'phonepe') {
    const result = await phonepe.getOrderStatus(payment.txnid);
    if (Number(result.amount) !== Math.round(Number(payment.amount) * 100)) {
      throw new Error('PhonePe returned a different payment amount.');
    }
    return applyVerifiedStatus(payment, phonepe.normalizedStatus(result.state), {
      gatewayOrderId: String(result.orderId || payment.gatewayOrderId || payment.txnid)
    });
  }
  const result = await payu.getPaymentStatus(payment);
  return result ? applyVerifiedStatus(payment, result.status) : payment;
}

router.get('/donations/:id/status', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation ID.' });
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    let payment = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    if (payment && payment.status === 'pending' &&
        (!payment.lastVerifiedAt || Date.now() - payment.lastVerifiedAt.getTime() >= 10000)) {
      payment.lastVerifiedAt = new Date();
      await payment.save();
      try { payment = await verifyPayment(payment); }
      catch (error) { console.error('Payment status check failed:', error); }
    }
    const current = await Donation.findById(donation._id);
    res.json(publicDonation(current, payment));
  } catch (error) {
    console.error('Donation status failed:', error);
    res.status(500).json({ message: 'Could not load donation status.' });
  }
});

router.post('/payments/phonepe/webhook', async (req, res) => {
  if (!phonepe.verifyWebhookAuthorization(req.headers.authorization)) {
    return res.status(401).json({ received: false });
  }
  try {
    const orderId = String(req.body?.payload?.merchantOrderId || req.body?.merchantOrderId || '');
    if (!/^nbm\d{13}[0-9a-f]{6}$/.test(orderId)) return res.status(400).json({ received: false });
    const payment = await Payment.findOne({ txnid: orderId, gateway: 'phonepe' });
    if (!payment) return res.status(404).json({ received: false });
    await verifyPayment(payment);
    res.json({ received: true });
  } catch (error) {
    console.error('PhonePe webhook failed:', error);
    res.status(500).json({ received: false });
  }
});

module.exports = router;
