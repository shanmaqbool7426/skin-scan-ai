const mongoose = require('mongoose');

const skinIssueSchema = new mongoose.Schema({
  type: { type: String, required: true },
  severity: {
    type: String,
    enum: ['Low', 'Mild', 'Moderate', 'High', 'Severe'],
    default: 'Mild',
  },
  count: { type: Number, default: 1 },
  color: { type: String, default: '#888888' },
}, { _id: false });

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  glowScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  skinType: {
    type: String,
    required: true,
  },
  hydration: { type: Number, min: 0, max: 100, default: 0 },
  clarity: { type: Number, min: 0, max: 100, default: 0 },
  smoothness: { type: Number, min: 0, max: 100, default: 0 },
  glow: { type: Number, min: 0, max: 100, default: 0 },
  clinicalSummary: {
    type: String,
    default: 'Analysis shows overall healthy skin with minor variations.',
  },
  recommendations: {
    type: [String],
    default: [],
  },
  issues: {
    type: [skinIssueSchema],
    default: [],
  },
  imagePath: {
    type: String,
    default: null,
  },
  anglesCount: {
    type: Number,
    default: 1,
    min: 1,
    max: 3,
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      // Format date for display
      ret.date = new Date(ret.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return ret;
    },
  },
});

// Compound index for efficient user scan history queries
scanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Scan', scanSchema);
