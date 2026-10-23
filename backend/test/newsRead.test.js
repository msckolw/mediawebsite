const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const id = '507f1f77bcf86cd799439011';
const article = {
  _id: id, title: 'Headline', content: 'Full article', summary: 'Summary',
  category: 'politics', imageUrl: 'https://example.org/image.jpg',
  source: [{ source_type: 'Independent', url: 'https://example.org/story' }]
};

function harness({ missing = false } = {}) {
  const handlers = new Map();
  const calls = [];
  let releaseList;
  const router = {};
  for (const method of ['get', 'post', 'put', 'delete']) {
    router[method] = (route, handler) => handlers.set(`${method} ${route}`, handler);
  }
  function project(projection) {
    const fields = Object.keys(projection);
    if (fields.some(key => projection[key])) {
      return Object.fromEntries(Object.entries(article).filter(([key]) => key === '_id' || projection[key]));
    }
    return Object.fromEntries(Object.entries(article).filter(([key]) => projection[key] !== false));
  }
  const News = {
    findOne(filter, projection) {
      calls.push({ method: 'findOne', filter, projection });
      return { lean: async () => missing ? null : project(projection) };
    },
    find(filter, projection) {
      const call = { method: 'find', filter, projection };
      calls.push(call);
      const query = {
        sort(value) { call.sort = value; return this; },
        skip(value) { call.skip = value; return this; },
        limit(value) { call.limit = value; return this; },
        // The list completes only once count starts: catches sequential reads.
        lean() { return new Promise(resolve => { releaseList = () => resolve([project(projection)]); }); }
      };
      return query;
    },
    countDocuments(filter) {
      calls.push({ method: 'count', filter });
      releaseList();
      return Promise.resolve(21);
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/routes/newsRoutes.js'), 'utf8'), {
    module: { exports: {} }, console,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === '../models/News') return News;
      if (name === '../services/articleMedia') return require('../src/services/articleMedia');
      if (name === '../models/SourceType') return {};
      if (name === '../services/imagePolicy') return {};
      if (name === '../utils/validateToken') return { validateJWT() { throw Error('Public reads must not authenticate'); } };
      if (name === 'mongoose') return {};
      if (name === '../socket') return {};
      throw Error(name);
    }
  });
  return { handlers, calls };
}
function response() {
  return {
    code: 200, headers: {},
    status(code) { this.code = code; return this; },
    set(key, value) { this.headers[key] = value; return this; },
    json(body) { this.body = JSON.parse(JSON.stringify(body)); return this; }
  };
}

for (const source of [undefined, 'false', 'true']) {
  test(`public article read preserves title/content with source=${source}`, async () => {
    const h = harness();
    const res = response();
    await h.handlers.get('get /news/:id')({ params: { id }, query: { source } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body._id, id);
    assert.equal(res.body.title, article.title);
    assert.equal(res.body.content, article.content);
    assert.equal(res.headers['Cache-Control'], 'no-cache');
    if (source === 'true') assert.deepEqual(res.body.source, article.source);
    else assert.equal(Object.hasOwn(res.body, 'source'), false);
  });
}

test('unknown article returns 404 and malformed ID returns 400 without a database query', async () => {
  const h = harness({ missing: true });
  const missing = response();
  await h.handlers.get('get /news/:id')({ params: { id }, query: {} }, missing);
  assert.equal(missing.code, 404);
  const invalid = response();
  await h.handlers.get('get /news/:id')({ params: { id: 'undefined' }, query: {} }, invalid);
  assert.equal(invalid.code, 400);
  assert.equal(h.calls.length, 1);
});

for (const route of ['get /news', 'get /category/:cat']) {
  test(`${route} runs list/count together and preserves pagination`, { timeout: 1000 }, async () => {
    const h = harness();
    const res = response();
    await h.handlers.get(route)({ query: { page: '2' }, params: { cat: 'Politics' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.currentPage, 2);
    assert.equal(res.body.totalPages, 3);
    assert.equal(res.body.articles[0].content, article.content);
    assert.equal(Object.hasOwn(res.body.articles[0], 'source'), false);
    assert.equal(h.calls[0].skip, 10);
    assert.equal(h.calls[0].limit, 10);
    assert.equal(res.headers['Cache-Control'], 'no-cache');
    if (route.includes('category')) {
      assert.ok(h.calls[0].filter.category.test('politics'));
      assert.equal(String(h.calls[0].filter.category), String(h.calls[1].filter.category));
    }
  });
}

for (const route of ['get /news', 'get /category/:cat']) {
  test(`${route} compact feed omits full bodies while legacy reads retain them`, async () => {
    const h = harness();
    const res = response();
    await h.handlers.get(route)({ query: { view: 'feed' }, params: { cat: 'Politics' } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.articles[0].title, article.title);
    assert.equal(res.body.articles[0].summary, article.summary);
    assert.equal(Object.hasOwn(res.body.articles[0], 'content'), false);
  });
}
