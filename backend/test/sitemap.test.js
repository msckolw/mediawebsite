const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function harness({count=1,articles=[{_id:'507f1f77bcf86cd799439011',createdAt:'2026-11-01',updatedAt:'2026-11-04'}],categories=['politics','science & tech'],fail=false}={}){
  const routes=new Map(),calls=[];
  const Model={countDocuments:async()=>{if(fail)throw Error('db');return count;},distinct:async()=>categories,
    find(filter,projection){calls.push({projection});return {sort(){return this;},skip(n){calls[0].skip=n;return this;},limit(n){calls[0].limit=n;return this;},lean:async()=>articles};}};
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/routes/sitemapRoutes.js'),'utf8'),{module,require(name){
    if(name==='express')return {Router:()=>({get:(url,fn)=>routes.set(url,fn)})};
    if(name==='../models/News')return Model;throw Error(name);
  }});
  module.exports.createRouter();
  const res={code:200,headers:{},set(k,v){this.headers[k]=v;return this;},type(v){this.contentType=v;return this;},status(v){this.code=v;return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;},end(){return this;}};
  return {routes,res,calls};
}
test('sitemap index splits more than 5000 articles and retains an empty-site sitemap',async()=>{
  for(const [count,pages] of [[0,1],[5000,1],[5001,2]]){
    const h=harness({count});await h.routes.get('/sitemap.xml')({},h.res);
    assert.equal(h.res.code,200);assert.equal(h.res.contentType,'application/xml');
    assert.equal((h.res.body.match(/<sitemap>/g)||[]).length,pages);
    assert.match(h.res.body,/https:\/\/thenobiasmedia.com\/sitemaps\/1.xml/);
  }
});
test('sitemap uses published article URLs, actual modification dates and encoded category URLs',async()=>{
  const h=harness();await h.routes.get('/sitemaps/:page.xml')({params:{page:'1'}},h.res);
  assert.match(h.res.body,/\/article\/507f1f77bcf86cd799439011/);
  assert.match(h.res.body,/<lastmod>2026-11-04T00:00:00.000Z<\/lastmod>/);
  assert.match(h.res.body,/\/category\/science%20%26%20tech/);
  assert.doesNotMatch(h.res.body,/\/login|\/admin|\/privacy<\/loc>/);
  assert.equal(h.res.headers['Cache-Control'],'no-cache');
  assert.equal(h.calls[0].projection.content,undefined);assert.equal(h.calls[0].limit,5000);
});
test('later shards paginate articles and omit duplicate static URLs',async()=>{
  const h=harness({count:5001});await h.routes.get('/sitemaps/:page.xml')({params:{page:'2'}},h.res);
  assert.equal(h.res.code,200);assert.equal(h.calls[0].skip,5000);assert.doesNotMatch(h.res.body,/\/about|\/category\//);
});
test('invalid or nonexistent sitemap shards return 404 and database outages return 503',async()=>{
  for(const page of ['0','-1','nope','2','999999999999999999999999']){
    const h=harness();await h.routes.get('/sitemaps/:page.xml')({params:{page}},h.res);assert.equal(h.res.code,404,page);
  }
  for(const route of ['/sitemap.xml','/sitemaps/:page.xml']){
    const h=harness({fail:true});await h.routes.get(route)({params:{page:'1'}},h.res);assert.equal(h.res.code,503);assert.equal(h.res.headers['Cache-Control'],'no-store');
  }
});
