const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
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
  source: {
    type: {
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
    },
    default: []
  },
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

module.exports = mongoose.model('News', newsSchema);
