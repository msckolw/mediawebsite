const test = require('node:test');
const assert = require('node:assert/strict');
const {createHandler} = require('../api/page');
const {prefersMarkdown, publicMarkdown} = require('../server/markdown');
const template = '<!doctype html><html><head><title>Default</title><script>privateTemplateCode()</script></head><body><div id="root"></div></body></html>';
const id = '507f1f77bcf86cd799439011';
const article = {_id:id,title:'A headline',summary:'A summary',content:'First paragraph.\nSecond paragraph.',category:'science',createdAt:'2026-11-01T12:00:00Z',updatedAt:'2026-11-04T12:00:00Z',source:[{source_type:'Original reporting',url:'https://example.org/story'}]};
async function request(route, {accept='text/markdown',method='GET',fetchImpl=async()=>({ok:true,status:200,json:async()=>article}),readPrerendered=()=>({'/faq':'<h1>Frequently Asked Questions</h1><details><summary>A question?</summary><p>An answer.</p></details>','/privacy-policy':'<h1>Privacy Policy</h1><p>Published policy.</p>'})}={}) {
  const res={statusCode:200,headers:{vary:'Origin'},setHeader(key,value){this.headers[key.toLowerCase()]=value;},getHeader(key){return this.headers[key.toLowerCase()];},status(code){this.statusCode=code;return this;},send(body){this.body=body;return this;},end(){this.body='';return this;}};
  await createHandler({fetchImpl,readTemplate:()=>template,readPrerendered})({method,headers:{accept},query:{route}},res);
  return res;
}

