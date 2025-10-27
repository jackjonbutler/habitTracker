const mongoose = require('mongoose');

/**
 * User Schema
 * Stores user profile and statistics
 */
const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  totalPoints: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  totalCheckIns: {
    type: Number,
    default: 0,
  },
  lastCheckInDate: {
    type: Date,
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

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to update level based on points
userSchema.methods.updateLevel = function() {
  this.level = Math.floor(this.totalPoints / 500) + 1;
};

// Instance method to add points
userSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.updateLevel();
};

// Instance method to increment check-in count
userSchema.methods.incrementCheckIns = function() {
  this.totalCheckIns += 1;
};

const User = mongoose.model('User', userSchema);

module.exports = User;