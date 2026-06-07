const mongoose = require('mongoose');

const routineStepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  product: { type: String, required: true },
  brand: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: 'flask-outline' },
  color: { type: String, default: '#00D4FF' },
}, { _id: true });

const routineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  timeOfDay: {
    type: String,
    enum: ['Morning', 'Night'],
    required: true,
  },
  steps: {
    type: [routineStepSchema],
    default: [],
  },
  isAIGenerated: {
    type: Boolean,
    default: false,
  },
  lastUpdatedBy: {
    type: String,
    enum: ['default', 'AI', 'user'],
    default: 'default',
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Ensure one routine per user per time of day
routineSchema.index({ userId: 1, timeOfDay: 1 }, { unique: true });

module.exports = mongoose.model('Routine', routineSchema);
