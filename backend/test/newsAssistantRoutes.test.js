const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const assignmentId = '507f1f77bcf86cd799439011';
const initialJob = () => ({_id:assignmentId,createdBy:'editor@example.org',topic:'A news topic',category:'politics',status:'ready',stage:'complete',revision:0,
  fromDate:'2026-10-28',toDate:'2026-10-28',imageUrl:'data:image/png;base64,test',
  research:{sources:[{id:'S1',status:'read',url:'https://first.example/story',category:'Center / Neutral'},{id:'S2',status:'read',url:'https://second.example/story',category:'Center-Left'}]},
  draft:{title:'Headline',summary:'Summary',content:'Body',sourceIds:['S1','S2'],claims:[{claim:'A factual claim',sourceIds:['S1']}]},reviews:[],versions:[]});
const clone = value => value ? JSON.parse(JSON.stringify(value)) : value;
function query(value) {
  return {select(){return this;},lean:async()=>clone(value),then:(resolve,reject)=>Promise.resolve(clone(value)).then(resolve,reject)};
}
function harness() {
  const state = {job:initialJob(),articles:new Map(),events:[],workerCalls:0,failInsert:false};
  const Assignment = {
    findById:()=>query(state.job),
    findOneAndUpdate(filter,update) {
      const current=state.job;
      const matches=Object.entries(filter).every(([key,value]) => {
        if (value?.$exists !== undefined) return (current[key] !== undefined) === value.$exists;
        if (value?.$in) return value.$in.includes(current[key]);
        return String(current[key]) === String(value);
      });
      if (!matches) return query(null);
      Object.assign(current,update.$set);
      for (const [key,value] of Object.entries(update.$inc || {})) current[key]=(current[key]||0)+value;
      return query(current);
    },
    async updateOne(_filter,update) {Object.assign(state.job,update.$set);}
  };
  const News = {async updateOne(filter,update) {
    if (state.failInsert) {state.failInsert=false;throw Error('Simulated write interruption');}
    const id=String(filter._id);if (!state.articles.has(id)) state.articles.set(id,clone(update.$setOnInsert));
  }};
  const module = {exports:{}};
  const source = path.join(__dirname,'../src/routes/assistantRoutes.js');
  vm.runInNewContext(fs.readFileSync(source,'utf8'),{module,process,Buffer,console,
    require(name) {
      if (name === '../models/NewsAssignment') return Assignment;
      if (name === '../models/News') return News;
      if (name === '../models/MediaOutlet' || name === '../models/AssistantBudget') return {};
      if (name === '../services/imagePolicy') return {validateArticleImage:async()=>({imageMetadata:{width:1200,height:675}})};
      if (name === '../services/assistant/images') return {storeImage:async value=>value};
      if (name === '../services/assistant/budget') return {summary:async()=>({allowanceUsd:20,estimatedAndReservedUsd:0})};
      if (name === '../services/assistant/worker') return {};
      if (name === '../socket') return {getIo:()=>({emit:(...args)=>state.events.push(args)})};
      if (name.startsWith('.')) return require(path.resolve(path.dirname(source),name));
      return require(name);
    }
  });
  return {state,router:module.exports.createRouter({runAssignment:async()=>{state.workerCalls++;return 'finished';}})};
}
async function serve(run) {
  const prior={...process.env};
  Object.assign(process.env,{JWT_SECRET:'assistant-test-secret',JWT_REFRESH_SECRET:'test-refresh',ADMIN_EMAIL:'editor@example.org',ADMIN_PASSWORD_HASH:'configured-hash',ASSISTANT_ENABLED:'true',PARALLEL_API_KEY:'fake-parallel',OPENAI_API_KEY:'fake-openai',XAI_API_KEY:'fake-xai',ASSISTANT_WORKER_SECRET:'long-worker-test-secret-over-thirty-two-characters'});
  const h=harness();const app=express();app.use(express.json());app.use(cookieParser());app.use('/assistant',h.router);
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/assistant`;
  const cookie=`access_token=${jwt.sign({email:'editor@example.org',role:'admin'},process.env.JWT_SECRET)}`;
  const request=(route,body,headers={})=>fetch(`${base}${route}`,{method:'POST',headers:{cookie,Origin:'http://localhost:3000','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  try {await run({...h,base,request,cookie});}
  finally {await new Promise(resolve=>server.close(resolve));for (const key of Object.keys(process.env)) if (!(key in prior)) delete process.env[key];Object.assign(process.env,prior);}
}

test('assistant endpoints reject missing sessions, readers and foreign mutation origins',async()=>{
  await serve(async({base,request})=>{
    assert.equal((await fetch(`${base}/assignments/${assignmentId}`)).status,401);
    const cookie=`access_token=${jwt.sign({email:'reader@example.org',role:'user'},process.env.JWT_SECRET)}`;
    assert.equal((await request(`/assignments/${assignmentId}/publish`,{}, {cookie})).status,403);
    assert.equal((await request(`/assignments/${assignmentId}/publish`,{}, {Origin:'https://attacker.example'})).status,403);
  });
});

test('worker cannot be invoked with only an admin cookie or an invalid signature',async()=>{
  await serve(async({request,state})=>{
    assert.equal((await request('/worker',{assignmentId})).status,401);assert.equal(state.workerCalls,0);
    const {signature}=require('../src/services/assistant/queue');
    assert.equal((await request('/worker',{assignmentId},{'X-Assistant-Signature':signature(assignmentId)})).status,200);
    assert.equal(state.workerCalls,1);
  });
});

test('publication requires explicit approval, a review note and the current revision',async()=>{
  await serve(async({request,state})=>{
    const route=`/assignments/${assignmentId}/publish`;
    assert.equal((await request(route,{revision:0,approve:false,reviewNote:'Reviewed'})).status,400);
    assert.equal((await request(route,{revision:0,approve:true,reviewNote:''})).status,400);
    assert.equal((await request(route,{revision:9,approve:true,reviewNote:'Reviewed'})).status,409);
    assert.equal(state.articles.size,0);
  });
});

test('concurrent approvals and replayed requests publish one article with preserved source labels',async()=>{
  await serve(async({request,state})=>{
    const route=`/assignments/${assignmentId}/publish`;const body={revision:0,approve:true,reviewNote:'Sources and image reviewed.'};
    const responses=await Promise.all([request(route,body),request(route,body)]);
    assert.ok(responses.some(r=>r.status===200));assert.ok(responses.every(r=>[200,409].includes(r.status)));
    assert.equal(state.articles.size,1);assert.equal(state.job.status,'published');
    assert.equal([...state.articles.values()][0].source[1].source_type,'Center-Left');
    const replay=await request(route,body);assert.equal(replay.status,200);assert.equal(state.articles.size,1);
  });
});

test('interrupted publication freezes editing and can finish with the preallocated article ID',async()=>{
  await serve(async({request,state})=>{
    const route=`/assignments/${assignmentId}/publish`;state.failInsert=true;
    assert.equal((await request(route,{revision:0,approve:true,reviewNote:'Reviewed'})).status,400);
    assert.equal(state.job.status,'publishing');const allocated=String(state.job.publishedArticle);
    assert.equal((await request(route,{revision:state.job.revision,approve:true,reviewNote:'Retry same approved version'})).status,200);
    assert.equal(String(state.job.publishedArticle),allocated);assert.equal(state.articles.size,1);
  });
});

test('admin login fails closed until configured and verifies a hashed password',async()=>{
  const prior={...process.env};process.env.JWT_SECRET='test';process.env.JWT_REFRESH_SECRET='test-refresh';
  process.env.ADMIN_EMAIL='editor@example.org';process.env.ADMIN_PASSWORD_HASH=await bcrypt.hash('test-only-password',4);
  const app=express();app.use(express.json());app.use('/auth',require('../src/routes/authRoutes'));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const request=password=>fetch(`http://127.0.0.1:${server.address().port}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'editor@example.org',password})});
  try {
    assert.equal((await request('wrong-password')).status,401);
    const success=await request('test-only-password');assert.equal(success.status,200);assert.match(success.headers.get('set-cookie'),/HttpOnly/);
    delete process.env.ADMIN_PASSWORD_HASH;assert.equal((await request('test-only-password')).status,503);
  } finally {await new Promise(resolve=>server.close(resolve));for (const key of Object.keys(process.env)) if (!(key in prior)) delete process.env[key];Object.assign(process.env,prior);}
});

test('research configuration requires all three keys and reports Parallel separately from the models',async()=>{
  await serve(async({base,cookie,request,state})=>{
    const config=async()=>(await fetch(`${base}/config`,{headers:{cookie}})).json();
    const ready=await config();assert.equal(ready.configured,true);assert.equal(ready.research.provider,'parallel');
    for(const key of ['PARALLEL_API_KEY','OPENAI_API_KEY','XAI_API_KEY']) {
      const value=process.env[key];delete process.env[key];
      assert.equal((await config()).configured,false);
      const response=await request('/assignments',{});assert.equal(response.status,503);
      assert.match((await response.json()).message,/Parallel, OpenAI, and xAI/);
      process.env[key]=value;
    }
    assert.equal(state.workerCalls,0);
  });
});
