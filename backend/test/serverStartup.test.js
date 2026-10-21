const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function boot(env = {}) {
  let resolveConnection;
  let rejectConnection;
  const connection = new Promise((resolve, reject) => {
    resolveConnection = resolve;
    rejectConnection = reject;
  });
  const calls = { listens: [], exits: [], errors: [], routes: [], connects: [] };
  const mongoose = {
    connection: { readyState: 2 },
    connect(...args) { calls.connects.push(args); return connection; }
  };
  const app = {
    use() {},
    get(route, handler) { calls.routes.push({ route, handler }); }
  };
  const express = () => app;
  express.json = express.urlencoded = () => () => {};
  const server = { listen(port, callback) { calls.listens.push(port); callback(); } };
  const sourcePath = process.env.STARTUP_SOURCE || path.join(__dirname, '../src/server.js');
  vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), {
    require(name) {
      if (name === 'express') return express;
      if (name === 'mongoose') return mongoose;
      if (name === 'http') return { createServer: () => server };
      if (name === 'dotenv') return { config() {} };
      if (name === './socket') return { initSocket() {} };
      if (name.startsWith('./routes/')) return {};
      if (['cors', 'cookie-parser', 'socket.io'].includes(name)) return () => () => {};
      throw new Error(`Unexpected module: ${name}`);
    },
    process: { env: { MONGODB_URI: 'mongodb://test.invalid/news', ...env },
      exit(code) { calls.exits.push(code); } },
    console: { log() {}, error(...args) { calls.errors.push(args); } }
  }, { filename: sourcePath });
  return { calls, mongoose,
    async connect() {
      mongoose.connection.readyState = 1;
      resolveConnection();
      await new Promise(resolve => setImmediate(resolve));
    },
    async fail() {
      rejectConnection(new Error('Database unavailable'));
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

test('cold start accepts no traffic until the database connection resolves', async () => {
  const h = boot({ PORT: '8080' });
  assert.equal(h.calls.connects.length, 1);
  assert.equal(h.calls.connects[0][0], 'mongodb://test.invalid/news');
  assert.equal(h.calls.listens.length, 0);
  // Simulate a delayed connection, not an already-resolved startup promise.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.listens.length, 0);
  await h.connect();
  assert.deepEqual(h.calls.listens, ['8080']);
  assert.deepEqual(h.calls.exits, []);
});

test('failed database connection exits without advertising a ready server', async () => {
  const h = boot();
  await h.fail();
  assert.deepEqual(h.calls.listens, []);
  assert.deepEqual(h.calls.exits, [1]);
  assert.equal(h.calls.errors.length, 1);
});

test('local startup uses the default port and health still detects a later disconnect', async () => {
  const h = boot();
  await h.connect();
  assert.deepEqual(h.calls.listens, [5002]);
  const health = h.calls.routes.find(({ route }) => route === '/api/health').handler;
  const res = { status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; } };
  health({}, res);
  assert.equal(res.statusCode, 200);
  h.mongoose.connection.readyState = 0;
  health({}, res);
  assert.equal(res.statusCode, 503);
});
