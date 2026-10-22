const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness() {
  const handlers = new Map();
  const events = [];
  const article = { _id: 'id-1', title: 'Headline', content: 'Body', summary: 'Summary', category: 'politics', source: [] };
  class News {
    constructor(fields) { Object.assign(this, article, fields); }
    async save() { return this; }
    static async find() { return [article]; }
    static async findByIdAndUpdate(id, changes) { return { ...article, ...changes, _id: id }; }
    static async findByIdAndDelete(id) { return { ...article, _id: id }; }
    static async deleteMany() { return { deletedCount: 2 }; }
  }
  const router = {};
  for (const method of ['get', 'post', 'put', 'delete']) router[method] = (route, handler) => handlers.set(`${method} ${route}`, handler);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/routes/newsRoutes.js'), 'utf8'), {
    module: { exports: {} }, console: { log() {}, error() {} },
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === '../models/News') return News;
      if (name === '../services/imagePolicy') return { validateArticleImage: async image => { if (image === 'invalid') throw new Error('Image is too small'); return { imageMetadata: { width: 1200, height: 675 } }; } };
      if (name === '../models/SourceType') return {};
      if (name === '../utils/validateToken') return { validateJWT: token => token === 'admin' ? { code: 1, role: 'admin' } : { code: 401 } };
      if (name === 'mongoose') return { Types: { ObjectId: id => id } };
      if (name === '../socket') return { getIo: () => ({ emit: (event, payload) => events.push({ event, payload }) }) };
      throw new Error(name);
    }
  });
  return { handlers, events, article };
}
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('successful create, edit, delete and bulk delete emit explicit mutation events', async () => {
  const h = harness();
  for (const [route, body, params, event] of [
    ['post /news', h.article, {}, 'article:created'],
    ['put /news', { ...h.article, title: 'Edited' }, {}, 'article:updated'],
    ['delete /news/:id', {}, { id: 'id-1' }, 'article:deleted'],
    ['delete /news', { _id: ['id-1', 'id-2'] }, {}, 'article:deleted']
  ]) {
    const res = response();
    await h.handlers.get(route)({ body, params, cookies: { access_token: 'admin' } }, res);
    assert.ok(res.code < 300);
    const last = h.events.filter(x => x.event.startsWith('article:')).at(-1);
    assert.equal(last.event, event);
    assert.ok(last.payload.id === 'id-1' || last.payload.ids.includes('id-1'));
  }
});

test('unauthorized mutations never publish an event', async () => {
  const h = harness();
  const res = response();
  await h.handlers.get('post /news')({ body: h.article, cookies: {} }, res);
  assert.equal(res.code, 401);
  assert.equal(h.events.length, 0);
});

 test('image validation failures block creation and replacement without events', async () => {
  const h = harness();
  for (const route of ['post /news', 'put /news']) {
    const res = response();
    await h.handlers.get(route)({ body: { ...h.article, imageUrl: 'invalid' }, cookies: { access_token: 'admin' } }, res);
    assert.equal(res.code, 400);
    assert.equal(h.events.length, 0);
  }
 });
