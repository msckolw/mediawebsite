const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createHandler} = require('../api/page');
const {articleMetadata} = require('../frontend/src/seo/articleMetadata');
const id = '507f1f77bcf86cd799439011';
const article = {_id:id, title:'A headline $& <test>', summary:'A "quoted" summary',
  content:'First paragraph.\nSecond paragraph.', category:'politics',
  createdAt:'2026-11-01T12:00:00Z', updatedAt:'2026-11-04T12:00:00Z',
  imageUrl:'https://example.org/image.jpg', imageCredit:'Photo credit',
  source:[{source_type:'Independent',url:'https://example.org/story'}]};
const template = '<!doctype html><html><head><title>Default</title><meta name="description" content="default"><script defer src="/static/js/main.hash.js"></script></head><body><div id="root"></div></body></html>';
function response() {
  return {statusCode:200, headers:{}, setHeader(k,v){this.headers[k.toLowerCase()]=v;},
    status(code){this.statusCode=code;return this;},send(body){this.body=body;return this;},end(){this.body='';return this;}};
}
async function request(route, fetchImpl, method='GET', readTemplate=()=>template) {
  const res = response();
  await createHandler({fetchImpl,readTemplate})({method,query:{route}},res);
  return res;
}
const ok = async () => ({ok:true,status:200,json:async()=>article});
test('article HTTP HTML contains the complete article, sources, metadata and React assets without executing JS', async()=>{
  const res=await request(`/article/${id}`, async(url,options)=>{
    assert.match(url,new RegExp(`/news/${id}\\?source=true&media=url$`));
    assert.equal(options.headers.Accept,'application/json');return ok();
  });
  assert.equal(res.statusCode,200);
  assert.match(res.headers['content-type'],/text\/html/);
  assert.match(res.body,/<h1>A headline \$&amp; &lt;test&gt;<\/h1>/);
  assert.match(res.body,/<p>First paragraph\.<\/p><p>Second paragraph\.<\/p>/);
  assert.match(res.body,/<h2>News sources<\/h2>/);
  assert.match(res.body,/href="https:\/\/example.org\/story"/);
  assert.match(res.body,/<title>A headline \$&amp; &lt;test&gt; \| The NoBias Media<\/title>/);
  assert.equal((res.body.match(/<title>/g)||[]).length,1);
  assert.equal((res.body.match(/name="description"/g)||[]).length,1);
  assert.match(res.body,new RegExp(`rel="canonical" href="https://thenobiasmedia.com/article/${id}"`));
  assert.match(res.body,/property="og:type" content="article"/);
  assert.match(res.body,/name="twitter:card" content="summary_large_image"/);
  assert.match(res.body,/src="\/static\/js\/main.hash.js"/);
  const schema=JSON.parse(res.body.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@type'],'NewsArticle');assert.equal(schema.articleBody,article.content);
  assert.equal(schema.dateModified,'2026-11-04T12:00:00.000Z');
  assert.deepEqual(schema.citation,['https://example.org/story']);
  const initial=JSON.parse(res.body.match(/id="nbm-article-data" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(initial,article);
});
test('article text and embedded JSON cannot terminate a script or inject markup',async()=>{
  const payload={...article,title:'</script><script>alert(1)</script> $` $&',
    content:'<img src=x onerror=alert(1)>\u2028',imageUrl:'javascript:alert(1)',
    source:[{url:'javascript:alert(1)'}]};
  const res=await request(`/article/${id}`,async()=>({ok:true,json:async()=>payload}));
  assert.doesNotMatch(res.body,/<script>alert|<img src=x|href="javascript:|src="javascript:/);
  const initial=JSON.parse(res.body.match(/id="nbm-article-data" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(initial,payload);
  assert.match(res.body,/&lt;img src=x onerror=alert\(1\)&gt;/);
});
test('malformed article IDs and missing discovery paths return real 404 without a backend request',async()=>{
  for(const route of ['/article/invalid','/.well-known/api-catalog','/auth.md','/openapi.json','/unknown','/sitemaps/0.xml']){
    const res=await request(route,()=>{throw Error('Should not fetch');});
    assert.equal(res.statusCode,404,route);assert.match(res.body,/noindex/);
  }
});
test('missing articles return 404 while provider failures and timeouts return uncached 503',async()=>{
  const missing=await request(`/article/${id}`,async()=>({status:404}));
  assert.equal(missing.statusCode,404);
  for(const fetchImpl of [async()=>({status:500,ok:false}),async()=>{throw Error('timeout');},async()=>({ok:true,json:async()=>({})})]){
    const res=await request(`/article/${id}`,fetchImpl);
    assert.equal(res.statusCode,503);assert.equal(res.headers['cache-control'],'no-store');assert.equal(res.headers['retry-after'],'30');
  }
});
test('known client routes retain the application and unsupported methods return 405',async()=>{
  for(const route of ['/','/login','/donate/status','/category/science','/admin/assistant',`/source/${id}`]){
    const res=await request(route,()=>{throw Error('Should not fetch');});
    assert.equal(res.statusCode,200,route);assert.equal(res.body,template);
  }
  const res=await request(`/article/${id}`,ok,'POST');
  assert.equal(res.statusCode,405);assert.equal(res.headers.allow,'GET, HEAD');
});
test('HEAD preserves article status and headers without a body',async()=>{
  const res=await request(`/article/${id}`,ok,'HEAD');
  assert.equal(res.statusCode,200);assert.equal(res.body,'');assert.match(res.headers['content-type'],/text\/html/);
  assert.equal((await request('/unknown',ok,'HEAD')).statusCode,404);
});
test('dynamic sitemap XML is forwarded and invalid upstream content never becomes a successful sitemap',async()=>{
  for(const route of ['/sitemap.xml','/sitemaps/2.xml']){
    const res=await request(route,async(url)=>{
      assert.ok(url.endsWith(`/api${route}`));
      return {ok:true,status:200,headers:new Headers({'content-type':'application/xml'}),text:async()=>'<urlset></urlset>'};
    });
    assert.equal(res.statusCode,200);assert.match(res.headers['content-type'],/application\/xml/);assert.equal(res.body,'<urlset></urlset>');
  }
  const bad=await request('/sitemap.xml',async()=>({ok:true,headers:new Headers({'content-type':'text/html'})}));
  assert.equal(bad.statusCode,503);
  assert.equal((await request('/sitemaps/99.xml',async()=>({status:404}))).statusCode,404);
});
test('structured data omits unverified authors and invalid images/dates',()=>{
  const m=articleMetadata({...article,createdAt:'bad-date',updatedAt:null,imageUrl:'data:image/png;base64,AA=='});
  assert.equal(m.schema.author,undefined);assert.equal(m.schema.image,undefined);assert.equal(m.schema.datePublished,undefined);
});
test('routing preserves build assets and bundles the production HTML template',()=>{
  const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  assert.equal(config.functions['api/page.js'].includeFiles,'frontend/build/index.html');
  assert.deepEqual(config.rewrites,[{source:'/:path*',destination:'/api/page?route=/:path*'}]);
  assert.equal(config.redirects[0].destination,'https://thenobiasmedia.com/:path*');
  assert.equal(fs.existsSync('frontend/public/sitemap.xml'),false);
});
