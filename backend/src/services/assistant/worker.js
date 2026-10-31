const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Assignment = require('../../models/NewsAssignment');
const Budget = require('./budget');
const { providerCall } = require('./providers');
const { parallelSearch } = require('./parallel');
const { nextStep } = require('./pipeline');

const lockSchema = new mongoose.Schema({ _id:String, token:String, until:Date });
const Lock = mongoose.models.AssistantLock || mongoose.model('AssistantLock',lockSchema);
const LEASE_MS = 180000;

async function runAssignment(id) {
  const token = crypto.randomUUID();
  try { await Lock.updateOne({_id:'worker'},{$setOnInsert:{until:new Date(0)}},{upsert:true}); }
  catch (error) { if (error.code !== 11000) throw error; }
  const lock = await Lock.findOneAndUpdate({_id:'worker',until:{$lt:new Date()}},{$set:{token,until:new Date(Date.now()+LEASE_MS)}},{new:true});
  if (!lock) return 'busy';
  let timer;
  try {
    let job = await Assignment.findOneAndUpdate({_id:id,attempts:{$lt:3},$or:[{status:'queued'},{status:'running',leaseUntil:{$lt:new Date()}}]},
      {$set:{status:'running',leaseToken:token,leaseUntil:new Date(Date.now()+LEASE_MS),error:''},$inc:{attempts:1}},{new:true}).lean();
    if (!job) {
      await Assignment.updateOne({_id:id,status:'running',attempts:{$gte:3},leaseUntil:{$lt:new Date()}},
        {$set:{status:'failed',error:'Worker recovery limit reached. Create a new assignment after checking provider usage.'}});
      return 'skipped';
    }
    let lostLease = false;
    timer = setInterval(async () => {
      try {
        const owned = await Lock.updateOne({_id:'worker',token},{$set:{until:new Date(Date.now()+LEASE_MS)}});
        if (!(owned.modifiedCount ?? owned.nModified)) { lostLease = true; return; }
        await Assignment.updateOne({_id:id,leaseToken:token},{$set:{leaseUntil:new Date(Date.now()+LEASE_MS)}});
      } catch { lostLease = true; }
    },30000);
    timer.unref();
    const save = async patch => {
      if (lostLease) throw new Error('Worker lease lost; wait for recovery before retrying.');
      const updated = await Assignment.findOneAndUpdate({_id:id,leaseToken:token,status:'running'},{$set:patch},{new:true}).lean();
      if (!updated) throw new Error('Assignment ownership changed.');
      job = updated;
    };
    const call = async (provider, input) => {
      if (lostLease) throw new Error('Worker lease lost.');
      const options = { reserve:Budget.reserve, settle:async(ticket,record) => {
        await Budget.settle(ticket,record);
        await save({usage:[...job.usage,{...record,stage:job.stage}]});
      }};
      return provider === 'parallel'
        ? parallelSearch({...options,assignment:input})
        : providerCall({...options,provider,prompt:input});
    };
    try {
      // Each stage is checkpointed; completed stages are not repeated on retry.
      for (let i = 0; i < 7 && job.status === 'running'; i++) await save(await nextStep(job,call));
      if (job.status === 'running') throw new Error('Assistant stage limit reached.');
    } catch (error) {
      await Assignment.updateOne({_id:id,leaseToken:token,status:'running'},{$set:{status:'failed',error:error.message}});
    }
    return 'finished';
  } finally {
    clearInterval(timer);
    await Lock.updateOne({_id:'worker',token},{$set:{until:new Date(0)}});
    await Assignment.updateOne({_id:id,leaseToken:token},{$unset:{leaseToken:1,leaseUntil:1}});
  }
}
async function runNext() {
  await Assignment.updateMany({status:'running',attempts:{$gte:3},leaseUntil:{$lt:new Date()}},
    {$set:{status:'failed',error:'Worker recovery limit reached. Create a new assignment after checking provider usage.'}});
  const job = await Assignment.findOne({attempts:{$lt:3},$or:[{status:'queued'},{status:'running',leaseUntil:{$lt:new Date()}}]}).sort({createdAt:1}).select('_id').lean();
  return job ? runAssignment(job._id) : 'empty';
}
module.exports = { runAssignment, runNext };
