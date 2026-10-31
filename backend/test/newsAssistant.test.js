const test = require('node:test');
const assert = require('node:assert/strict');
const { validateOutlet, sourceUrl, validateAssignment, validateDraft } = require('../src/services/assistant/policy');
const { extractArticle, readSources, downloadPage } = require('../src/services/assistant/research');
const { nextStep } = require('../src/services/assistant/pipeline');
const { providerCall, parseJson } = require('../src/services/assistant/providers');
const { validSignature, signature } = require('../src/services/assistant/queue');

const outlets = [
  {name:'Left outlet',domains:['left.example'],category:'Progressive / Left',region:'Indian'},
  {name:'Right outlet',domains:['right.example'],category:'Right / Conservative',region:'Indian'}
];
const sources = outlets.map((o,i) => ({id:`S${i+1}`,url:`https://${o.domains[0]}/story`,outlet:o.name,category:o.category,status:'read',publicationDate:'2026-10-28',text:'Evidence from original reporting.'}));
const draft = {title:'Reported development',summary:'A summary supported by reporting.',content:'The article attributes the accounts to the sources.',sourceIds:['S1','S2'],claims:[{claim:'A development was reported.',sourceIds:['S1','S2']}]};
const job = () => ({topic:'Development',context:'',fromDate:'2026-10-28',toDate:'2026-10-28',outlets,seedUrls:[],stage:'research',status:'running',versions:[],reviews:[],warnings:[],usage:[]});
const html = `<title>Actual article</title><script type="application/ld+json">{"datePublished":"2026-10-28T12:00:00Z"}</script><article><nav>Navigation</nav><p>${'Reported evidence. '.repeat(80)}</p></article>`;

test('source library validates domains and preserves editor categories', () => {
  const outlet = validateOutlet({...outlets[0],access:'unknown',enabled:true});
  assert.equal(outlet.category,'Progressive / Left');
  assert.throws(() => validateOutlet({...outlet,domains:['https://left.example']}));
  assert.throws(() => validateOutlet({...outlet,category:'Invented category'}));
});

test('source URL policy rejects lookalike hosts, credentials, localhost and homepages', async () => {
  for (const url of ['https://left.example.evil.org/story','http://left.example/story','https://a:b@left.example/story','https://left.example/','https://localhost/story']) assert.throws(() => sourceUrl(url,outlets));
  assert.equal(sourceUrl('https://news.left.example/story',outlets),'https://news.left.example/story');
  await assert.rejects(downloadPage('https://left.example/story',outlets,0,async () => [{address:'127.0.0.1',family:4}]),/public IP/);
});

test('assignment dates are real, ordered and limited to 31 days', () => {
  const valid = {topic:'News',category:'politics',fromDate:'2026-10-01',toDate:'2026-10-28',requestId:'1234567890abcdef',seedUrls:[]};
  assert.equal(validateAssignment(valid,outlets).topic,'News');
  for (const patch of [{fromDate:'2026-02-30'},{fromDate:'2026-10-29'},{fromDate:'2025-01-01'}]) assert.throws(() => validateAssignment({...valid,...patch},outlets));
});

test('extractor records actual page dates and excludes script/navigation text', () => {
  const extracted = extractArticle(html);
  assert.equal(extracted.publicationDate,'2026-10-28');
  assert.equal(extracted.title,'Actual article');
  assert.ok(!extracted.text.includes('Navigation'));
  assert.throws(() => extractArticle(html.replace('"datePublished"','"fakeDate"')),/publication date/);
  assert.throws(() => extractArticle(html.replace('{"datePublished"','{"isAccessibleForFree":false,"datePublished"')),/Subscription/);
});

test('page access failures and out-of-range dates are preserved as coverage gaps', async () => {
  const assignment = job();
  const result = await readSources([{url:sources[0].url},{url:sources[1].url}],assignment,async url => {
    if (url.includes('right')) throw new Error('Subscription required.');
    return {url,html:html.replace('2026-10-28','2026-09-01')};
  });
  assert.equal(result.filter(s => s.status === 'read').length,0);
  assert.match(result[0].reason,/outside/);
  assert.match(result[1].reason,/Subscription/);
});

test('draft validation rejects invented evidence and two copies of the same source domain', () => {
  assert.equal(validateDraft(draft,sources).title,draft.title);
  assert.throws(() => validateDraft({...draft,sourceIds:['S1','S3']},sources),/unknown/);
  assert.throws(() => validateDraft({...draft,claims:[{claim:'Unsupported',sourceIds:['S9']}]},sources),/evidence/);
  assert.throws(() => validateDraft(draft,[sources[0],{...sources[1],url:'https://left.example/other'}]),/distinct/);
});

test('invalid and duplicate candidates do not consume the eight-page read allowance', async () => {
  const candidates = [
    ...Array.from({length:8},() => ({url:'https://unselected.example/story'})),
    ...Array.from({length:8},() => ({url:sources[0].url})),
    ...Array.from({length:10},(_,i) => ({url:`https://right.example/story-${i}`}))
  ];
  const opened = [];
  const result = await readSources(candidates,job(),async url => {
    opened.push(url);
    return {url,html};
  });
  assert.equal(opened.length,8);
  assert.equal(new Set(opened).size,8);
  assert.equal(result.filter(source => source.status === 'read').length,8);
  assert.equal(opened[0],sources[0].url);
});

