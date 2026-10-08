const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const crypto = require('node:crypto');

function harness(options = {}) {
  const donations = new Map();
  const payments = new Map();
  let count = 0;
  const calls = { form: 0, qr: 0, verify: 0 };
  const state = { provider: 'pending', failVerification: false, failForm: false, failRemote: false, ...options };
  const copy = value => value ? { ...value } : null;
  const matches = (doc, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && '$ne' in value) return doc[key] !== value.$ne;
    return (doc[key] ?? null) === value;
  });
  const update = (store, query, change) => {
    const doc = [...store.values()].find(value => matches(value, query));
    if (!doc) return null;
    Object.assign(doc, change.$set || {});
    return copy(doc);
  };
  const Donation = {
    findById: async id => copy(donations.get(id)),
    findOne: async query => copy([...donations.values()].find(value => matches(value, query))),
    findByIdAndUpdate: async (id, change) => update(donations, { _id: id }, change),
    findOneAndUpdate: async (query, change, opts) => {
      if (opts?.upsert && ![...donations.values()].some(doc => matches(doc, query))) {
        const doc = { _id: `donation${++count}`, status: 'pending', activePayment: null, ...change.$setOnInsert };
        donations.set(doc._id, doc);
      }
      return update(donations, query, change);
    }
  };
  const Payment = {
    findById: async id => copy(payments.get(id)),
    findOne: async query => copy([...payments.values()].find(value => matches(value, query))),
    create: async details => {
      const doc = { ...details, _id: `payment${++count}` };
      payments.set(doc._id, doc);
      return copy(doc);
    },
    deleteOne: async query => payments.delete(query._id),
    findOneAndUpdate: async (query, change) => {
      if (change.$set?.status === 'failed' && state.confirmBeforeFailure) {
        payments.get(query._id).status = 'success';
        donations.get(payments.get(query._id).donation).status = 'success';
      }
      if (change.$set?.checkout && state.confirmDuringCheckout) {
        payments.get(query._id).status = 'success';
        donations.get(payments.get(query._id).donation).status = 'success';
      }
      return update(payments, query, change);
    }
  };
  const load = (file, requireFn) => {
    const sandbox = { module: { exports: {} }, require: requireFn, Date, URL, URLSearchParams,
      process: { env: { FRONTEND_URL: 'https://example.org', PAYU_DBQR_ENABLED: state.qr ? 'true' : 'false' } },
      console: { error() {} } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox, { filename: file });
    return sandbox.module.exports;
  };
  const paymentState = load('src/services/paymentState.js', name => name.endsWith('/Donation') ? Donation : Payment);
  const gateway = {
    createPayment(payment) { calls.form++; if (state.failForm) throw Error('Local configuration failure');
      return { type: 'payu_form', fields: { txnid: payment.txnid } }; },
    async createQrPayment() { calls.qr++; if (state.failRemote) throw Error('Ambiguous remote timeout'); return { type: 'payu_qr' }; },
    async getPaymentStatus(payment) { calls.verify++; if (state.failVerification) throw Error('Provider unavailable');
      if (state.provider === null) return null;
      return { status: state.provider }; }
  };
  const modules = { express, crypto, mongoose: { isValidObjectId: () => true },
    '../models/Donation': Donation, '../models/Payment': Payment,
    '../services/payuGateway': gateway, '../services/phonepeGateway': {},
    '../services/gatewaySelection': { selectGateway: () => 'payu' }, '../services/paymentState': paymentState };
  const router = load('src/routes/donationRoutes.js', name => modules[name]);
  async function request(route, { id, body = {} } = {}) {
    const handler = router.stack.find(layer => layer.route?.path === route).route.stack[0].handle;
    const res = { statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; } };
    await handler({ params: { id }, body, headers: {} }, res);
    return res;
  }
  async function create(amount = '50.00', platform = 'app') {
    const response = await request('/donations', { body: { amount, platform, method: 'upi',
      firstname: 'Test Donor', email: 'test@example.org', phone: '9876543210', idempotencyKey: 'stable_request_key_123' } });
    return response;
  }
  return { state, calls, payments, donations, request, create };
}

const checkout = (h, id) => h.request('/donations/:id/checkout', { id });

test('successful duplicate checkout returns status and no reusable SDK fields', async () => {
  const h = harness(); const id = (await h.create()).body.id;
  const first = await checkout(h, id); assert.equal(first.statusCode, 200);
  h.state.provider = 'success';
  const second = await checkout(h, id);
  assert.equal(second.statusCode, 409); assert.equal(second.body.code, 'ALREADY_PAID');
  assert.equal(second.body.status, 'success'); assert.equal(second.body.checkout, null);
  assert.equal(h.calls.form, 1); assert.equal(h.payments.size, 1);
});

