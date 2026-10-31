const test = require('node:test');
const assert = require('node:assert/strict');
const { parallelSearch, searchSettings } = require('../src/services/assistant/parallel');
const budget = require('../src/services/assistant/budget');
const Budget = require('../src/models/AssistantBudget');

const assignment = {
  topic:'Election results',context:'Compare the reporting.',fromDate:'2026-10-01',toDate:'2026-10-28',
  outlets:[{domains:['first.example']},{domains:['second.example','first.example']}],
  imageUrl:'private-image-not-for-search',draft:{content:'private-draft-not-for-search'}
};
async function withConfig(run) {
  const prior={...process.env};
  process.env.ASSISTANT_ENABLED='true';process.env.PARALLEL_API_KEY='test-key';
  delete process.env.ASSISTANT_PARALLEL_SEARCH_MODE;
  delete process.env.ASSISTANT_PARALLEL_SEARCH_USD_PER_REQUEST;
  try { await run(); }
  finally {
    for(const key of Object.keys(process.env)) if(!(key in prior)) delete process.env[key];
    Object.assign(process.env,prior);
  }
}

test('direct Parallel search authenticates, bounds results, filters domains and charges requests without tokens',async()=>withConfig(async()=>{
  let reserved;let settled;
  const result=await parallelSearch({assignment,
    reserve:async(provider,options)=>{reserved={provider,...options};return {amount:1000};},
    settle:async(_ticket,record)=>{settled=record;},
    fetchImpl:async(url,options)=>{
      assert.equal(url,'https://api.parallel.ai/v1/search');assert.equal(options.headers['x-api-key'],'test-key');
      const body=JSON.parse(options.body);assert.equal(body.mode,'fast');
      assert.equal(body.advanced_settings.max_results,10);
      assert.deepEqual(body.advanced_settings.source_policy,{include_domains:['first.example','second.example'],after_date:'2026-10-01'});
      assert.deepEqual(body.search_queries,['Election results']);assert.match(body.objective,/2026-10-28/);
      assert.ok(!options.body.includes('private-image'));assert.ok(!options.body.includes('private-draft'));
      return {ok:true,json:async()=>({search_id:'search-test',results:[{url:'https://first.example/story',title:'Headline',excerpts:['Never use this snippet as evidence.']}]})};
    }});
  assert.deepEqual(reserved,{provider:'parallel',searchRateUsd:0.001});
  assert.equal(settled.searchCalls,1);assert.equal(settled.inputTokens,0);assert.equal(settled.requestId,'search-test');
  assert.equal(budget.estimateMicros(settled),1000);
  assert.deepEqual(result.sources,[{url:'https://first.example/story',title:'Headline'}]);
}));

test('search mode pricing follows the selected mode and validates overrides before reserving',async()=>withConfig(async()=>{
  for(const [mode,rate] of Object.entries({turbo:0.001,fast:0.001,basic:0.005,advanced:0.005})) {
    process.env.ASSISTANT_PARALLEL_SEARCH_MODE=mode;assert.equal(searchSettings().rateUsd,rate);
  }
  process.env.ASSISTANT_PARALLEL_SEARCH_MODE='invented';assert.throws(searchSettings,/supported/);
  process.env.ASSISTANT_PARALLEL_SEARCH_MODE='fast';process.env.ASSISTANT_PARALLEL_SEARCH_USD_PER_REQUEST='0.002';
  assert.equal(searchSettings().rateUsd,0.002);
  for(const price of ['NaN','-1','0','']) {
    process.env.ASSISTANT_PARALLEL_SEARCH_USD_PER_REQUEST=price;
    await assert.rejects(parallelSearch({assignment,reserve:async()=>{throw Error('Must not reserve');}}),/positive Parallel search price/);
  }
}));

test('disabled research and a missing Parallel key do not reserve money or send a request',async()=>withConfig(async()=>{
  const options={assignment,reserve:async()=>{throw Error('Must not reserve');},fetchImpl:async()=>{throw Error('Must not send');}};
  process.env.ASSISTANT_ENABLED='false';await assert.rejects(parallelSearch(options),/disabled/);
  process.env.ASSISTANT_ENABLED='true';delete process.env.PARALLEL_API_KEY;await assert.rejects(parallelSearch(options),/key is not configured/);
}));

test('search failures retain reservations, redact provider bodies and never retry automatically',async()=>withConfig(async()=>{
  let sends=0;let settlements=0;
  const options={assignment,reserve:async()=>({amount:1000}),settle:async()=>{settlements++;}};
  await assert.rejects(parallelSearch({...options,fetchImpl:async()=>{sends++;return {ok:false,status:429,json:async()=>{throw Error('private request');}};}}),error=>/HTTP 429/.test(error.message)&&!error.message.includes('private'));
  await assert.rejects(parallelSearch({...options,fetchImpl:async()=>{sends++;throw Error('private key in transport error');}}),error=>/reservation was retained/.test(error.message)&&!error.message.includes('private'));
  assert.equal(sends,2);assert.equal(settlements,0);
  await assert.rejects(parallelSearch({...options,reserve:async()=>{throw Error('Monthly allowance reached');},fetchImpl:async()=>{sends++;}}),/allowance/);
  assert.equal(sends,2);
}));

test('successful empty and malformed result lists record the fixed search charge',async()=>withConfig(async()=>{
  let settlements=0;
  const options={assignment,reserve:async()=>({amount:1000}),settle:async()=>{settlements++;}};
  const empty=await parallelSearch({...options,fetchImpl:async()=>({ok:true,json:async()=>({results:[]})})});
  assert.deepEqual(empty.sources,[]);
  await assert.rejects(parallelSearch({...options,fetchImpl:async()=>({ok:true,json:async()=>({results:null})})}),/invalid search results/);
  assert.equal(settlements,2);
}));

test('budget reserves search at its fixed rate and settles zero-token requests without retaining the model allowance',async()=>withConfig(async()=>{
  const original={updateOne:Budget.updateOne,findOneAndUpdate:Budget.findOneAndUpdate};
  process.env.ASSISTANT_MONTHLY_BUDGET_USD='20';const updates=[];
  Budget.updateOne=async(filter,update)=>{updates.push({filter,update});};
  Budget.findOneAndUpdate=async(filter,update)=>{updates.push({filter,update});return {};};
  try {
    const ticket=await budget.reserve('parallel',{searchRateUsd:0.001});assert.equal(ticket.amount,1000);
    assert.equal(updates[1].filter.reservedMicros.$lte,19999000);
    assert.equal(updates[1].update.$inc.reservedMicros,1000);
    const record={provider:'parallel',searchCalls:1,searchRateUsd:0.001,inputTokens:0,outputTokens:0};
    await budget.settle(ticket,record);assert.equal(record.estimatedUsd,0.001);
    assert.equal(updates.at(-1).update.$inc.reservedMicros,0);
    const modelTicket=await budget.reserve('openai');assert.equal(modelTicket.amount,750000);
    Budget.findOneAndUpdate=async()=>null;
    await assert.rejects(budget.reserve('parallel',{searchRateUsd:0.001}),/allowance/);
    await assert.rejects(budget.reserve('parallel'),/Invalid assistant budget/);
    assert.throws(()=>budget.estimateMicros({...record,searchRateUsd:NaN}),/Invalid Parallel/);
  } finally { Object.assign(Budget,original); }
}));