test('Parallel discovery checkpoints only approved result URLs and editor links before page reads', async () => {
  const assignment = job(); let opened; const calls=[];
  assignment.seedUrls=['https://left.example/editor-story'];
  const result = await nextStep(assignment,async (provider,input) => {
    calls.push(provider);assert.equal(input,assignment);
    return {sources:[{url:sources[0].url},{url:sources[1].url},{url:'https://evil.example/story'},{url:'https://left.example.evil.org/story'}]};
  },async()=>{throw Error('Do not read before checkpoint');});
  assert.equal(result.stage,'read_sources');
  assert.equal(result.research.candidates.length,3);
  Object.assign(assignment,result);
  const draftStep=await nextStep(assignment,async()=>{throw Error('Do not search again on resume');},async candidates=>{opened=candidates;return sources;});
  assert.equal(opened.length,3);assert.equal(draftStep.stage,'draft');assert.deepEqual(calls,['parallel']);
});

test('full workflow searches once with Parallel, then writes and reviews without search tools',async()=>{
  const state=job();const calls=[];
  const call=async provider=>{
    calls.push(provider);
    if(provider==='parallel') return {sources:sources.map(s=>({url:s.url}))};
    return {text:JSON.stringify(provider==='openai' ? draft : {summary:'Check attribution.',findings:[{severity:'minor',passage:draft.content,issue:'Attribution',correction:'Attribute.',sourceIds:['S1']}]})};
  };
  for(let step=0;step<7 && state.status==='running';step++) Object.assign(state,await nextStep(state,call,async()=>sources));
  assert.equal(state.status,'ready');
  assert.deepEqual(calls,['parallel','openai','xai','openai','xai','openai']);
});

test('two-round review loop stops with a final human-review warning even if Grok keeps finding issues', async () => {
  const state = {...job(),stage:'draft',research:{sources}}; const calls=[];
  const call = async provider => {
    calls.push(provider);
    return {text:JSON.stringify(provider === 'openai' ? {...draft,revisionNotes:'Attributed the disputed account.'} : {summary:'An attribution needs attention.',findings:[{severity:'major',passage:draft.content,issue:'Needs attribution.',correction:'Attribute it.',sourceIds:['S1']}]})};
  };
  for (let step=0;step<8 && state.status === 'running';step++) Object.assign(state,await nextStep(state,call));
  assert.equal(state.status,'ready');
  assert.deepEqual(calls,['openai','xai','openai','xai','openai']);
  assert.equal(state.reviews.length,2);
  assert.equal(state.versions.length,3);
  assert.match(state.warnings.at(-1),/third Grok/);
});

test('a clean first review ends the workflow without another revision or review', async () => {
  const state = {...job(),stage:'review1',research:{sources},draft};
  const result = await nextStep(state,async provider => {assert.equal(provider,'xai');return {text:JSON.stringify({summary:'No actionable findings.',findings:[]})};});
  assert.equal(result.status,'ready'); assert.equal(result.reviews.length,1);
});

test('Luna writes without hosted search tools, disables storage and records token usage', async () => {
  const old = {...process.env}; process.env.ASSISTANT_ENABLED='true';process.env.OPENAI_API_KEY='test-private-key';
  let payload; let settled; let requestedUrl;
  try {
    const result = await providerCall({provider:'openai',prompt:'Write using supplied evidence',reserve:async()=>({amount:1}),settle:async(_ticket,record)=>{settled=record;},fetchImpl:async(url,options)=>{
      requestedUrl=url;payload=JSON.parse(options.body);
      return {ok:true,json:async()=>({id:'r1',status:'completed',usage:{input_tokens:100,output_tokens:50},output:[{type:'web_search_call',action:{type:'search',sources:[{url:sources[0].url}]}},{type:'message',content:[{type:'output_text',text:'{"ok":true}'}]}]})};
    }});
    assert.equal(requestedUrl,'https://api.openai.com/v1/responses');
    assert.equal(payload.store,false);assert.equal(payload.tools,undefined);assert.equal(payload.tool_choice,undefined);
    assert.equal(payload.max_tool_calls,undefined);
    assert.equal(settled.inputTokens,100);assert.equal(settled.searchCalls,0);assert.equal(parseJson(result.text).ok,true);
  } finally { for (const key of ['ASSISTANT_ENABLED','OPENAI_API_KEY']) { if (old[key] === undefined) delete process.env[key];else process.env[key]=old[key]; } }
});

test('xAI review is direct, has no search tools, and HTTP errors do not leak provider bodies', async () => {
  const old = {...process.env};process.env.ASSISTANT_ENABLED='true';process.env.XAI_API_KEY='private';
  try {
    let payload;
    await assert.rejects(providerCall({provider:'xai',prompt:'Review evidence',reserve:async()=>({}),settle:async()=>{throw Error('Must not settle ambiguous failures');},fetchImpl:async(url,options)=>{
      assert.equal(url,'https://api.x.ai/v1/chat/completions');payload=JSON.parse(options.body);return {ok:false,status:429,text:async()=> 'private request fragment'};
    }}),error => /HTTP 429/.test(error.message) && !error.message.includes('private'));
    assert.equal(payload.tools,undefined);assert.equal(payload.response_format.type,'json_object');
  } finally { for (const key of ['ASSISTANT_ENABLED','XAI_API_KEY']) { if (old[key] === undefined) delete process.env[key];else process.env[key]=old[key]; } }
});

test('worker authentication is bound to assignment ID and fails closed without a strong secret', () => {
  const old=process.env.ASSISTANT_WORKER_SECRET;
  try {
    process.env.ASSISTANT_WORKER_SECRET='test-secret-which-is-at-least-thirty-two-characters';
    const signed=signature('assignment-one');assert.ok(validSignature('assignment-one',signed));assert.ok(!validSignature('assignment-two',signed));
    assert.ok(!validSignature('assignment-one','bad'));
    delete process.env.ASSISTANT_WORKER_SECRET;assert.ok(!validSignature('assignment-one',signed));
  } finally { if (old === undefined) delete process.env.ASSISTANT_WORKER_SECRET;else process.env.ASSISTANT_WORKER_SECRET=old; }
});