test('pending and unavailable providers never return a previously issued checkout', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  let response = await checkout(h, id);
  assert.equal(response.statusCode, 409); assert.equal(response.body.checkout, null);
  h.state.failVerification = true; response = await checkout(h, id);
  assert.equal(response.statusCode, 409); assert.equal(response.body.code, 'PAYMENT_UNVERIFIED');
  assert.equal(h.payments.size, 1);
});

test('legacy failed records are reconciled before another payment is issued', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  [...h.payments.values()][0].status = 'failed';
  const result = await checkout(h, id);
  assert.equal(result.statusCode, 409); assert.equal(result.body.status, 'pending');
  assert.equal(h.payments.size, 1);
});

test('missing provider records do not permit retrying legacy failed payments', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  [...h.payments.values()][0].status = 'failed'; h.state.provider = null;
  const result = await checkout(h, id); assert.equal(result.body.code, 'PAYMENT_UNVERIFIED');
  assert.equal(h.payments.size, 1);
});

test('local initialization failure permits a fresh transaction on the same donation', async () => {
  const h = harness({ failForm: true }); const id = (await h.create()).body.id;
  assert.equal((await checkout(h, id)).statusCode, 503);
  const old = [...h.payments.values()][0]; assert.equal(old.initiationState, 'not_started');
  h.state.failForm = false;
  const retry = await checkout(h, id); assert.equal(retry.statusCode, 200);
  assert.notEqual(retry.body.transactionId, old.txnid); assert.equal(h.calls.verify, 0);
});

test('remote initialization timeout remains pending until the provider resolves it', async () => {
  const h = harness({ qr: true, failRemote: true }); const id = (await h.create('50.00', 'web')).body.id;
  assert.equal((await checkout(h, id)).statusCode, 503);
  assert.equal([...h.payments.values()][0].initiationState, 'unknown');
  assert.equal((await checkout(h, id)).statusCode, 409); assert.equal(h.payments.size, 1);
});

test('native SDK receives form fields even with web QR enabled', async () => {
  const h = harness({ qr: true }); const id = (await h.create()).body.id;
  assert.equal((await checkout(h, id)).body.checkout.type, 'payu_form'); assert.equal(h.calls.qr, 0);
});

test('SDK cancellation does not declare an unresolved provider payment failed', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  const result = await h.request('/donations/:id/cancel', { id });
  assert.equal(result.statusCode, 202); assert.equal(result.body.status, 'pending');
  assert.equal((await checkout(h, id)).statusCode, 409);
});

test('confirmed failure permits retry with a new transaction but the same donation', async () => {
  const h = harness(); const id = (await h.create()).body.id;
  const old = (await checkout(h, id)).body.transactionId; h.state.provider = 'failed';
  assert.equal((await h.request('/donations/:id/cancel', { id })).body.nextAction, 'retry_checkout');
  const retry = await checkout(h, id); assert.equal(retry.statusCode, 200); assert.notEqual(retry.body.transactionId, old);
});

test('concurrent success wins over a verified failure during cancellation', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  h.state.provider = 'failed'; h.state.confirmBeforeFailure = true;
  const result = await h.request('/donations/:id/cancel', { id });
  assert.equal(result.statusCode, 409); assert.equal(result.body.status, 'success');
  assert.equal([...h.payments.values()][0].status, 'success');
});

test('webhook success during checkout persistence suppresses checkout fields', async () => {
  const h = harness({ confirmDuringCheckout: true }); const id = (await h.create()).body.id;
  const result = await checkout(h, id); assert.equal(result.statusCode, 409); assert.equal(result.body.checkout, null);
});

test('creation retries return the same donation without cached checkout fields', async () => {
  const h = harness(); const first = await h.create(); await checkout(h, first.body.id);
  const again = await h.create(); assert.equal(again.body.id, first.body.id); assert.equal(again.body.checkout, null);
  assert.equal(h.donations.size, 1);
});

test('valid paise amounts are accepted and excessive precision is rejected', async () => {
  for (const amount of ['19.99', '10', '100000.00']) assert.equal((await harness().create(amount)).statusCode, 200);
  for (const amount of ['9.99', '100000.01', '10.001', '1e2', null, {}]) assert.equal((await harness().create(amount)).statusCode, 400);
});

test('concurrent checkout requests issue only one new transaction', async () => {
  const h = harness(); const id = (await h.create()).body.id;
  const results = await Promise.all([checkout(h, id), checkout(h, id)]);
  assert.deepEqual(results.map(result => result.statusCode).sort(), [200, 409]);
  assert.equal(h.payments.size, 1); assert.equal(h.calls.form, 1);
});


test('status repairs legacy cancellation failures when PayU confirms success', async () => {
  const h = harness(); const id = (await h.create()).body.id; await checkout(h, id);
  [...h.payments.values()][0].status = 'failed'; h.state.provider = 'success';
  const result = await h.request('/donations/:id/status', { id });
  assert.equal(result.body.status, 'success'); assert.equal(h.donations.get(id).status, 'success');
});
