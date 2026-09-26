const crypto = require('crypto');

let cachedToken = null;
let cachedUntil = 0;

function config() {
  const mode = String(process.env.PHONEPE_MODE || 'sandbox').toLowerCase();
  const sandbox = mode !== 'live';
  return {
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    clientVersion: process.env.PHONEPE_CLIENT_VERSION,
    authUrl: process.env.PHONEPE_AUTH_URL || (sandbox
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
      : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'),
    apiBase: (process.env.PHONEPE_API_BASE_URL || (sandbox
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/pg')).replace(/\/$/, ''),
    webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME,
    webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD
  };
}

async function request(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`PhonePe request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function accessToken() {
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;
  const { clientId, clientSecret, clientVersion, authUrl } = config();
  if (!clientId || !clientSecret || !clientVersion) throw new Error('PhonePe is not configured.');
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    client_version: String(clientVersion),
    grant_type: 'client_credentials'
  });
  const data = await request(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!data.access_token) throw new Error('PhonePe did not return an access token.');
  cachedToken = data.access_token;
  const expiresAt = Number(data.expires_at);
  cachedUntil = Number.isFinite(expiresAt) && expiresAt > 0
    ? expiresAt * 1000 - 60000
    : Date.now() + 5 * 60 * 1000;
  return cachedToken;
}

async function authorizedRequest(path, options = {}) {
  const token = await accessToken();
  return request(`${config().apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `O-Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

async function createPayment(payment, redirectUrl) {
  const amount = Math.round(Number(payment.amount) * 100);
  if (!Number.isSafeInteger(amount) || amount < 1000) throw new Error('Invalid amount for PhonePe.');
  const data = await authorizedRequest('/checkout/v2/pay', {
    method: 'POST',
    body: JSON.stringify({
      merchantOrderId: payment.txnid,
      amount,
      expireAfter: 1200,
      disablePaymentRetry: true,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: { redirectUrl },
        paymentModeConfig: {
          version: 'V2',
          enabledPaymentModes: [{ type: {
            upi: 'UPI', card: 'CARD', netbanking: 'NET_BANKING'
          }[payment.method] }]
        }
      }
    })
  });
  if (!data.redirectUrl || !/^https:\/\//i.test(data.redirectUrl)) {
    throw new Error('PhonePe did not return a secure checkout URL.');
  }
  return { type: 'phonepe', url: data.redirectUrl, providerOrderId: data.orderId };
}

async function getOrderStatus(merchantOrderId) {
  return authorizedRequest(`/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`, {
    method: 'GET'
  });
}

function normalizedStatus(state) {
  switch (String(state || '').toUpperCase()) {
    case 'COMPLETED': return 'success';
    case 'FAILED': return 'failed';
    default: return 'pending';
  }
}

function verifyWebhookAuthorization(header) {
  const { webhookUsername, webhookPassword } = config();
  if (!webhookUsername || !webhookPassword || !header) return false;
  const expected = Buffer.from(crypto.createHash('sha256')
    .update(`${webhookUsername}:${webhookPassword}`).digest('hex'));
  const received = Buffer.from(String(header).toLowerCase());
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = { config, createPayment, getOrderStatus, normalizedStatus, verifyWebhookAuthorization };
