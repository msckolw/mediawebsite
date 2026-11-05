const test=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const cookieParser=require('cookie-parser');
const jwt=require('jsonwebtoken');
const {createRouter}=require('../src/routes/inquiryRoutes');
const {requireAdmin}=require('../src/routes/assistantRoutes');
const {validate,rateLimit}=require('../src/services/inquiries');
const {notify}=require('../src/services/inquiryNotifications');
const id='507f1f77bcf86cd799439011';
const details={requestId:'request-1234567890',kind:'investment',name:'Test Investor',email:'investor@example.org',company:'Example',phone:'',message:'I would like to discuss an investment.',consent:true,website:''};
const oldEnv={...process.env};
Object.assign(process.env,{JWT_SECRET:'inquiries-test-key',ADMIN_EMAIL:'admin@example.org',ADMIN_PASSWORD_HASH:'configured',NODE_ENV:'test'});
test.after(()=>{for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv);});
const query=value=>({select(){return this;},sort(){return this;},skip(){return this;},limit(){return this;},lean:async()=>value});
function counter() {
  const counts=new Map();
  return {counts,async findOneAndUpdate(filter){
    const n=counts.get(filter._id)||0;
    if(n>=filter.count.$lt)throw Object.assign(new Error('duplicate'),{code:11000});
    counts.set(filter._id,n+1);return {count:n+1};
  }};
}
async function serve(run) {
  const saved=new Map();const calls={notifications:0,failSave:false};const Limit=counter();
  const Model={
    findOne(filter){return query(saved.get(filter.requestId)||null);},
    async create(data){if(calls.failSave)throw Error('db unavailable');const item={...data,_id:id,status:'new',createdAt:new Date(),notification:{status:'pending'}};saved.set(data.requestId,item);return item;},
    find(filter){return query([...saved.values()].filter(item=>!filter.kind || item.kind===filter.kind));},
    countDocuments:async filter=>[...saved.values()].filter(item=>!filter.kind || item.kind===filter.kind).length,
    findById(value){return query([...saved.values()].find(item=>item._id===value)||null);},
    findByIdAndUpdate(value,update){const item=[...saved.values()].find(item=>item._id===value);if(item)Object.assign(item,update.$set);return query(item||null);}
  };
  const app=express();app.use(express.json());app.use(cookieParser());
  app.use('/api',createRouter({Model,Limit,requireAdmin,sendNotification:async()=>{calls.notifications++;throw Error('Email unavailable');}}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const post=(body=details,headers={})=>fetch(`${base}/inquiries`,{method:'POST',headers:{Origin:'http://localhost:3000','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  try {await run({saved,calls,base,post,Limit});} finally {await new Promise(resolve=>server.close(resolve));}
}
test('inquiries strictly validate consent, types, categories, lengths and honeypots',()=>{
  assert.equal(validate({...details,email:' INVESTOR@EXAMPLE.ORG '}).email,'investor@example.org');
  for(const change of [{consent:false},{consent:'true'},{kind:'payment'},{email:'invalid'},{name:{$gt:''}},{message:'short'},{message:'x'.repeat(5001)},{website:'spam'},{unknown:'field'},{phone:'not a phone'}]){
    assert.throws(()=>validate({...details,...change}),error=>error.status===400);
  }
});
test('saved investment inquiry returns a private receipt even when notification fails; identical retries do not duplicate',async()=>{
  await serve(async({saved,calls,post})=>{
    const first=await post();assert.equal(first.status,201);
    const receipt=await first.json();assert.equal(receipt.status,'received');assert.equal(receipt.kind,'investment');assert.equal(receipt.reference,id);
    for(const key of ['email','messageBody','name','phone','fingerprint','requestId'])assert.equal(receipt[key],undefined);
    assert.equal(saved.size,1);assert.equal(calls.notifications,1);assert.ok(saved.values().next().value.consentAt);
    const retry=await post();assert.equal(retry.status,200);assert.deepEqual(await retry.json(),receipt);assert.equal(saved.size,1);assert.equal(calls.notifications,1);
    assert.equal((await post({...details,message:'A different message with the same request ID.'})).status,409);
  });
});
test('public writes require the site Origin, JSON and valid consent; failed persistence does not send notifications',async()=>{
  await serve(async({post,saved,calls})=>{
    assert.equal((await post(details,{Origin:'https://foreign.example'})).status,403);
    assert.equal((await post(details,{Origin:''})).status,403);
    assert.equal((await post(details,{'Content-Type':'text/plain'})).status,415);
    assert.equal((await post({...details,consent:false})).status,400);
    assert.equal(saved.size,0);assert.equal(calls.notifications,0);
    calls.failSave=true;assert.equal((await post()).status,503);assert.equal(calls.notifications,0);
  });
});
test('durable rate counters block repeated submissions and roll over without storing raw contact or network identifiers',async()=>{
  const Limit=counter();const req={ip:'192.0.2.9',body:{email:details.email}};
  for(let n=0;n<5;n++)await rateLimit(Limit,req,1000);
  await assert.rejects(()=>rateLimit(Limit,req,1000),error=>error.status===429);
  await rateLimit(Limit,req,3601000);
  assert.ok([...Limit.counts.keys()].every(key=>!key.includes(req.ip)&&!key.includes(details.email)));
});
test('private inbox rejects anonymous/readers and foreign mutation origins; configured admin can review messages',async()=>{
  await serve(async({base,post})=>{
    await post();
    assert.equal((await fetch(`${base}/admin/inquiries`)).status,401);
    const reader=`access_token=${jwt.sign({role:'user',email:'reader@example.org'},process.env.JWT_SECRET)}`;
    assert.equal((await fetch(`${base}/admin/inquiries`,{headers:{cookie:reader}})).status,403);
    const admin=`access_token=${jwt.sign({role:'admin',email:process.env.ADMIN_EMAIL},process.env.JWT_SECRET)}`;
    const list=await fetch(`${base}/admin/inquiries?kind=investment`,{headers:{cookie:admin}});
    assert.equal(list.status,200);assert.equal(list.headers.get('cache-control'),'no-store');assert.equal((await list.json()).items.length,1);
    const update=origin=>fetch(`${base}/admin/inquiries/${id}`,{method:'PUT',headers:{cookie:admin,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({status:'reviewed'})});
    assert.equal((await update('https://foreign.example')).status,403);
    const result=await update('http://localhost:3000');assert.equal(result.status,200);assert.equal((await result.json()).status,'reviewed');
    assert.equal((await fetch(`${base}/inquiries/${id}`)).status,404);
  });
});
test('Resend notices omit personal details and reuse a stable provider idempotency key',async()=>{
  process.env.RESEND_API_KEY='test-only';process.env.INQUIRY_EMAIL_FROM='NoBias <notifications@example.org>';
  const sent=[];const updates=[];
  const Model={findOneAndUpdate:()=>query({...details,_id:id}),async updateOne(_filter,update){updates.push(update);}};
  const result=await notify(id,{Model,fetchImpl:async(url,options)=>{sent.push({url,options});return {ok:true};}});
  assert.equal(result,'sent');assert.equal(sent[0].url,'https://api.resend.com/emails');
  assert.equal(sent[0].options.headers['Idempotency-Key'],`nbm-inquiry-${id}`);
  const body=JSON.parse(sent[0].options.body);assert.deepEqual(body.to,['contact@thenobiasmedia.com']);
  assert.match(body.subject,/investment/);assert.match(body.text,/admin\/inquiries/);
  for(const secret of [details.email,details.name,details.message])assert.ok(!sent[0].options.body.includes(secret));
  assert.equal(updates[0].$set['notification.status'],'sent');
  assert.equal(await notify(id,{Model,fetchImpl:async()=>{throw Error('timeout');}}),'failed');
  assert.equal(updates[1].$set['notification.status'],'failed');
  delete process.env.RESEND_API_KEY;
  assert.equal(await notify(id,{Model,fetchImpl:async()=>{throw Error('must not call');}}),'pending');
});
