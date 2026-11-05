const express = require('express');
const Inquiry = require('../models/Inquiry');
const InquiryLimit = require('../models/InquiryLimit');
const {validate,receipt,rateLimit,kinds,fail} = require('../services/inquiries');
const {notify} = require('../services/inquiryNotifications');
function createRouter({Model=Inquiry,Limit=InquiryLimit,sendNotification=notify,requireAdmin=require('./assistantRoutes').requireAdmin}={}) {
  const router=express.Router();
  const handle=fn=>async(req,res)=>{
    res.set('Cache-Control','no-store');
    try { await fn(req,res); }
    catch(error) {
      const status=error.status || 503;
      if (status===429) res.set('Retry-After','3600');
      res.status(status).json({message:error.status ? error.message : 'Could not save your inquiry. Please try again or email contact@thenobiasmedia.com.'});
    }
  };
  router.post('/inquiries',handle(async(req,res)=>{
    const origins=['https://thenobiasmedia.com','https://www.thenobiasmedia.com',process.env.FRONTEND_URL];
    if (process.env.NODE_ENV!=='production') origins.push('http://localhost:3000');
    if (!req.get('Origin') || !origins.filter(Boolean).includes(req.get('Origin'))) fail(403,'Please submit inquiries from The NoBias Media website.');
    if (!req.is('application/json')) fail(415,'Send inquiry details as JSON.');
    if (Buffer.byteLength(JSON.stringify(req.body || {}))>12000) fail(413,'Your inquiry is too long.');
    const details=validate(req.body);
    const existing=await Model.findOne({requestId:details.requestId}).select('+fingerprint').lean();
    if (existing) {
      if (existing.fingerprint!==details.fingerprint) fail(409,'These details changed after the last submission attempt. Start a new inquiry or restore the previous details.');
      return res.json(receipt(existing));
    }
    await rateLimit(Limit,req);
    let saved;
    try { saved=await Model.create({...details,consentAt:new Date()}); }
    catch(error) {
      if (error.code!==11000) throw error;
      saved=await Model.findOne({requestId:details.requestId}).select('+fingerprint').lean();
      if (!saved || saved.fingerprint!==details.fingerprint) fail(409,'This request ID belongs to another inquiry.');
    }
    // Saving succeeds even if email is unavailable. The admin inbox retains a retry action.
    try { await sendNotification(String(saved._id)); } catch { /* Saved inquiry is durable. */ }
    res.status(201).json(receipt(saved));
  }));
  router.get('/admin/inquiries',requireAdmin,handle(async(req,res)=>{
    const kind=req.query.kind || 'all';
    if (kind!=='all' && !kinds.includes(kind)) fail(400,'Invalid inquiry filter.');
    const page=Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page<1 || page>1000) fail(400,'Invalid page.');
    const filter=kind==='all' ? {} : {kind};
    const [items,total]=await Promise.all([
      Model.find(filter).sort({createdAt:-1}).skip((page-1)*25).limit(25).select('-requestId -fingerprint -__v').lean(),
      Model.countDocuments(filter)
    ]);
    res.json({items,page,totalPages:Math.ceil(total/25)});
  }));
  router.put('/admin/inquiries/:id',requireAdmin,handle(async(req,res)=>{
    if (!/^[a-f\d]{24}$/i.test(req.params.id) || !['new','reviewed'].includes(req.body?.status)) fail(400,'Invalid inquiry update.');
    const updated=await Model.findByIdAndUpdate(req.params.id,{$set:{status:req.body.status}},{new:true,runValidators:true}).select('-requestId -fingerprint -__v').lean();
    if (!updated) fail(404,'Inquiry not found.');
    res.json(updated);
  }));
  router.post('/admin/inquiries/:id/notify',requireAdmin,handle(async(req,res)=>{
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) fail(400,'Invalid inquiry ID.');
    const inquiry=await Model.findById(req.params.id).lean();
    if (!inquiry) fail(404,'Inquiry not found.');
    if (inquiry.notification?.status==='sent') return res.json({status:'sent'});
    res.json({status:await sendNotification(req.params.id)});
  }));
  return router;
}
module.exports={createRouter};
