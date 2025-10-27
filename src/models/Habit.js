const mongoose = require('mongoose');

/**
 * Habit Schema
 * Stores user habits (MVP: one habit per user - "Make my bed")
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
    default: 'Make my bed',
  },
  description: {
    type: String,
  },
  verificationMethod: {
    type: String,
    default: 'photo',
    enum: ['photo', 'manual'],
  },
  reminderTime: {
    type: String,
    default: '09:00', // Format: HH:MM
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

// Compound index for efficient queries
habitSchema.index({ userId: 1, isActive: 1 });

// Update the updatedAt timestamp before saving
habitSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
