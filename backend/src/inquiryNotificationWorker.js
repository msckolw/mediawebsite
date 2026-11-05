require('dotenv').config();
const mongoose=require('mongoose');
const Inquiry=require('./models/Inquiry');
const {notify}=require('./services/inquiryNotifications');
async function main() {
  if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_EMAIL_FROM) throw new Error('Configure inquiry email settings before running the notification worker.');
  await mongoose.connect(process.env.MONGODB_URI,{useNewUrlParser:true,useUnifiedTopology:true});
  const now=Date.now();
  // Bound retries. Resend deduplicates for 24 hours; older uncertain deliveries
  // need explicit admin review rather than an automatic potentially duplicate send.
  const items=await Inquiry.find({createdAt:{$gt:new Date(now-23*3600000)},
    'notification.attempts':{$lt:5},$or:[
      {'notification.status':{$in:['pending','failed']}},
      {'notification.status':'sending','notification.attemptedAt':{$lt:new Date(now-120000)}}
    ]}).sort({createdAt:1}).limit(50).select('_id').lean();
  for (const item of items) await notify(String(item._id));
  console.log(`Checked ${items.length} inquiry notification(s).`);
}
main().catch(()=>{console.error('Inquiry notification worker failed; check backend configuration.');process.exitCode=1;})
  .finally(()=>mongoose.disconnect());
