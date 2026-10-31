const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  fingerprint: String,
  createdBy: { type: String, required: true },
  topic: { type: String, required: true },
  context: String,
  category: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  // Immutable snapshots keep later source-library edits out of an active assignment.
  outlets: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seedUrls: { type: [String], default: [] },
  imageUrl: { type: String, required: true, select: false },
  imageMetadata: mongoose.Schema.Types.Mixed,
  imageCaption: String,
  imageCredit: String,
  status: { type: String, enum: ['queued', 'running', 'ready', 'publishing', 'failed', 'rejected', 'published'], default: 'queued' },
  stage: { type: String, default: 'research' },
  research: mongoose.Schema.Types.Mixed,
  draft: mongoose.Schema.Types.Mixed,
  versions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  reviews: { type: [mongoose.Schema.Types.Mixed], default: [] },
  usage: { type: [mongoose.Schema.Types.Mixed], default: [] },
  warnings: { type: [String], default: [] },
  error: String,
  attempts: { type: Number, default: 0 },
  revision: { type: Number, default: 0 },
  leaseToken: { type: String, select: false },
  leaseUntil: Date,
  publishedArticle: { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
  publishedBy: String,
  publishedAt: Date,
  reviewedBy: String,
  reviewNote: String,
  humanEdited: { type: Boolean, default: false }
}, { timestamps: true, minimize: false });
schema.index({ status: 1, leaseUntil: 1, createdAt: 1 });
module.exports = mongoose.model('NewsAssignment', schema);
