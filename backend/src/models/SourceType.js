
const mongoose = require('mongoose');

const SourceTypeSchema = new mongoose.Schema({
  source_type: {
    type: String,
    required: [true, 'Source is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SourceType', SourceTypeSchema);
