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
  if (includeCheckout) result.checkout = result.status === 'pending' ? payment?.checkout || null : null;
  return result;
}

function validateDonation(body) {
  const amountText = typeof body.amount === 'string' || typeof body.amount === 'number'
    ? String(body.amount).trim() : '';
  const [rupees, fraction = ''] = amountText.split('.');
  const amountPaise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  const firstname = String(body.firstname || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').replace(/\s+/g, '');
  const method = String(body.method || '').toLowerCase();
  const platform = String(body.platform || '').toLowerCase();
  const idempotencyKey = String(body.idempotencyKey || '');
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(amountText) ||
      !Number.isSafeInteger(amountPaise) || amountPaise < 1000 || amountPaise > MAX_AMOUNT * 100) {
    throw new Error('Enter an amount between ₹10 and ₹1,00,000, with at most two decimal places.');
  }
  if (firstname.length < 2 || firstname.length > 100) throw new Error('Enter your name.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Enter a valid Indian mobile number.');
  if (!['upi', 'card', 'netbanking', 'all'].includes(method)) throw new Error('Select a payment method.');
  if (!['web', 'app'].includes(platform)) throw new Error('Select a valid platform.');
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) throw new Error('Invalid payment request ID.');
  return { amount: (amountPaise / 100).toFixed(2), firstname, email, phone, method, platform, idempotencyKey };
}

router.post('/donations', async (req, res) => {
  res.set('Cache-Control', 'no-store');
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
    res.json({ ...publicDonation(donation, payment), checkout: null });
  } catch (error) {
    console.error('Donation creation failed:', error);
    res.status(500).json({ message: 'Could not start the donation.' });
  }
});

function paymentConflict(res, donation, payment, code, message) {
  return res.status(409).json({
    ...publicDonation(donation, payment), checkout: null,
    code, message, nextAction: 'check_status'
  });
}

