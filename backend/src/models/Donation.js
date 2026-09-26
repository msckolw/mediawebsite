const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true, unique: true },
  amount: { type: String, required: true },
  firstname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  method: { type: String, enum: ['upi', 'card', 'netbanking', 'all'], required: true },
  platform: { type: String, enum: ['web', 'app'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  activePayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
