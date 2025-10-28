const mongoose = require('mongoose');

/**
 * Habit Schema
 * Stores user habits with verification details
 * Supports multiple habits per user
 */
const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  habitName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'wellness', 'fitness', 'learning', 'lifestyle', 'custom'],
    default: 'custom',
  },
  icon: {
    type: String,
    default: '✓',
  },
  // ⭐ Verification settings (stored per habit for consistency)
  verificationType: {
    type: String,
    enum: ['photo', 'manual', 'timer', 'location'],
    default: 'photo',
  },
  verificationPrompt: {
    type: String,
    required: true,
  },
  // Metadata
  isCustom: {
    type: Boolean,
    default: false,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  commonHabitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommonHabit',
  },
  reminderTime: {
    type: String,
    default: '09:00',
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

// Compound index for multiple active habits per user
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, commonHabitId: 1 });

// Update the updatedAt timestamp before saving
habitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;