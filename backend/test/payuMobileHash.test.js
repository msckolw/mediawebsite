const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const express = require('express');
const Payment = require('../src/models/Payment');
let sessionStatus = 'pending';
Payment.findOne = async ({ txnid }) => txnid === 'nbm1234567890123abcdef' ? {
  status: sessionStatus, amount: '1.00', productinfo: 'product', firstname: 'first', email: 'a@b.test'
} : null;
const mobileHashRoutes = require('../src/routes/payuMobileHashRoutes');
const { paymentHash } = require('../src/utils/payu');

async function withServer(run) {
  const app = express();
  app.use(express.json({ limit: '8kb' }));
  app.use('/api/payments/payu', mobileHashRoutes);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('mobile payment hash signs only the exact documented V1 payment string', async () => {
  process.env.PAYU_MERCHANT_KEY = 'merchant_key_123';
  process.env.PAYU_MERCHANT_SALT = 'fake-salt';
  await withServer(async (baseUrl) => {
    const send = (data) => fetch(`${baseUrl}/api/payments/payu/hash`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    const payment = 'merchant_key_123|nbm1234567890123abcdef|1.00|product|first|a@b.test|||||||||||';
    const paymentResponse = await send({ hashName: 'payment_hash', hashString: payment });
    assert.equal(paymentResponse.status, 200);
    assert.deepEqual(await paymentResponse.json(), { payment_hash: crypto.createHash('sha512').update(`${payment}fake-salt`).digest('hex') });
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'merchant_key_123|refund|' })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'merchant_key_123|admin|1|x|x|x|||||||||||' })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: `other_key|txn|1|product|first|email||||||||||` })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: payment.slice(0, -1) })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'merchant_key_123|refund|1|x|x|x|||||||||||' })).status, 400);
  });
});

test('auxiliary command hashes match pinned V1 vectors and reject unbound commands', async () => {
  process.env.PAYU_MERCHANT_KEY = 'merchant_key_123';
  process.env.PAYU_MERCHANT_SALT = 'fake-salt';
  const cases = [
    ['getBinInfo', 'getBinInfo', '1', 'bf06ab0c595d3bd47170c19cce85a2ca5d1004e54e2c720b130d01e70e0592fd855c70654384775c44d578f5dc82b61852cc27c91296c459eeeef84f6800e44a'],
    ['validateVPA', 'validateVPA', '9999999999@upi', '527d9e6adcf8ff99d4e07f207887cf37ebf3ba95790aac2fdffd817ab65e8a1f7ae3d95a2432f776a42260a0cad052649b36459a4fba68bcad84b8715642b53f'],
    ['get_checkout_details', 'get_checkout_details', 'txn-123', '14f3d7bb4a1da1509e826f37900d5faf9fe667474f901c3278a1a555594d126cae752d6c4313916f320a0f04940ca6b4dea4200020246f4944f681df3604260c'],
    ['get_eligible_payment_options', 'get_eligible_payment_options', 'txn-123', '42728a117a77e9dff92d826a5534085d980b1ab9ecfd44692a5a1f7b10684cedecb21698dc5b5286c8c9025926178fcabaa779cdf34583dab7d94bf950264206']
  ];
  await withServer(async (baseUrl) => {
    const send = (data) => fetch(`${baseUrl}/api/payments/payu/hash`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
    for (const [hashName, command, var1, expected] of cases) {
      const hashString = `merchant_key_123|${command}|${var1}|`;
      const response = await send({ hashName, hashString });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { [hashName]: expected });
    }
    for (const body of [
      { hashName: 'validateVPA', hashString: 'merchant_key_123|refund|x|' },
      { hashName: 'getBinInfo', hashString: 'other|admin|1|' },
      { hashName: 'getBinInfo', hashString: 'merchant_key_123|admin|1|' },
      { hashName: 'validateVPA', hashString: 'merchant_key_123|validateVPA||' },
      { hashName: 'validateVPA', hashString: 'merchant_key_123|validateVPA|x' },
      { hashName: 'validateVPA', hashString: 'merchant_key_123|validateVPA|x||' },
      { hashName: 'validateVPA', hashString: 'merchant_key_123|validateVPA|x|', postSalt: 'bad' }
    ]) assert.equal((await send(body)).status, 400);
  });
});

