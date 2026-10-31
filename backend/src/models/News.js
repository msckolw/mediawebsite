const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  assistantAssignment: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsAssignment' },
  imageCaption: { type: String, maxlength: 500 },
  imageCredit: { type: String, maxlength: 300 },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: 'https://placehold.co/300x200?text=Nobiased+Media'
  },
  imageMetadata: { width: Number, height: Number, checkedAt: Date },
  source: [{
    source_type: {
      type: String,
      trim: true
    },
    _id: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
newsSchema.index({ createdAt: -1, _id: -1 }); // For sorting by newest first
newsSchema.index({ category: 1, createdAt: -1, _id: -1 }); // For category filtering with sort

module.exports = mongoose.model('News', newsSchema);
