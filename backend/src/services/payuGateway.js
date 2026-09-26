const { paymentHash, commandHash, payuConfig, mapPayuStatus } = require('../utils/payu');
const QRCode = require('qrcode');

function createPayment(payment) {
  const { key, salt, baseUrl, publicApiUrl } = payuConfig();
  if (!key || !salt || !publicApiUrl) throw new Error('PayU is not configured.');
  const fields = {
    key,
    txnid: payment.txnid,
    amount: payment.amount,
    productinfo: payment.productinfo,
    firstname: payment.firstname,
    email: payment.email,
    phone: payment.phone,
    surl: `${publicApiUrl}/api/payments/payu/success`,
    furl: `${publicApiUrl}/api/payments/payu/failure`,
    hash: paymentHash({
      key, salt, txnid: payment.txnid, amount: payment.amount,
      productinfo: payment.productinfo, firstname: payment.firstname,
      email: payment.email
    })
  };
  if (payment.method === 'upi') fields.pg = 'UPI';
  if (payment.method === 'card') fields.pg = 'CC';
  return { type: 'payu_form', url: `${baseUrl}/_payment`, fields };
}

async function createQrPayment(payment, request) {
  const { key, salt, baseUrl, publicApiUrl } = payuConfig();
  if (!key || !salt || !publicApiUrl ||
      (process.env.NODE_ENV === 'production' && !publicApiUrl.startsWith('https://')) ||
      process.env.PAYU_DBQR_ENABLED !== 'true') {
    throw new Error('PayU dynamic QR is not configured.');
  }
  const fields = {
    key, txnid: payment.txnid, amount: payment.amount,
    productinfo: payment.productinfo, firstname: payment.firstname,
    email: payment.email, phone: payment.phone,
    surl: `${publicApiUrl}/api/payments/payu/success`,
    furl: `${publicApiUrl}/api/payments/payu/failure`,
    pg: 'DBQR', bankcode: 'UPIDBQR', txn_s2s_flow: '4',
    s2s_client_ip: String(request.headers['x-forwarded-for'] || request.ip || '').split(',')[0].trim(),
    s2s_device_info: String(request.headers['user-agent'] || 'NBM Web').slice(0, 500),
    hash: paymentHash({ key, salt, txnid: payment.txnid, amount: payment.amount,
      productinfo: payment.productinfo, firstname: payment.firstname, email: payment.email })
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl}/_payment`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields), signal: controller.signal
    });
    if (!response.ok) throw new Error(`PayU QR request failed (${response.status}).`);
    const data = await response.json();
    const uri = data?.result?.qrString;
    const uriAmount = uri && /^upi:\/\/pay\?/i.test(uri) ? new URL(uri).searchParams.get('am') : null;
    if (!/^upi:\/\/pay\?/i.test(uri || '') ||
        (uriAmount && Number(uriAmount).toFixed(2) !== payment.amount) ||
        (data?.result?.amount && Number(data.result.amount).toFixed(2) !== payment.amount)) {
      throw new Error('PayU did not return a valid UPI QR for this amount.');
    }
    return { type: 'payu_qr', qrImage: await QRCode.toDataURL(uri), uri };
  } finally {
    clearTimeout(timeout);
  }
}

async function getPaymentStatus(payment) {
  const { key, salt, mode } = payuConfig();
  if (!key || !salt) throw new Error('PayU is not configured.');
  const body = new URLSearchParams({
    key,
    command: 'verify_payment',
    var1: payment.txnid,
    hash: commandHash(key, 'verify_payment', payment.txnid, salt)
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const verifyHost = mode === 'live' ? 'https://info.payu.in' : 'https://test.payu.in';
    const response = await fetch(`${verifyHost}/merchant/postservice.php?form=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`PayU status request failed (${response.status}).`);
    const data = await response.json();
    const transaction = data?.transaction_details?.[payment.txnid];
    if (!transaction) return null;
    if (transaction.amount && Number(transaction.amount).toFixed(2) !== payment.amount) {
      throw new Error('PayU returned a different payment amount.');
    }
    return { status: mapPayuStatus(transaction.status), raw: transaction };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { createPayment, createQrPayment, getPaymentStatus };
