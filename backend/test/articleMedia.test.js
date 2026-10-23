const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { presentArticle, imageVersion } = require('../src/services/articleMedia');
const id = '507f1f77bcf86cd799439011';
const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const article = {
  _id: id, title: 'Headline', content: 'Complete body', source: [],
  imageUrl: `data:image/png;base64,${bytes.toString('base64')}`,
  createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-23T00:00:00Z'
};

test('media URLs are opt-in and versioned while full article bodies remain available', () => {
  const req = { query: {}, protocol: 'https', get: () => 'example.org' };
  assert.equal(presentArticle(article, req).imageUrl, article.imageUrl);
  for (const query of [{ view: 'feed' }, { media: 'url' }]) {
    const presented = presentArticle(article, { ...req, query });
    assert.match(presented.imageUrl, new RegExp(`/api/news/${id}/image\\?v=`));
    assert.equal(presented.content, article.content);
    assert.deepEqual(presented.source, []);
    assert.equal(article.imageUrl.startsWith('data:'), true);
    const changed = presentArticle({ ...article, updatedAt: '2026-10-24T00:00:00Z' }, { ...req, query });
    assert.notEqual(changed.imageUrl, presented.imageUrl);
  }
});

async function server(t, value = article) {
  const routeFile = path.join(__dirname, '../src/routes/newsRoutes.js');
  const nativeRequire = createRequire(routeFile);
  const module = { exports: {} };
  const queries = [];
  vm.runInNewContext(fs.readFileSync(routeFile, 'utf8'), {
    module, console,
    require(name) {
      if (name === '../models/News') return {
        findOne(filter) {
          queries.push(filter);
          return { lean: async () => filter._id === id ? value : null };
        }
      };
      return nativeRequire(name);
    }
  });
  const app = express();
  app.use('/api', module.exports);
  const listener = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => { listener.close(resolve); listener.closeAllConnections(); }));
  return { origin: `http://127.0.0.1:${listener.address().port}`, queries };
}

test('image endpoint serves exact binary bytes with HTTP caching and revalidates via ETag', async t => {
  const { origin } = await server(t);
  const url = `${origin}/api/news/${id}/image?v=${imageVersion(article)}`;
  const first = await fetch(url);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('content-type'), 'image/png');
  assert.equal(first.headers.get('cache-control'), 'public, max-age=86400');
  assert.deepEqual(Buffer.from(await first.arrayBuffer()), bytes);
  const second = await fetch(url, { cache: 'no-cache', headers: { 'If-None-Match': first.headers.get('etag') } });
  assert.equal(second.status, 304);
  const unversioned = await fetch(`${origin}/api/news/${id}/image`);
  assert.equal(unversioned.headers.get('cache-control'), 'no-cache');
});

test('image endpoint rejects missing/malformed IDs and never proxies remote image hosts', async t => {
  const { origin, queries } = await server(t, { ...article, imageUrl: 'https://example.org/image.jpg' });
  assert.equal((await fetch(`${origin}/api/news/undefined/image`)).status, 400);
  assert.equal(queries.length, 0);
  assert.equal((await fetch(`${origin}/api/news/${id}/image`)).status, 404);
  assert.equal((await fetch(`${origin}/api/news/507f1f77bcf86cd799439012/image`)).status, 404);
});
