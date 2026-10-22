const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const auth = require('../src/routes/authRoutes');

async function withServer(run) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', auth);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('session requires a verified cookie and exposes only safe user fields', async () => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-session-secret';
  try {
    await withServer(async base => {
      for (const cookie of ['', 'access_token=invalid', `access_token=${jwt.sign({ email: 'a@test.com', role: 'admin' }, 'wrong-secret')}`]) {
        const result = await fetch(`${base}/auth/session`, { headers: { cookie } });
        assert.equal(result.status, 401);
        assert.equal(result.headers.get('cache-control'), 'no-store');
      }
      const token = jwt.sign({ email: 'a@test.com', role: 'user', name: 'Reader', private: 'hidden' }, process.env.JWT_SECRET);
      const result = await fetch(`${base}/auth/session`, { headers: { cookie: `access_token=${token}` } });
      assert.equal(result.status, 200);
      assert.deepEqual(await result.json(), { user: { email: 'a@test.com', role: 'user', name: 'Reader' } });
      const expired = jwt.sign({ email: 'a@test.com', role: 'user' }, process.env.JWT_SECRET, { expiresIn: -1 });
      assert.equal((await fetch(`${base}/auth/session`, { headers: { cookie: `access_token=${expired}` } })).status, 401);
    });
  } finally {
    if (old === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = old;
  }
});

test('logout expires the HttpOnly authentication cookie with matching scope and is idempotent', async () => {
  await withServer(async base => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await fetch(`${base}/auth/logout`, { method: 'POST' });
      assert.equal(result.status, 204);
      const cookie = result.headers.get('set-cookie');
      assert.match(cookie, /^access_token=;/);
      assert.match(cookie, /Expires=Thu, 01 Jan 1970/);
      for (const attribute of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=None']) assert.ok(cookie.includes(attribute));
      assert.equal(result.headers.get('cache-control'), 'no-store');
    }
  });
});
