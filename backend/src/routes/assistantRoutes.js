const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const Assignment = require('../models/NewsAssignment');
const Outlet = require('../models/MediaOutlet');
const News = require('../models/News');
const Budget = require('../models/AssistantBudget');
const { outlets: defaults, categories } = require('../data/mediaOutlets');
const { validateOutlet, validateAssignment, validateDraft, text, articleCategories } = require('../services/assistant/policy');
const { validateArticleImage } = require('../services/imagePolicy');
const { searchSettings } = require('../services/assistant/parallel');
const { settings, configured } = require('../services/assistant/providers');
const budget = require('../services/assistant/budget');
const { enqueue, validSignature } = require('../services/assistant/queue');
const { runAssignment } = require('../services/assistant/worker');
const { getIo } = require('../socket');
const { storeImage } = require('../services/assistant/images');

function requireAdmin(req,res,next) {
  res.set('Cache-Control','no-store');
  try {
    const user = jwt.verify(req.cookies?.access_token,process.env.JWT_SECRET);
    if (user.role !== 'admin' || !user.email || user.email !== process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) return res.status(403).json({message:'Configure secure admin credentials and sign in as that administrator.'});
    req.admin = user;
  } catch { return res.status(401).json({message:'Please sign in as an administrator.'}); }
  if (!['GET','HEAD'].includes(req.method)) {
    const allowed = ['https://thenobiasmedia.com','https://www.thenobiasmedia.com',process.env.FRONTEND_URL];
    if (process.env.NODE_ENV !== 'production') allowed.push('http://localhost:3000');
    if (!req.get('Origin') || !allowed.filter(Boolean).includes(req.get('Origin'))) return res.status(403).json({message:'This request must originate from the admin website.'});
  }
  next();
}
const handle = fn => async(req,res) => {
  try { await fn(req,res); }
  catch (error) {
    const code = error.status || (error.code === 11000 ? 409 : 400);
    res.status(code).json({message:error.code === 11000 ? 'That record already exists. Refresh and try again.' : error.message});
  }
};
function fail(status,message) { const error = new Error(message); error.status = status; throw error; }
function id(value) { if (!/^[a-f\d]{24}$/i.test(value || '')) fail(400,'Invalid record ID.'); return value; }
function enabled() {
  if (!settings().enabled || !configured()) fail(503,'Configure Parallel, OpenAI, and xAI API keys and enable the assistant first.');
}
async function getJob(value, image = false) {
  const job = await Assignment.findById(id(value)).select(image ? '+imageUrl' : '').lean();
  if (!job) fail(404,'Assignment not found.');
  return job;
}
function createRouter(deps = {}) {
  const router = express.Router();
  const dispatch = deps.enqueue || enqueue;
  // Worker requests use a per-assignment HMAC, never an admin cookie.
  router.post('/worker',handle(async(req,res) => {
    const assignmentId = id(req.body.assignmentId);
    if (!validSignature(assignmentId,req.get('X-Assistant-Signature'))) return res.status(401).json({message:'Invalid worker signature.'});
    enabled();
    const result = await (deps.runAssignment || runAssignment)(assignmentId);
    res.status(result === 'busy' ? 503 : 200).json({result});
  }));
  router.use(requireAdmin);
  router.get('/config',handle(async(req,res) => {
    res.json({enabled:settings().enabled,configured:configured(),research:{provider:'parallel',mode:searchSettings().mode},
      models:{writer:settings().openaiModel,reviewer:settings().grokModel},queueMode:process.env.ASSISTANT_QUEUE_MODE || 'local',
      categories,articleCategories,maxOutlets:8,maxReviews:2,budget:await budget.summary()});
  }));
  router.get('/outlets',handle(async(req,res) => { res.json(await Outlet.find().sort({region:1,category:1,name:1}).lean()); }));
  router.post('/outlets/import-defaults',handle(async(req,res) => {
    await Outlet.bulkWrite(defaults.map(outlet => ({updateOne:{filter:{name:outlet.name},update:{$setOnInsert:outlet},upsert:true}})));
    res.json({message:'Source library imported. Existing entries were preserved; confirm proposed domains before research.'});
  }));
  router.post('/outlets',handle(async(req,res) => { res.status(201).json(await Outlet.create(validateOutlet(req.body))); }));
  router.put('/outlets/:id',handle(async(req,res) => {
    const outlet = await Outlet.findByIdAndUpdate(id(req.params.id),{$set:validateOutlet(req.body)},{new:true,runValidators:true});
    if (!outlet) fail(404,'Outlet not found.'); res.json(outlet);
  }));
  router.get('/assignments',handle(async(req,res) => {
    const page = Math.max(1,Math.min(1000,Number.parseInt(req.query.page,10)||1));
    res.json(await Assignment.find().sort({createdAt:-1}).skip((page-1)*30).limit(30)
      .select('topic category status stage error createdAt updatedAt publishedArticle revision').lean());
  }));
  router.get('/assignments/:id',handle(async(req,res) => { res.json(await getJob(req.params.id,true)); }));
  router.post('/assignments',handle(async(req,res) => {
    enabled();
    if (!Array.isArray(req.body.outletIds) || !req.body.outletIds.length || req.body.outletIds.length > 8) fail(400,'Select one to eight outlets.');
    const selectedIds = [...new Set(req.body.outletIds.map(id))];
    const outlets = await Outlet.find({_id:{$in:selectedIds},enabled:true}).lean();
    if (outlets.length !== selectedIds.length) fail(400,'One or more selected outlets are unavailable.');
    const details = validateAssignment(req.body,outlets);
    const image = await validateArticleImage(req.body.imageUrl);
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify({...details,outletIds:selectedIds.sort(),imageUrl:req.body.imageUrl})).digest('hex');
    // HTTP retries return the same saved assignment; never queue another charge.
    const existing = await Assignment.findOne({requestId:details.requestId}).lean();
    if (existing) {
      if (existing.createdBy !== req.admin.email || existing.fingerprint !== fingerprint) fail(409,'Request ID already belongs to another assignment. Start a new assignment.');
      return res.json(existing);
    }
    const dayKey = `assignments-${new Date().toISOString().slice(0,10)}`;
    try { await Budget.updateOne({_id:dayKey},{$setOnInsert:{calls:0,reservedMicros:0}},{upsert:true}); }
    catch (error) { if (error.code !== 11000) throw error; }
    const slot = await Budget.findOneAndUpdate({_id:dayKey,calls:{$lt:30}},{$inc:{calls:1}},{new:true});
    if (!slot) fail(429,'Daily limit of 30 assignment submissions reached.');
    const savedImage = await storeImage(req.body.imageUrl);
    // A configured cloud image host must actually serve the image publicly.
    if (savedImage !== req.body.imageUrl) await validateArticleImage(savedImage);
    const job = await Assignment.create({...details,...image,fingerprint,outlets,imageUrl:savedImage,createdBy:req.admin.email});
    try { await dispatch(job._id); }
    catch { await Assignment.updateOne({_id:job._id},{$set:{error:'Saved, but queue dispatch failed. Use Retry dispatch.'}}); }
    res.status(201).json(await getJob(String(job._id),true));
  }));
  router.post('/assignments/:id/retry',handle(async(req,res) => {
    enabled(); const job = await getJob(req.params.id);
    if (job.stage === 'research_insufficient') fail(409,'Create a new assignment with more sources or different dates.');
    if (!['failed','queued'].includes(job.status) || job.attempts >= 3) fail(409,'This assignment cannot be retried.');
    const updated = await Assignment.findOneAndUpdate({_id:job._id,status:job.status,revision:job.revision},
      {$set:{status:'queued',error:''},$inc:{revision:1}},{new:true});
    if (!updated) fail(409,'Assignment changed. Refresh first.');
    try { await dispatch(job._id); } catch { fail(503,'Assignment saved. Queue dispatch failed; check worker configuration and retry dispatch.'); }
    res.json({message:'Queued. Completed stages will be reused; an unfinished provider call may be billed again.'});
  }));
  router.put('/assignments/:id/draft',handle(async(req,res) => {
    const job = await getJob(req.params.id);
    if (job.status !== 'ready') fail(409,'Only completed drafts can be edited.');
    const draft = validateDraft({...job.draft,...req.body.draft},job.research.sources);
    const updated = await Assignment.findOneAndUpdate({_id:job._id,status:'ready',revision:req.body.revision},
      {$set:{draft,humanEdited:true},$inc:{revision:1}},{new:true}).lean();
    if (!updated) fail(409,'This draft changed in another window. Refresh before saving.');
    res.json(updated);
  }));
  router.post('/assignments/:id/reject',handle(async(req,res) => {
    const updated = await Assignment.findOneAndUpdate({_id:id(req.params.id),status:{$in:['ready','failed','queued']},revision:req.body.revision},
      {$set:{status:'rejected',reviewedBy:req.admin.email},$inc:{revision:1}},{new:true});
    if (!updated) fail(409,'Assignment changed or cannot be rejected.'); res.json({message:'Rejected.'});
  }));
  router.post('/assignments/:id/publish',handle(async(req,res) => {
    const job = await getJob(req.params.id,true);
    if (job.status === 'published') return res.json({articleId:job.publishedArticle});
    if (!['ready','publishing'].includes(job.status) || req.body.revision !== job.revision) fail(409,'Refresh and save the current draft before publishing.');
    if (req.body.approve !== true) fail(400,'Explicit editorial approval is required.');
    const reviewNote = text(req.body.reviewNote || '', 'editorial approval note',2000);
    const draft = validateDraft(job.draft,job.research.sources);
    const image = await validateArticleImage(job.imageUrl);
    // A preallocated deterministic article ID makes insert idempotent even if
    // the process dies between saving the article and updating the assignment.
    const articleId = job.publishedArticle || new mongoose.Types.ObjectId();
    const claimed = await Assignment.findOneAndUpdate({_id:job._id,status:'ready',revision:job.revision,publishedArticle:{$exists:false}},
      {$set:{status:'publishing',publishedArticle:articleId,reviewedBy:req.admin.email,reviewNote},$inc:{revision:1}},{new:true});
    if (!claimed && !job.publishedArticle) fail(409,'Another publish or edit is in progress. Refresh before retrying.');
    const source = draft.sourceIds.map(sourceId => {
      const s = job.research.sources.find(item => item.id === sourceId);
      return {_id:sourceId,source_type:s.category,url:s.url};
    });
    await News.updateOne({_id:articleId},{$setOnInsert:{title:draft.title,summary:draft.summary,content:draft.content,
      category:job.category,imageUrl:job.imageUrl,...image,imageCaption:job.imageCaption,imageCredit:job.imageCredit,
      assistantAssignment:job._id,source,createdAt:new Date()}},{upsert:true,runValidators:true});
    await Assignment.updateOne({_id:job._id,publishedArticle:articleId},{$set:{status:'published',publishedBy:req.admin.email,publishedAt:new Date()}});
    try { getIo().emit('article:created',{id:String(articleId)}); } catch { /* The saved article remains available on refresh. */ }
    res.json({articleId:String(articleId)});
  }));
  return router;
}
module.exports = { createRouter, requireAdmin };