router.post('/donations/:id/checkout', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation ID.' });
  let payment;
  let remoteInitiationStarted = false;
  try {
    let donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    let previous = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    if (donation.status === 'success' || previous?.status === 'success') {
      if (previous?.status === 'success') await applyVerifiedStatus(previous, 'success');
      return paymentConflict(res, donation, previous, 'ALREADY_PAID', 'This donation has already been paid.');
    }
    if (previous && previous.initiationState !== 'not_started') {
      // The SDK callback is not proof of settlement. Reconcile even legacy records
      // marked failed by the old cancellation endpoint before allowing another charge.
      try { previous = await verifyPayment(previous); }
      catch (error) {
        console.error('Checkout reconciliation failed:', error);
        return paymentConflict(res, donation, previous, 'PAYMENT_UNVERIFIED',
          'The previous payment could not be verified. Check its status before retrying.');
      }
      donation = await Donation.findById(donation._id);
      if (donation.status === 'success' || previous?.status === 'success') {
        return paymentConflict(res, donation, previous, 'ALREADY_PAID', 'This donation has already been paid.');
      }
      if (!previous || previous.status !== 'failed') {
        return paymentConflict(res, donation, previous, 'PAYMENT_PENDING',
          'A payment is already in progress. Check its status; do not reopen the SDK with the old transaction ID.');
      }
    }

    const frontendUrl = String(process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')).replace(/\/$/, '');
    if (!frontendUrl || (process.env.NODE_ENV === 'production' && !frontendUrl.startsWith('https://'))) {
      throw new Error('The checkout return URL is not configured.');
    }
    const gateway = selectGateway(donation.method, donation.platform);
    const txnid = `nbm${Date.now()}${crypto.randomBytes(3).toString('hex')}`;
    payment = await Payment.create({
      txnid, donation: donation._id, gateway, gatewayOrderId: txnid,
      amount: donation.amount, productinfo: 'NBM Donation',
      firstname: donation.firstname, email: donation.email, phone: donation.phone,
      method: donation.method, status: 'pending', initiationState: 'creating'
    });
    const claimed = await Donation.findOneAndUpdate({
      _id: donation._id, status: 'pending',
      activePayment: previous ? previous._id : null
    }, { $set: { activePayment: payment._id } }, { new: true });
    if (!claimed) {
      await Payment.deleteOne({ _id: payment._id });
      payment = null;
      return paymentConflict(res, donation, previous, 'PAYMENT_PENDING', 'A payment was already started. Check its status.');
    }

    let checkout;
    if (gateway === 'payu' && !(process.env.PAYU_DBQR_ENABLED === 'true' &&
        donation.platform === 'web' && payment.method === 'upi')) {
      // Native SDK checkout always needs form fields, never a web QR response.
      checkout = payu.createPayment(payment);
    } else {
      remoteInitiationStarted = true;
      checkout = gateway === 'payu' ? await payu.createQrPayment(payment, req)
        : await phonepe.createPayment(payment, `${frontendUrl}/donate/status?donationId=${donation._id}`);
    }
    const details = { checkout, initiationState: 'ready', updatedAt: new Date() };
    if (gateway === 'phonepe') details.gatewayOrderId = checkout.providerOrderId;
    await Payment.findOneAndUpdate({ _id: payment._id }, { $set: details }, { new: true });
    // Re-read after initialization: a webhook may have confirmed payment meanwhile.
    payment = await Payment.findById(payment._id);
    donation = await Donation.findById(donation._id);
    if (donation.status === 'success' || payment.status === 'success') {
      return paymentConflict(res, donation, payment, 'ALREADY_PAID', 'This donation has already been paid.');
    }
    if (payment.status !== 'pending') {
      return paymentConflict(res, donation, payment, 'PAYMENT_RESOLVED', 'Check this payment status before retrying.');
    }
    res.json(publicDonation(donation, payment, true));
  } catch (error) {
    console.error('Donation checkout failed:', error);
    if (payment) {
      // A local failure cannot have charged the donor. A remote timeout can, so
      // retain pending status until the provider reports a definitive outcome.
      await Payment.findOneAndUpdate({ _id: payment._id, status: 'pending' }, {
        $set: remoteInitiationStarted
          ? { initiationState: 'unknown', updatedAt: new Date() }
          : { status: 'failed', initiationState: 'not_started', updatedAt: new Date() }
      }).catch(err => console.error('Checkout recovery failed:', err));
    }
    res.status(503).json({ code: 'CHECKOUT_UNAVAILABLE', nextAction: 'check_status',
      message: 'Could not start checkout. Check the donation status before retrying.' });
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
  if (!result) {
    // A missing provider record does not prove that a delayed request failed.
    throw new Error('The provider has not confirmed this transaction.');
  }
  return applyVerifiedStatus(payment, result.status);
}

router.get('/donations/:id/status', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation ID.' });
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    let payment = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    if (payment && payment.status !== 'success' && payment.initiationState !== 'not_started' &&
        (!payment.lastVerifiedAt || Date.now() - payment.lastVerifiedAt.getTime() >= 10000)) {
      await Payment.findOneAndUpdate({ _id: payment._id }, { $set: { lastVerifiedAt: new Date() } });
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

// Mobile app uses txnid from PayU SDK callback — look up donation by txnid
router.get('/donations/by-txnid/:txnid', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const txnid = String(req.params.txnid || '');
  if (!/^nbm\d{13}[0-9a-f]{6}$/.test(txnid)) {
    return res.status(400).json({ message: 'Invalid transaction ID.' });
  }
  try {
    const payment = await Payment.findOne({ txnid });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // Also repair legacy failures written by SDK cancellation without verification.
    if (payment.status === 'pending' &&
        (!payment.lastVerifiedAt || Date.now() - payment.lastVerifiedAt.getTime() >= 10000)) {
      await Payment.findOneAndUpdate({ _id: payment._id }, { $set: { lastVerifiedAt: new Date() } });
      try { await verifyPayment(payment); } catch (e) { console.error('Verify error:', e); }
    }

    const updatedPayment = await Payment.findOne({ txnid });
    const donation = updatedPayment.donation
      ? await Donation.findById(updatedPayment.donation)
      : null;

    res.json({
      txnid: updatedPayment.txnid,
      donationId: donation ? String(donation._id) : null,
      amount: updatedPayment.amount,
      status: updatedPayment.status,
      gateway: updatedPayment.gateway,
      method: updatedPayment.method,
      createdAt: updatedPayment.createdAt,
      updatedAt: updatedPayment.updatedAt
    });
  } catch (error) {
    console.error('Txnid status lookup failed:', error);
    res.status(500).json({ message: 'Could not load payment status.' });
  }
});

// Cancellation from the SDK is advisory: only a verified provider failure permits retry.
router.post('/donations/:id/cancel', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid donation ID.' });
  try {
    let donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });
    let payment = donation.activePayment ? await Payment.findById(donation.activePayment) : null;
    if (donation.status === 'success' || payment?.status === 'success') {
      return paymentConflict(res, donation, payment, 'ALREADY_PAID', 'This donation has already been paid.');
    }
    if (payment && payment.initiationState !== 'not_started') {
      try { payment = await verifyPayment(payment); }
      catch (error) {
        console.error('Cancellation reconciliation failed:', error);
        return res.status(202).json({ ...publicDonation(donation, payment), checkout: null,
          code: 'PAYMENT_UNVERIFIED', nextAction: 'check_status',
          message: 'Payment could not be verified. Do not start another payment yet.' });
      }
    }
    donation = await Donation.findById(donation._id);
    if (donation.status === 'success' || payment?.status === 'success') {
      return paymentConflict(res, donation, payment, 'ALREADY_PAID', 'This donation has already been paid.');
    }
    if (payment && payment.status !== 'failed') {
      return res.status(202).json({ ...publicDonation(donation, payment), checkout: null,
        code: 'PAYMENT_PENDING', nextAction: 'check_status',
        message: 'Payment is still pending with the provider. Do not start another payment yet.' });
    }
    res.json({ ...publicDonation(donation, payment), checkout: null,
      nextAction: 'retry_checkout', message: 'No confirmed payment. You can retry checkout for this donation.' });
  } catch (error) {
    console.error('Donation cancel failed:', error);
    res.status(500).json({ message: 'Could not check payment cancellation.' });
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
