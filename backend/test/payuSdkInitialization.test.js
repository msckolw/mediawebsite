const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const key = 'merchant_key_123';
const salt = 'fake-salt';
const txnid = 'nbm1234567890123abcdef';
const paymentString = `${key}|${txnid}|50.00|NBM Donation|Test Donor|donor@example.org|||||||||||`;

function harness() {
  let queries = 0;
  const payment = { status: 'pending', amount: '50.00', productinfo: 'NBM Donation',
    firstname: 'Test Donor', email: 'donor@example.org' };
  const Payment = { async findOne(query) {
    queries++;
    assert.equal(query.gateway, 'payu');
    return query.txnid === txnid ? payment : null;
  } };
  const sandbox = { module: { exports: {} }, process: { env: {
    PAYU_MERCHANT_KEY: key, PAYU_MERCHANT_SALT: salt
  } }, require: name => name === '../models/Payment' ? Payment : require(name) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/routes/payuMobileHashRoutes.js'), 'utf8'), sandbox);
  const handler = sandbox.module.exports.stack.find(layer => layer.route?.path === '/hash').route.stack[0].handle;
  return { payment, get queries() { return queries; }, async send(body) {
    const res = { statusCode: 200, headers: {}, set(name, value) { this.headers[name] = value; return this; },
      status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    await handler({ body, ip: '127.0.0.1' }, res);
    return res;
  } };
}

test('Checkout Pro initialization callbacks receive V1 hashes instead of HTTP 400', async () => {
  const h = harness();
  for (const hashName of ['get_sdk_configuration', 'get_all_offer_details', 'quickPayEvent',
    'eligibleBinsForEMI', 'payment_source', 'payment_related_details_for_mobile_sdk']) {
    const hashString = `${key}|${hashName}|default|`;
    const result = await h.send({ hashName, hashString });
    assert.equal(result.statusCode, 200, hashName);
    assert.equal(result.body[hashName], crypto.createHash('sha512').update(hashString + salt).digest('hex'));
    assert.equal(result.headers['Cache-Control'], 'no-store');
  }
  assert.equal(h.queries, 0);
});

test('initialization hashes match independent SHA-512 and HMAC-SHA256 vectors', async () => {
  const h = harness();
  const body = { hashName: 'get_sdk_configuration', hashString: `${key}|get_sdk_configuration|default|` };
  assert.equal((await h.send(body)).body.get_sdk_configuration,
    '9f1b5f6ec13ea64f844046da91bef826a2b590bf397e0a4c587e093233c1ef5006b331c988ce0ae4f9e11e881f783458530e21935b1ea84b712183cd646b14af');
  const v2 = await h.send({ ...body, hashType: 'V2' });
  assert.equal(v2.statusCode, 200);
  assert.equal(v2.body.get_sdk_configuration, 'ad153fd15c276c7ccfcd6325f25a5211a591361b9fceab92317ecc98a199a720');
});

test('empty optional SDK fields do not reject otherwise valid initialization', async () => {
  const h = harness();
  for (const hashType of [undefined, null, '', 'V1', 'V2']) {
    for (const postSalt of [undefined, null, '']) {
      const result = await h.send({ hashName: 'get_sdk_configuration',
        hashString: `${key}|get_sdk_configuration|default|`, hashType, postSalt });
      assert.equal(result.statusCode, 200);
    }
  }
});

test('SDK amount formatting preserves the exact signed bytes and bound payment amount', async () => {
  const h = harness();
  for (const amount of ['50', '50.0', '50.00']) {
    const hashString = paymentString.replace('|50.00|', `|${amount}|`);
    for (const hashType of ['V1', 'V2']) {
      const result = await h.send({ hashName: 'payment_hash', hashString, hashType });
      assert.equal(result.statusCode, 200);
      const expected = hashType === 'V2' ? crypto.createHmac('sha256', salt).update(hashString).digest('hex')
        : crypto.createHash('sha512').update(hashString + salt).digest('hex');
      assert.equal(result.body.payment_hash, expected);
    }
  }
  for (const amount of ['49.99', '50.01', '50.001', '5e1', '-50']) {
    assert.equal((await h.send({ hashName: 'payment_hash',
      hashString: paymentString.replace('|50.00|', `|${amount}|`) })).statusCode, 400);
  }
});

test('initialization support cannot sign other merchant keys or arbitrary commands in either version', async () => {
  const h = harness();
  for (const hashType of ['V1', 'V2']) {
    for (const body of [
      { hashName: 'get_sdk_configuration', hashString: 'other|get_sdk_configuration|default|' },
      { hashName: 'get_sdk_configuration', hashString: `${key}|refund|default|` },
      { hashName: 'refund', hashString: `${key}|refund|default|` },
      { hashName: 'get_sdk_configuration', hashString: `${key}|get_sdk_configuration||` },
      { hashName: 'get_sdk_configuration', hashString: `${key}|get_sdk_configuration|default||` },
      { hashName: 'get_sdk_configuration', hashString: `${key}|get_sdk_configuration|default|`, postSalt: 'extra' },
      { hashName: 'get_sdk_configuration', hashString: `${key}|get_sdk_configuration|default|`, merchantSalt: 'override' }
    ]) assert.equal((await h.send({ ...body, hashType })).statusCode, 400);
  }
});

test('V2 payment hashes retain session, donor, amount and settlement checks', async () => {
  const h = harness();
  for (const [hashString, status] of [
    [paymentString.replace(txnid, 'nbm1234567890123abcdee'), 404],
    [paymentString.replace('|Test Donor|', '|Someone Else|'), 400],
    [paymentString.replace('donor@example.org', 'other@example.org'), 400],
    [paymentString.replace('|NBM Donation|', '|Other Product|'), 400]
  ]) assert.equal((await h.send({ hashName: 'payment_hash', hashString, hashType: 'V2' })).statusCode, status);
  for (const status of ['success', 'failed']) {
    h.payment.status = status;
    assert.equal((await h.send({ hashName: 'payment_hash', hashString: paymentString, hashType: 'V2' })).statusCode, 409);
  }
});

test('V1 postSalt remains supported and is never silently ignored for V2', async () => {
  const h = harness();
  const body = { hashName: 'payment_hash', hashString: paymentString, postSalt: 'extra' };
  const result = await h.send(body);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.payment_hash, crypto.createHash('sha512').update(paymentString + salt + 'extra').digest('hex'));
  assert.equal((await h.send({ ...body, hashType: 'V2' })).statusCode, 400);
});
