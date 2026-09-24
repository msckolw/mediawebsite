const crypto = require('crypto');

function sha512(value) {
  return crypto.createHash('sha512').update(value).digest('hex');
}

function empty(value) {
  return value === undefined || value === null ? '' : String(value);
}

function paymentHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  salt
}) {
  const plaintext = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    empty(udf1),
    empty(udf2),
    empty(udf3),
    empty(udf4),
    empty(udf5),
    '',
    '',
    '',
    '',
    '',
    salt
  ].join('|');
  return sha512(plaintext);
}

function commandHash(key, command, var1, salt) {
  return sha512(`${key}|${command}|${var1}|${salt}`);
}

function responseHashCandidates(params, salt) {
  const status = empty(params.status);
  const udf5 = empty(params.udf5);
  const udf4 = empty(params.udf4);
  const udf3 = empty(params.udf3);
  const udf2 = empty(params.udf2);
  const udf1 = empty(params.udf1);
  const email = empty(params.email);
  const firstname = empty(params.firstname);
  const productinfo = empty(params.productinfo);
  const amount = empty(params.amount);
  const txnid = empty(params.txnid);
  const key = empty(params.key);
  const additionalCharges = empty(params.additionalCharges);

  const base = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const hashes = [sha512(base)];
  if (additionalCharges) {
    hashes.push(sha512(`${additionalCharges}|${base}`));
  }
  return hashes;
}

function isValidResponseHash(params, salt) {
  const received = empty(params.hash).toLowerCase();
  if (!received) return false;
  return responseHashCandidates(params, salt).some((hash) => hash === received);
}

function payuBaseUrl() {
  return String(process.env.PAYU_MODE || 'test').toLowerCase() === 'live'
    ? 'https://secure.payu.in'
    : 'https://test.payu.in';
}

function mapPayuStatus(status) {
  const value = empty(status).toLowerCase();
  if (['success', 'captured'].includes(value)) return 'success';
  if (['pending', 'auth', 'authsuccess', 'initiated'].includes(value)) return 'pending';
  if (['failure', 'failed', 'dropped', 'bounced', 'cancelled', 'cancel'].includes(value)) {
    return 'failed';
  }
  return value || 'pending';
}

function payuConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const mode = String(process.env.PAYU_MODE || (isProduction ? '' : 'test')).toLowerCase();
  const publicApiUrl = (process.env.PUBLIC_API_URL || (isProduction ? '' : 'http://localhost:5002')).replace(/\/$/, '');
  const frontendUrl = (process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:3000')).replace(/\/$/, '');
  return { key, salt, mode, publicApiUrl, frontendUrl, baseUrl: payuBaseUrl(), isProduction };
}

module.exports = {
  paymentHash,
  commandHash,
  isValidResponseHash,
  payuBaseUrl,
  mapPayuStatus,
  payuConfig
};
