const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  txnid: { type: String, required: true, unique: true, index: true },
  amount: { type: String, required: true },
  productinfo: { type: String, default: 'NBM Donation' },
  firstname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  method: { type: String, enum: ['upi', 'card', 'all'], default: 'all' },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  payuStatus: { type: String },
  mihpayid: { type: String },
  mode: { type: String },
  bankcode: { type: String },
  error: { type: String },
  errorMessage: { type: String },
  hashVerified: { type: Boolean, default: false },
  rawResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
