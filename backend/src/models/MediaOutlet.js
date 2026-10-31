const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 150 },
  domains: { type: [String], required: true },
  category: { type: String, required: true },
  region: { type: String, enum: ['Indian', 'International'], required: true },
  country: String,
  orientation: String,
  notes: String,
  access: { type: String, enum: ['public', 'subscription', 'unknown'], default: 'unknown' },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });
schema.index({ name: 1 }, { unique: true });
module.exports = mongoose.model('MediaOutlet', schema);
