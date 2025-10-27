const mongoose = require('mongoose');

/**
 * Streak Schema
 * Tracks consecutive day streaks for habits
 */
const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  streakLength: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient queries
streakSchema.index({ userId: 1, habitId: 1, isActive: 1 });

// Update the updatedAt timestamp before saving
streakSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get current active streak
streakSchema.statics.getCurrentStreak = async function(userId, habitId) {
  return await this.findOne({
    userId,
    habitId,
    isActive: true,
  }).sort({ startDate: -1 });
};

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;
