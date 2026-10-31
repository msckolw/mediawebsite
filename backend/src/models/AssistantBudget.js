const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: String,
  reservedMicros: { type: Number, default: 0 },
  calls: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('AssistantBudget', schema);
