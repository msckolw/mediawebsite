const test = require('node:test');
const assert = require('node:assert/strict');
const { getGoogleUserInfo, GoogleIdentityError } = require('../src/services/googleIdentity');

const profile = { email: 'reader@example.org', email_verified: true, sub: 'google-reader' };

function google(outcomes) {
  const calls = [];
  const waits = [];
  return {
    calls, waits,
    options: {
      async fetchImpl(url, options) {
        calls.push({ url, ...options });
        const result = outcomes.shift();
        if (result instanceof Error) throw result;
        assert.ok(result, 'Unexpected additional Google request');
        return result;
      },
      async wait(ms) { waits.push(ms); }
    }
  };
}

const success = () => ({ ok: true, status: 200, json: async () => profile });

test('Google profile is returned on the first attempt without waiting', async () => {
  const g = google([success()]);
  assert.deepEqual(await getGoogleUserInfo('test-access-token', g.options), profile);
  assert.equal(g.calls.length, 1);
  assert.equal(g.calls[0].url, 'https://www.googleapis.com/oauth2/v3/userinfo');
  assert.equal(g.calls[0].headers.Authorization, 'Bearer test-access-token');
  assert.deepEqual(g.waits, []);
});

for (const status of [429, 500, 503]) {
  test(`temporary Google HTTP ${status} recovers within the original sign-in request`, async () => {
    const g = google([{ ok: false, status }, success()]);
    assert.deepEqual(await getGoogleUserInfo('test-access-token', g.options), profile);
    assert.equal(g.calls.length, 2);
    assert.deepEqual(g.waits, [150]);
  });
}

for (const error of [new TypeError('Network unavailable'), Object.assign(new Error('Timed out'), { name: 'AbortError' })]) {
  test(`temporary ${error.name} recovers without another login attempt`, async () => {
    const g = google([error, success()]);
    assert.deepEqual(await getGoogleUserInfo('test-access-token', g.options), profile);
    assert.equal(g.calls.length, 2);
  });
}

for (const status of [400, 401, 403]) {
  test(`Google HTTP ${status} rejects credentials without retrying`, async () => {
    const g = google([{ ok: false, status }]);
    await assert.rejects(getGoogleUserInfo('invalid-access-token', g.options), error =>
      error instanceof GoogleIdentityError && error.statusCode === 401);
    assert.equal(g.calls.length, 1);
    assert.deepEqual(g.waits, []);
  });
}

test('persistent Google outage returns temporary unavailability after at most two attempts', async () => {
  const g = google([{ ok: false, status: 503 }, { ok: false, status: 503 }]);
  await assert.rejects(getGoogleUserInfo('test-access-token', g.options), error =>
    error.statusCode === 503 && !error.message.includes('Invalid'));
  assert.equal(g.calls.length, 2);
});

test('stalled Google requests are aborted within a bounded sign-in timeout', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const signals = [];
  const pending = getGoogleUserInfo('test-access-token', {
    fetchImpl(url, { signal }) {
      signals.push(signal);
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    },
    async wait() {}
  });
  const rejected = assert.rejects(pending, { statusCode: 503 });
  context.mock.timers.tick(4500);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(signals.length, 2);
  assert.equal(signals[0].aborted, true);
  context.mock.timers.tick(4500);
  await rejected;
  assert.equal(signals[1].aborted, true);
});

test('incomplete Google JSON can recover, while permanent endpoint errors are not retried', async () => {
  const g = google([{ ok: true, status: 200, json: async () => { throw new SyntaxError('Incomplete JSON'); } }, success()]);
  assert.deepEqual(await getGoogleUserInfo('test-access-token', g.options), profile);
  const missing = google([{ ok: false, status: 404 }]);
  await assert.rejects(getGoogleUserInfo('test-access-token', missing.options), { statusCode: 503 });
  assert.equal(missing.calls.length, 1);
});
