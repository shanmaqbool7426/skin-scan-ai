const mongoose = require('mongoose');

const routineLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true,
  },
  completedSteps: {
    type: [mongoose.Schema.Types.ObjectId], // Step _ids from Routine.steps
    default: [],
  },
  totalSteps: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: '',
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

// One log per user per routine per day
routineLogSchema.index({ userId: 1, routineId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('RoutineLog', routineLogSchema);
