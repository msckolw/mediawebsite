const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { configuredGateways } = require('../src/services/gatewaySelection');
const phonepe = require('../src/services/phonepeGateway');
const payu = require('../src/services/payuGateway');

test('routes only eligible web payment methods', () => {
  Object.assign(process.env, {
    PAYMENT_ENABLED_GATEWAYS: 'phonepe,payu',
    PHONEPE_CLIENT_ID: 'client', PHONEPE_CLIENT_SECRET: 'secret', PHONEPE_CLIENT_VERSION: '1',
    PAYU_MERCHANT_KEY: 'key', PAYU_MERCHANT_SALT: 'salt'
  });
  delete process.env.PAYU_DBQR_ENABLED;
  assert.deepEqual(configuredGateways('upi', 'web'), ['phonepe']);
  process.env.PAYU_DBQR_ENABLED = 'true';
  assert.deepEqual(configuredGateways('upi', 'web'), ['payu', 'phonepe']);
  assert.deepEqual(configuredGateways('card', 'web'), ['phonepe']);
  assert.deepEqual(configuredGateways('netbanking', 'web'), ['phonepe']);
});

test('PhonePe webhook checks SHA256 credentials', () => {
  process.env.PHONEPE_WEBHOOK_USERNAME = 'user';
  process.env.PHONEPE_WEBHOOK_PASSWORD = 'password';
  const signature = crypto.createHash('sha256').update('user:password').digest('hex');
  assert.equal(phonepe.verifyWebhookAuthorization(signature), true);
  assert.equal(phonepe.verifyWebhookAuthorization('Basic dXNlcjpwYXNzd29yZA=='), false);
});

test('PayU QR accepts a matching amount and rejects a different one', async () => {
  Object.assign(process.env, {
    PAYU_MODE: 'test', PUBLIC_API_URL: 'https://api.example.org',
    PAYU_DBQR_ENABLED: 'true', PAYU_MERCHANT_KEY: 'key', PAYU_MERCHANT_SALT: 'salt'
  });
  const originalFetch = global.fetch;
  const payment = {
    txnid: 'nbm1234567890123abcdef', amount: '100.00', productinfo: 'NBM Donation',
    firstname: 'Test Donor', email: 'donor@example.org', phone: '9876543210'
  };
  const request = { headers: { 'user-agent': 'Test' }, ip: '127.0.0.1' };
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://test.payu.in/_payment');
      assert.equal(options.body.get('pg'), 'DBQR');
      assert.equal(options.body.get('bankcode'), 'UPIDBQR');
      return { ok: true, json: async () => ({ result: {
        qrString: 'upi://pay?pa=merchant@upi&am=100.00', amount: '100.00'
      } }) };
    };
    const checkout = await payu.createQrPayment(payment, request);
    assert.equal(checkout.type, 'payu_qr');
    assert.match(checkout.qrImage, /^data:image\/png;base64,/);
    global.fetch = async () => ({ ok: true, json: async () => ({ result: {
      qrString: 'upi://pay?pa=merchant@upi&am=200.00', amount: '100.00'
    } }) });
    await assert.rejects(payu.createQrPayment(payment, request), /valid UPI QR/);
  } finally {
    global.fetch = originalFetch;
  }
});
