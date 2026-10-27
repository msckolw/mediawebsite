const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const jwt = require('jsonwebtoken');
const { getGoogleUserInfo, GoogleIdentityError } = require('../src/services/googleIdentity');

function signIn(outcomes) {
  const handlers = new Map();
  const writes = [];
  const cookies = [];
  let googleCalls = 0;
  const router = { use() {} };
  for (const method of ['get', 'post']) router[method] = (route, handler) => handlers.set(route, handler);
  const secret = 'test-google-session-secret';
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/routes/authRoutes.js'), 'utf8'), {
    module: { exports: {} }, process: { env: { JWT_SECRET: secret } }, console,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === 'jsonwebtoken') return jwt;
      if (name === '../models/OAuth') return {
        async findOneAndUpdate(...args) { writes.push(args); }
      };
      if (name === '../services/googleIdentity') return {
        GoogleIdentityError,
        getGoogleUserInfo(token) {
          return getGoogleUserInfo(token, {
            async fetchImpl() {
              googleCalls++;
              const outcome = outcomes.shift();
              assert.ok(outcome, 'Unexpected Google request');
              return outcome;
            },
            async wait() {
              assert.equal(writes.length, 0, 'Do not persist a user before Google verifies them');
              assert.equal(cookies.length, 0, 'Do not issue a session before Google verifies them');
            }
          });
        }
      };
      throw new Error(name);
    }
  });
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    cookie(name, value, options) { cookies.push({ name, value, options }); return this; },
    json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; }
  };
  return { res, writes, cookies, secret, googleCalls: () => googleCalls,
    run: (body = { accessToken: 'test-google-access-token' }) => handlers.get('/googleSignIn')({ body }, res) };
}

const profile = { sub: 'google-reader', email: 'Reader@example.org', name: 'Reader', email_verified: true };
const googleProfile = value => ({ ok: true, status: 200, json: async () => value });

test('temporary Google failure signs in within the same request and issues one verified session', async () => {
  const h = signIn([{ ok: false, status: 503 }, googleProfile(profile)]);
  await h.run();
  assert.equal(h.googleCalls(), 2);
  assert.equal(h.res.code, 200);
  assert.equal(h.writes.length, 1);
  assert.equal(h.cookies.length, 1);
  assert.equal(h.res.body.success, true);
  assert.equal(h.res.body.token, 'Active');
  const cookie = h.cookies[0];
  assert.equal(cookie.name, 'access_token');
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, 'none');
  const session = jwt.verify(cookie.value, h.secret);
  assert.equal(session.email, 'reader@example.org');
  assert.equal(session.role, 'user');
});

for (const [outcomes, code] of [
  [[{ ok: false, status: 503 }, { ok: false, status: 503 }], 503],
  [[{ ok: false, status: 401 }], 401],
  [[googleProfile({ ...profile, email_verified: false })], 401]
]) {
  test(`unverified or unavailable Google identity returns ${code} without a user write or session`, async () => {
    const h = signIn(outcomes);
    await h.run();
    assert.equal(h.res.code, code);
    assert.equal(h.writes.length, 0);
    assert.equal(h.cookies.length, 0);
  });
}

test('missing access token is rejected before calling Google', async () => {
  const h = signIn([]);
  await h.run({});
  assert.equal(h.res.code, 401);
  assert.equal(h.googleCalls(), 0);
  assert.equal(h.cookies.length, 0);
});
