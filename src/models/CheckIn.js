const mongoose = require('mongoose');

/**
 * CheckIn Schema
 * Stores daily check-in records with image verification
 */
const checkInSchema = new mongoose.Schema({
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
  imageUrl: {
    type: String,
    required: true,
  },
  imageKey: {
    type: String,
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  aiVerificationNote: {
    type: String,
  },
  checkInDate: {
    type: Date,
    required: true,
    index: true,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for efficient queries
checkInSchema.index({ userId: 1, checkInDate: -1 });
checkInSchema.index({ userId: 1, habitId: 1, checkInDate: 1 });

// Static method to check if user has checked in today
checkInSchema.statics.hasCheckedInToday = async function(userId, habitId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const checkIn = await this.findOne({
    userId,
    habitId,
    checkInDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  return checkIn;
};

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn;