test('Markdown requires an explicit preference; HTTP quality and specificity preserve HTML defaults',()=>{
  for(const accept of [undefined,'','*/*','text/*','text/html','text/markdown;q=0','text/markdown, text/html','text/markdown;q=0.5, text/html;q=0.9','text/markdown;q=0.5, text/*;q=0.8','text/markdown;q=invalid','text/markdown;q=2']) assert.equal(prefersMarkdown(accept),false,String(accept));
  for(const accept of ['text/markdown','TEXT/MARKDOWN; charset=utf-8','text/markdown;q=1, text/html;q=0.5','text/markdown;q=0.5, text/html;q=0, */*;q=1','application/json, text/markdown;q=0.8']) assert.equal(prefersMarkdown(accept),true,accept);
});
test('article negotiation preserves text, dates and source links and excludes scripts and HTML assets',async()=>{
  const res=await request(`/article/${id}`);
  assert.equal(res.statusCode,200);
  assert.equal(res.headers['content-type'],'text/markdown; charset=utf-8');
  assert.equal(res.headers.vary,'Origin, Accept');
  assert.match(res.body,/# A headline/);
  assert.match(res.body,/First paragraph\.\n\nSecond paragraph\./);
  assert.ok(res.body.includes(article.createdAt));
  assert.ok(res.body.includes(article.updatedAt));
  assert.match(res.body,/\[Original reporting\]\(<https:\/\/example.org\/story>\)/);
  assert.ok(res.body.includes(`Canonical URL: https://thenobiasmedia.com/article/${id}`));
  assert.doesNotMatch(res.body,/<script|privateTemplateCode|nbm-article-data|<!doctype/i);
  const html=await request(`/article/${id}`,{accept:'text/html, */*;q=0.8'});
  assert.match(html.headers['content-type'],/^text\/html/);
  assert.match(html.body,/nbm-article-data/);
  assert.equal(html.headers.vary,'Origin, Accept');
});
test('home, category and sources offer Markdown from the same public data',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>({articles:[article],currentPage:1,totalPages:1})});
  for(const route of ['/','/index.html','/category/science']) {
    const res=await request(route,{fetchImpl});
    assert.equal(res.statusCode,200);
    assert.match(res.headers['content-type'],/^text\/markdown/);
    assert.ok(res.body.includes(`https://thenobiasmedia.com/article/${id}`));
    assert.match(res.body,/A summary/);
    if(route!=='/category/science') assert.match(res.body,/Frequently Asked Questions/);
  }
  const sources=await request(`/source/${id}`);
  assert.match(sources.body,/# News Sources/);
  assert.match(sources.body,/https:\/\/example.org\/story/);
});
test('FAQ and policy aliases convert actual snapshots without a backend request',async()=>{
  for(const route of ['/faq','/privacy']) {
    const res=await request(route,{fetchImpl:()=>{throw Error('Must not fetch');}});
    assert.equal(res.statusCode,200);
    assert.match(res.headers['content-type'],/^text\/markdown/);
    if(route==='/faq') {assert.match(res.body,/## A question\?/); assert.match(res.body,/An answer\./);}
    else assert.match(res.body,/Canonical URL: https:\/\/thenobiasmedia.com\/privacy-policy/);
  }
});
test('Markdown escapes untrusted article markup and link syntax, rejecting unsafe source URLs',async()=>{
  const payload={...article,title:'[Fake](javascript:alert(1)) <script>bad()</script>',content:'<img src=x onerror=bad()>\n# Fake heading',source:[{source_type:'Unsafe',url:'javascript:alert(1)'},{source_type:'[Injected]',url:'https://example.org/a_(b)?q=1&x=2'}]};
  const res=await request(`/article/${id}`,{fetchImpl:async()=>({ok:true,json:async()=>payload})});
  assert.equal(res.statusCode,200);
  assert.doesNotMatch(res.body,/<script>|<img|\]\(<javascript:/);
  assert.ok(res.body.includes('\\[Fake\\]'));
  assert.ok(res.body.includes('\\# Fake heading'));
  assert.ok(res.body.includes('https://example.org/a_%28b%29?q=1&x=2'));
});
test('Markdown HEAD matches GET status and headers without sending a body',async()=>{
  const get=await request(`/article/${id}`);
  const head=await request(`/article/${id}`,{method:'HEAD'});
  assert.equal(head.statusCode,get.statusCode);
  assert.deepEqual(head.headers,get.headers);
  assert.equal(head.body,'');
});
test('negotiated errors keep real 404 and uncached 503 status without disclosing failures',async()=>{
  for(const route of ['/unknown','/article/invalid',`/article/${id}`]) {
    const res=await request(route,{fetchImpl:async()=>({status:404})});
    assert.equal(res.statusCode,404);
    assert.match(res.headers['content-type'],/^text\/markdown/);
  }
  for(const route of ['/',`/article/${id}`,`/source/${id}`]) {
    const res=await request(route,{fetchImpl:async()=>{throw Error('private error');}});
    assert.equal(res.statusCode,503);
    assert.equal(res.headers['cache-control'],'no-store');
    assert.equal(res.headers['retry-after'],'30');
    assert.match(res.headers['content-type'],/^text\/markdown/);
    assert.doesNotMatch(res.body,/private error/);
  }
});
test('Markdown does not expose client-only private screens or change sitemap XML or method restrictions',async()=>{
  for(const route of ['/admin','/admin/assistant','/admin/inquiries','/bookmarks','/donate/status']) {
    const res=await request(route,{fetchImpl:()=>{throw Error('Must not fetch private data');}});
    assert.equal(res.statusCode,200);
    assert.match(res.headers['content-type'],/^text\/html/);
    assert.equal(res.body,template);
  }
  const xml=await request('/sitemap.xml',{fetchImpl:async()=>({ok:true,headers:new Headers({'content-type':'application/xml'}),text:async()=>'<urlset/>'})});
  assert.equal(xml.headers['content-type'],'application/xml; charset=utf-8');
  assert.equal(xml.body,'<urlset/>');
  const post=await request(`/article/${id}`,{method:'POST'});
  assert.equal(post.statusCode,405);
  assert.equal(post.headers.allow,'GET, HEAD');
});
test('public HTML conversion keeps lists, emphasis, entities and absolute contact links',()=>{
  const markdown=publicMarkdown('<main><h1>Terms &amp; Help</h1><ol><li><strong>First</strong></li><li>Second</li></ol><p>It&#x27;s &#169; today.</p><a href="/faq">FAQ</a> <a href="mailto:contact@example.org">Email</a><form><input value="hidden"/>Do not submit</form></main>','/about');
  assert.match(markdown,/# Terms & Help/);
  assert.match(markdown,/1\. \*\*First\*\*/);
  assert.match(markdown,/2\. Second/);
  assert.match(markdown,/It's © today\./);
  assert.match(markdown,/\[FAQ\]\(<https:\/\/thenobiasmedia.com\/faq>\)/);
  assert.match(markdown,/\[Email\]\(<mailto:contact@example.org>\)/);
  assert.doesNotMatch(markdown,/hidden|Do not submit/);
});
