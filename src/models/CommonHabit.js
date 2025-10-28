const mongoose = require('mongoose');

/**
 * Common Habit Schema
 * Pre-defined popular habits that users can quickly add
 */
const commonHabitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'wellness', 'fitness', 'learning', 'lifestyle'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  verificationType: {
    type: String,
    enum: ['photo', 'manual', 'timer', 'location'],
    default: 'photo',
  },
  verificationPrompt: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '✓',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  popularityScore: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast lookups
commonHabitSchema.index({ category: 1, isActive: 1 });
commonHabitSchema.index({ popularityScore: -1 });

const CommonHabit = mongoose.model('CommonHabit', commonHabitSchema);

module.exports = CommonHabit;