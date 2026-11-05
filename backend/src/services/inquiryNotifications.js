const Inquiry = require('../models/Inquiry');
async function notify(id,{Model=Inquiry,fetchImpl=fetch,now=new Date()}={}) {
  if (!process.env.RESEND_API_KEY || !process.env.INQUIRY_EMAIL_FROM) return 'pending';
  const inquiry=await Model.findOneAndUpdate({_id:id,$or:[
    {'notification.status':{$in:['pending','failed']}},
    {'notification.status':'sending','notification.attemptedAt':{$lt:new Date(now.getTime()-120000)}}
  ]},{$set:{'notification.status':'sending','notification.attemptedAt':now},$inc:{'notification.attempts':1}},{new:true}).lean();
  if (!inquiry) return 'unchanged';
  try {
    const response=await fetchImpl('https://api.resend.com/emails',{
      method:'POST',signal:AbortSignal.timeout(8000),headers:{
        Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json',
        'Idempotency-Key':`nbm-inquiry-${id}`
      },body:JSON.stringify({from:process.env.INQUIRY_EMAIL_FROM,
        to:[process.env.INQUIRY_EMAIL_TO || 'contact@thenobiasmedia.com'],
        subject:inquiry.kind==='investment' ? 'New investment inquiry | The NoBias Media' : 'New reader inquiry | The NoBias Media',
        text:`A new ${inquiry.kind} inquiry is waiting in your private inbox.\n\nOpen https://thenobiasmedia.com/admin/inquiries\nReference: ${id}\n\nSign in to read and reply. This notification contains no visitor contact details or message.`
      })
    });
    if (!response.ok) throw new Error('Email provider rejected the request.');
    await Model.updateOne({_id:id,'notification.status':'sending','notification.attemptedAt':now},{$set:{'notification.status':'sent','notification.sentAt':new Date()}});
    return 'sent';
  } catch {
    // Keep provider errors, secrets, and visitor data out of logs and public responses.
    await Model.updateOne({_id:id,'notification.status':'sending','notification.attemptedAt':now},{$set:{'notification.status':'failed'}});
    return 'failed';
  }
}
module.exports={notify};
