const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  requestId: {type:String, required:true, unique:true},
  fingerprint: {type:String, required:true, select:false},
  kind: {type:String, enum:['investment','experience','suggestion','general'], required:true, index:true},
  name: {type:String, required:true, maxlength:100},
  email: {type:String, required:true, maxlength:254},
  phone: {type:String, maxlength:30},
  company: {type:String, maxlength:150},
  message: {type:String, required:true, maxlength:5000},
  consentAt: {type:Date, required:true},
  status: {type:String, enum:['new','reviewed'], default:'new'},
  notification: {
    status: {type:String, enum:['pending','sending','sent','failed'], default:'pending'},
    attemptedAt: Date,
    sentAt: Date,
    attempts: {type:Number, default:0}
  }
}, {timestamps:true});
schema.index({kind:1, createdAt:-1});
module.exports = mongoose.model('Inquiry',schema);
