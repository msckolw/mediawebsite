const express = require('express');
const crypto = require('crypto');
const Payment = require('../models/Payment');

const router = express.Router();
const MAX_HASH_STRING_LENGTH = 4096;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_MAX_CLIENTS = 10000;
const requestsByClient = new Map();
const PAYMENT_FIELD_COUNT = 16;

// Checkout Pro requests initialization hashes before showing payment methods.
// Keep a finite list: this endpoint must never sign arbitrary merchant commands.
const AUXILIARY_HASH_NAMES = new Set([
  'getBinInfo', 'validateVPA', 'get_checkout_details', 'get_eligible_payment_options',
  'get_sdk_configuration', 'get_all_offer_details', 'quickPayEvent',
  'eligibleBinsForEMI', 'payment_source', 'payment_related_details_for_mobile_sdk'
]);

function isRateLimited(clientId, now) {
  if (requestsByClient.size >= RATE_LIMIT_MAX_CLIENTS && !requestsByClient.has(clientId)) {
    for (const [id, entry] of requestsByClient) {
      if (now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) requestsByClient.delete(id);
    }
    if (requestsByClient.size >= RATE_LIMIT_MAX_CLIENTS) {
      requestsByClient.delete(requestsByClient.keys().next().value);
    }
  }

  let entry = requestsByClient.get(clientId);
  if (!entry || now - entry.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    entry = { windowStartedAt: now, count: 0 };
    requestsByClient.set(clientId, entry);
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

router.post('/hash', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (isRateLimited(req.ip || req.socket.remoteAddress || 'unknown', Date.now())) {
    return res.status(429).json({ message: 'Too many hash requests. Try again shortly.' });
  }

  const { PAYU_MERCHANT_KEY: merchantKey, PAYU_MERCHANT_SALT: salt } = process.env;
  if (!merchantKey || !salt || !/^[A-Za-z0-9_-]{1,128}$/.test(merchantKey)) {
    return res.status(503).json({ message: 'PayU mobile hash generation is not configured.' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Expected hashName and hashString.' });
  }
  if (Object.prototype.hasOwnProperty.call(body, 'salt') || Object.prototype.hasOwnProperty.call(body, 'merchantSalt')) {
    return res.status(400).json({ message: 'Salt overrides are not accepted.' });
  }

  const { hashName, hashString } = body;
  if (typeof hashName !== 'string' || hashName.length > 100 || typeof hashString !== 'string' ||
      hashString.length === 0 || hashString.length > MAX_HASH_STRING_LENGTH) {
    return res.status(400).json({ message: 'Invalid hashName or hashString.' });
  }

  const hashType = body.hashType == null || body.hashType === '' ? 'V1' : body.hashType;
  if (!['V1', 'V2'].includes(hashType)) {
    return res.status(400).json({ message: `Unsupported hash type: ${String(hashType).slice(0, 100)}.` });
  }

  let postSalt = '';
  if (hashName === 'payment_hash') {
    const fields = hashString.split('|');
    if (!hashString.endsWith('|') || fields.length !== PAYMENT_FIELD_COUNT + 1 || fields[0] !== merchantKey ||
        !/^nbm\d{13}[0-9a-f]{6}$/.test(fields[1]) || !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(fields[2]) || fields.slice(11, 16).some((field) => field !== '')) {
      return res.status(400).json({ message: 'payment_hash: invalid format.' });
    }
    if (body.postSalt != null && (typeof body.postSalt !== 'string' || body.postSalt.length > 1024 || body.postSalt.includes('|'))) {
      return res.status(400).json({ message: 'Invalid postSalt.' });
    }
    let payment;
    try { payment = await Payment.findOne({ txnid: fields[1], gateway: 'payu' }); }
    catch (error) { return res.status(503).json({ message: 'Could not verify the payment session.' }); }
    if (!payment) return res.status(404).json({ message: 'Payment session not found.' });
    if (payment.status !== 'pending') {
      return res.status(409).json({ code: payment.status === 'success' ? 'ALREADY_PAID' : 'PAYMENT_RESOLVED',
        nextAction: 'check_status', message: 'This payment session is no longer open.' });
    }
    // SDKs can format 50.00 as 50. Validate its value, but sign the original
    // string byte-for-byte so PayU receives the hash for the SDK's own input.
    if (Number(fields[2]).toFixed(2) !== payment.amount || fields[3] !== payment.productinfo ||
        fields[4] !== payment.firstname || fields[5] !== payment.email ||
        fields.slice(6, 11).some(field => field !== '')) {
      return res.status(400).json({ message: 'Payment hash fields do not match the checkout session.' });
    }
    postSalt = body.postSalt || '';
  } else {
    const fields = hashString.split('|');
    if (!AUXILIARY_HASH_NAMES.has(hashName) || fields.length !== 4 ||
        fields[0] !== merchantKey || fields[1] !== hashName ||
        !fields[2].trim() || fields[3] !== '' || /[\r\n\0]/.test(hashString)) {
      return res.status(400).json({ message: 'Unsupported SDK command or invalid hash format.' });
    }
    if (body.postSalt != null && body.postSalt !== '') {
      return res.status(400).json({ message: 'postSalt is only valid for payment_hash.' });
    }
  }

  if (hashType === 'V2' && postSalt) {
    return res.status(400).json({ message: 'postSalt is only supported for V1 payment hashes.' });
  }
  // PayU V2 signs the original string using the merchant salt as the HMAC key;
  // V1 appends the salt (and optional payment postSalt) before SHA-512.
  const hash = hashType === 'V2'
    ? crypto.createHmac('sha256', salt).update(hashString, 'utf8').digest('hex')
    : crypto.createHash('sha512').update(`${hashString}${salt}${postSalt}`, 'utf8').digest('hex');
  return res.json({ [hashName]: hash });
});

module.exports = router;
