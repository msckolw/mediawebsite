/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function worker() {
  const handlers = {};
  const fetch = jest.fn(async () => ({ ok: true, type: 'basic', clone: () => ({}) }));
  const cache = { put: jest.fn(), add: jest.fn() };
  const caches = { match: jest.fn(async () => null), open: jest.fn(async () => cache) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../public/service-worker.js'), 'utf8'), {
    URL, console, fetch, caches,
    self: { location: { origin: 'https://example.org' }, addEventListener: (name, handler) => { handlers[name] = handler; } }
  });
  return { fetch, caches, handlers };
}

for (const [url, method] of [
  ['https://example.org/api/donations/123/status', 'GET'],
  ['https://example.org/api/auth/session', 'GET'],
  ['https://example.org/api/news', 'GET'],
  ['https://example.org/api/payments/create', 'POST'],
  ['https://api.example.org/api/news', 'GET']
]) {
  test(`leaves ${method} ${url} on the network`, () => {
    const { handlers, caches } = worker();
    const respondWith = jest.fn();
    handlers.fetch({ request: { url, method }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(caches.match).not.toHaveBeenCalled();
  });
}

test('serves cached versioned static assets without another download', async () => {
  const { handlers, caches, fetch } = worker();
  const cached = { cached: true };
  caches.match.mockResolvedValue(cached);
  let result;
  handlers.fetch({ request: { url: 'https://example.org/static/js/main.123.js', method: 'GET' }, respondWith: promise => { result = promise; } });
  await expect(result).resolves.toBe(cached);
  expect(fetch).not.toHaveBeenCalled();
});
