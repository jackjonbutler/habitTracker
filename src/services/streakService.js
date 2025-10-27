const Streak = require('../models/Streak');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const { getStartOfDay, isConsecutiveDay, isSameDay, getDaysBetween } = require('../utils/dateHelpers');

/**
 * Streak Service
 * Handles streak calculation and management
 */

/**
 * Update streak after a new check-in
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} habitId - Habit ID
 * @param {Date} checkInDate - Date of the check-in
 */
const updateStreak = async (userId, habitId, checkInDate) => {
  try {
    // Get current active streak
    let currentStreak = await Streak.getCurrentStreak(userId, habitId);
    
    // Get user
    const user = await User.findOne({ _id: userId });
    
    if (!currentStreak) {
      // No existing streak - create new one
      currentStreak = await Streak.create({
        userId,
        habitId,
        startDate: getStartOfDay(checkInDate),
        streakLength: 1,
        isActive: true,
      });
      
      // Update user
      user.currentStreak = 1;
      user.lastCheckInDate = checkInDate;
      await user.save();
      
      return currentStreak;
    }

    // Check if this check-in continues the streak
    const lastCheckInDate = user.lastCheckInDate || currentStreak.startDate;
    const checkInDay = getStartOfDay(checkInDate);
    const lastDay = getStartOfDay(lastCheckInDate);

    if (isSameDay(checkInDay, lastDay)) {
      // Same day check-in - don't update streak length
      return currentStreak;
    }

    if (isConsecutiveDay(lastDay, checkInDay)) {
      // Consecutive day - increment streak
      currentStreak.streakLength += 1;
      await currentStreak.save();
      
      // Update user
      user.currentStreak = currentStreak.streakLength;
      user.lastCheckInDate = checkInDate;
      
      // Update longest streak if needed
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
      
      await user.save();
      
      return currentStreak;
    }

    // Streak broken - end current streak and start new one
    currentStreak.isActive = false;
    currentStreak.endDate = lastDay;
    await currentStreak.save();
    
    // Create new streak
    const newStreak = await Streak.create({
      userId,
      habitId,
      startDate: checkInDay,
      streakLength: 1,
      isActive: true,
    });
    
    // Update user
    user.currentStreak = 1;
    user.lastCheckInDate = checkInDate;
    await user.save();
    
    return newStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

/**
 * Calculate current streak from check-in history
 * (Useful for recalculating or verifying streaks)
 */
const calculateStreakFromHistory = async (userId, habitId) => {
  try {
    // Get all check-ins sorted by date descending
    const checkIns = await CheckIn.find({
      userId,
      habitId,
      verificationStatus: { $ne: 'rejected' }, // Only count verified or pending
    })
      .sort({ checkInDate: -1 })
      .lean();

    if (checkIns.length === 0) {
      return 0;
    }

    let streakCount = 1;
    let currentDate = getStartOfDay(checkIns[0].checkInDate);

    // Count consecutive days backwards from most recent check-in
    for (let i = 1; i < checkIns.length; i++) {
      const checkInDate = getStartOfDay(checkIns[i].checkInDate);
      const previousDate = getStartOfDay(checkIns[i - 1].checkInDate);

      // Skip if same day (duplicate check-ins)
      if (isSameDay(checkInDate, previousDate)) {
        continue;
      }

      // Check if consecutive
      if (isConsecutiveDay(checkInDate, previousDate)) {
        streakCount++;
        currentDate = checkInDate;
      } else {
        // Streak broken
        break;
      }
    }

    return streakCount;
  } catch (error) {
    console.error('Error calculating streak from history:', error);
    throw error;
  }
};

/**
 * Check if user's streak is still active (hasn't missed a day)
 */
const isStreakActive = async (userId, habitId) => {
  try {
    const user = await User.findOne({ _id: userId });
    
    if (!user || !user.lastCheckInDate) {
      return false;
    }

    const today = getStartOfDay(new Date());
    const lastCheckIn = getStartOfDay(user.lastCheckInDate);
    const daysSinceLastCheckIn = getDaysBetween(lastCheckIn, today);

    // Streak is active if last check-in was today or yesterday
    return daysSinceLastCheckIn <= 1;
  } catch (error) {
    console.error('Error checking streak status:', error);
    return false;
  }
};

/**
 * Get streak statistics for a user
 */
const getStreakStats = async (userId, habitId) => {
  try {
    const currentStreak = await Streak.getCurrentStreak(userId, habitId);
    const user = await User.findOne({ _id: userId });
    
    // Get all completed streaks
    const completedStreaks = await Streak.find({
      userId,
      habitId,
      isActive: false,
    }).sort({ streakLength: -1 });

    return {
      current: currentStreak ? currentStreak.streakLength : 0,
      longest: user ? user.longestStreak : 0,
      isActive: await isStreakActive(userId, habitId),
      totalStreaks: completedStreaks.length + (currentStreak ? 1 : 0),
      startDate: currentStreak ? currentStreak.startDate : null,
    };
  } catch (error) {
    console.error('Error getting streak stats:', error);
    throw error;
  }
};

module.exports = {
  updateStreak,
  calculateStreakFromHistory,
  isStreakActive,
  getStreakStats,
};
