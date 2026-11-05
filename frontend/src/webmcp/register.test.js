import {registerSiteTools} from './register';
const manifest=require('../../public/webmcp.json');
const Ajv=require('ajv');
const ajv=new Ajv({allErrors:true});
const id='507f1f77bcf86cd799439011';
const article={_id:id,title:'Published headline',summary:'Summary',category:'business',content:'Article body',source:[{url:'https://example.org/story',source_type:'Independent'},{url:'javascript:alert(1)'}],private:'must not expose'};
const draft={kind:'investment',name:'Test Investor',email:'investor@example.org',message:'I would like to discuss an investment.'};
async function harness(options={}) {
  const tools={};const context={registerTool:jest.fn(async tool=>{tools[tool.name]=tool;}),unregisterTool:jest.fn()};
  const controller=new AbortController();
  const dependencies={context,manifest,signal:controller.signal,navigate:jest.fn(),getArticles:jest.fn(async()=>({articles:[article],currentPage:1,totalPages:1})),getArticleByCategory:jest.fn(async()=>({articles:[article],currentPage:1,totalPages:1})),getArticle:jest.fn(async()=>article),...options};
  await registerSiteTools(dependencies);return {...dependencies,tools,controller};
}
function validateOutput(name,value) {
  const schema=manifest.tools.find(tool=>tool.name===name).outputSchema;
  const valid=ajv.validate(schema,value);
  if(!valid)throw Error(JSON.stringify(ajv.errors));
}
test('registered tools match published schemas and project only public article fields',async()=>{
  const h=await harness();expect(Object.keys(h.tools)).toEqual(manifest.tools.map(tool=>tool.name));
  const feed=await h.tools.list_public_articles.execute({page:1});validateOutput('list_public_articles',feed);
  expect(feed.articles[0].private).toBeUndefined();expect(feed.articles[0].body).toBeUndefined();
  const full=await h.tools.get_public_article.execute({id});validateOutput('get_public_article',full);
  expect(full.article.body).toBe('Article body');expect(full.article.sources).toHaveLength(1);
  await h.tools.list_public_articles.execute({category:'business'});expect(h.getArticleByCategory).toHaveBeenCalledWith('business',1,undefined);
});
test('inquiry tool only opens a review draft and never supplies consent or writes to a server',async()=>{
  const h=await harness();const result=await h.tools.prepare_inquiry.execute(draft);validateOutput('prepare_inquiry',result);
  expect(result.status).toBe('awaiting_user_review');expect(h.navigate).toHaveBeenCalledWith('/contact',{state:{inquiryDraft:draft}});
  expect(h.getArticle).not.toHaveBeenCalled();expect(h.getArticles).not.toHaveBeenCalled();
  const invalid=await h.tools.prepare_inquiry.execute({...draft,consent:true});validateOutput('prepare_inquiry',invalid);expect(invalid.status).toBe('error');
  expect(h.navigate).toHaveBeenCalledTimes(1);
});
test('inquiry draft cannot replace unsent work and malformed content inputs cannot fetch URLs or private records',async()=>{
  const h=await harness();document.body.innerHTML='<form data-inquiry-dirty="true"></form>';
  try {expect((await h.tools.prepare_inquiry.execute(draft)).status).toBe('error');expect(h.navigate).not.toHaveBeenCalled();}
  finally {document.body.innerHTML='';}
  for(const input of [{id:'https://private.example'},{id,url:'https://private.example'},null]){
    const result=await h.tools.get_public_article.execute(input);validateOutput('get_public_article',result);expect(result.status).toBe('error');
  }
  expect(h.getArticle).not.toHaveBeenCalled();
});
test('unsupported browsers and canceled scopes do not register or execute tools; legacy responses contain valid JSON',async()=>{
  await expect(registerSiteTools({context:null})).resolves.toBeUndefined();
  const h=await harness();h.controller.abort();expect(h.context.unregisterTool).toHaveBeenCalledTimes(3);
  expect((await h.tools.prepare_inquiry.execute(draft)).status).toBe('error');expect(h.navigate).not.toHaveBeenCalled();
  const legacy=await harness({legacy:true});const response=await legacy.tools.prepare_inquiry.execute(draft);
  validateOutput('prepare_inquiry',JSON.parse(response.content[0].text));
});
