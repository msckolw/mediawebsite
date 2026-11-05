const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: String,
  count: {type:Number, default:0},
  expiresAt: {type:Date, required:true, expires:0}
});
module.exports = mongoose.model('InquiryLimit',schema);