test('SHA-512 known vector remains correct', () => {
  assert.equal(crypto.createHash('sha512').update('abc').digest('hex'),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
});

test('mobile hash route validates callback names, input length, and salt overrides', async () => {
  process.env.PAYU_MERCHANT_KEY = 'merchant_key_123';
  process.env.PAYU_MERCHANT_SALT = 'fake-salt';
  await withServer(async (baseUrl) => {
    const send = (body) => fetch(`${baseUrl}/api/payments/payu/hash`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    assert.equal((await send({ hashName: 'lookup api hash', hashString: 'x' })).status, 400);
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'x', hashType: 'V3' })).status, 400);
    const v2 = await send({ hashName: 'payment_hash', hashString: 'merchant_key_123|', hashType: 'V2' });
    assert.equal(v2.status, 400);
    assert.equal((await send({ hashName: 'unknown', hashString: 'x' })).status, 400);
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'x', salt: 'attacker' })).status, 400);
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'x'.repeat(4097) })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'other|txn|x' })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'merchant_key_123||1|product|first|email|||||||||||' })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'merchant_key_123|txn||product|first|email|||||||||||' })).status, 400);
    assert.equal((await send({ hashName: 'payment_hash', hashString: 'merchant_key_123|txn|1|product|first|email|||||||||||x|' })).status, 400);
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'merchant_key_123|validateVPA|vpa|', postSalt: '' })).status, 400);
    assert.equal((await send({ hashName: 'validateVPA', hashString: 'x', merchantSalt: 'override' })).status, 400);
    assert.equal((await send({ hashName: 'adminCommand', hashString: 'x' })).status, 400);
    assert.equal((await send({ hashName: 'lookup api hash', hashString: 'x' })).status, 400);
  });
});

test('payment hashes reject settled sessions and changed checkout fields', async () => {
  process.env.PAYU_MERCHANT_KEY = 'merchant_key_123';
  process.env.PAYU_MERCHANT_SALT = 'fake-salt';
  await withServer(async baseUrl => {
    const send = hashString => fetch(`${baseUrl}/api/payments/payu/hash`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hashName: 'payment_hash', hashString })
    });
    const payment = 'merchant_key_123|nbm1234567890123abcdef|1.00|product|first|a@b.test|||||||||||';
    try {
      sessionStatus = 'success';
      assert.equal((await send(payment)).status, 409);
      sessionStatus = 'failed';
      assert.equal((await send(payment)).status, 409);
      sessionStatus = 'pending';
      assert.equal((await send(payment.replace('|1.00|', '|2.00|'))).status, 400);
      assert.equal((await send(payment.replace('abcdef', 'abcdee'))).status, 404);
    } finally { sessionStatus = 'pending'; }
  });
});

test('mobile hash route requires merchant configuration and rate-limits clients', async () => {
  const originalKey = process.env.PAYU_MERCHANT_KEY;
  const originalSalt = process.env.PAYU_MERCHANT_SALT;
  try {
    delete process.env.PAYU_MERCHANT_KEY;
    process.env.PAYU_MERCHANT_SALT = 'fake-salt';
    await withServer(async (baseUrl) => {
      const send = () => fetch(`${baseUrl}/api/payments/payu/hash`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hashName: 'validateVPA', hashString: 'x' })
      });
      assert.equal((await send()).status, 503);
      process.env.PAYU_MERCHANT_KEY = 'merchant_key_123';
      const statuses = [];
      for (let i = 0; i < 61; i += 1) statuses.push((await send()).status);
      assert.ok(statuses.some((status) => status === 429));
    });
  } finally {
    if (originalKey === undefined) delete process.env.PAYU_MERCHANT_KEY;
    else process.env.PAYU_MERCHANT_KEY = originalKey;
    if (originalSalt === undefined) delete process.env.PAYU_MERCHANT_SALT;
    else process.env.PAYU_MERCHANT_SALT = originalSalt;
  }
});

test('existing web payment hash is unchanged', () => {
  const expected = 'ace800af9d22ec52db0af05b48f1e86f20ff5c009747432e79b7c7faffb080a77856ebd0814a3681c3c2314ab0f39bcdc2f745e29072587b5ede69e9fe4aa88a';
  assert.equal(paymentHash({ key: 'key', txnid: 'txnid', amount: '10.00', productinfo: 'product',
    firstname: 'name', email: 'email@example.com', salt: 'salt' }), expected);
});
