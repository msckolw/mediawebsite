const crypto = require('node:crypto');
const kinds = ['investment','experience','suggestion','general'];
function fail(status,message) { throw Object.assign(new Error(message),{status}); }
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400,'Enter your inquiry details.');
  const fields=['requestId','kind','name','email','phone','company','message','consent','website'];
  if (Object.keys(body).some(key=>!fields.includes(key))) fail(400,'Unexpected inquiry field.');
  const text=(key,min,max)=>{
    const value=body[key] === undefined ? '' : body[key];
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail(400,`Check the ${key} field.`);
    return value.trim();
  };
  const requestId=text('requestId',16,128);
  if (!/^[a-zA-Z0-9_-]+$/.test(requestId)) fail(400,'Invalid inquiry request ID.');
  const kind=text('kind',1,30);
  if (!kinds.includes(kind)) fail(400,'Choose a valid inquiry type.');
  const name=text('name',2,100), email=text('email',3,254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400,'Enter a valid email address.');
  const phone=text('phone',0,30), company=text('company',0,150), message=text('message',10,5000);
  if (phone && !/^[+\d\s().-]{6,30}$/.test(phone)) fail(400,'Enter a valid phone number or leave it blank.');
  if (body.consent !== true) fail(400,'Please agree to being contacted about this inquiry.');
  if (text('website',0,200)) fail(400,'Could not accept this inquiry.');
  const details={requestId,kind,name,email,phone,company,message};
  return {...details,fingerprint:crypto.createHash('sha256').update(JSON.stringify(details)).digest('hex')};
}
function receipt(inquiry) {
  return {status:'received',reference:String(inquiry._id),kind:inquiry.kind,
    message:'Your inquiry has been saved. Thank you for getting in touch.'};
}
async function takeSlot(Model,key,limit,now) {
  const bucket=Math.floor(now/3600000);
  const _id=`${bucket}:${key}`;
  try {
    const slot=await Model.findOneAndUpdate({_id,count:{$lt:limit}},
      {$inc:{count:1},$setOnInsert:{expiresAt:new Date((bucket+2)*3600000)}},
      {upsert:true,new:true,setDefaultsOnInsert:false});
    return Boolean(slot);
  } catch(error) { if (error.code===11000) return false; throw error; }
}
async function rateLimit(Model,req,now=Date.now()) {
  // Do not trust client-supplied X-Forwarded-For. The socket address is
  // conservative behind a proxy; a shared global cap also bounds database growth.
  const address=req.ip || req.socket?.remoteAddress || 'unknown';
  const key=crypto.createHmac('sha256',process.env.JWT_SECRET).update(address).digest('hex');
  const sender=crypto.createHmac('sha256',process.env.JWT_SECRET).update(String(req.body.email).trim().toLowerCase()).digest('hex');
  if (!await takeSlot(Model,`email:${sender}`,5,now) || !await takeSlot(Model,`ip:${key}`,50,now) || !await takeSlot(Model,'global',200,now)) fail(429,'Too many inquiries. Please try again later or email contact@thenobiasmedia.com.');
}
module.exports={validate,receipt,rateLimit,kinds,fail};
