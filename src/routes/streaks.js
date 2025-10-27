const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Habit = require('../models/Habit');
const Streak = require('../models/Streak');
const authenticateUser = require('../middleware/auth');
const { getStreakStats } = require('../services/streakService');
const { getNextMilestone } = require('../utils/pointsCalculator');

/**
 * Streaks Routes
 * Handle streak information and statistics
 */

/**
 * GET /api/streaks/current
 * Get current active streak information
 */
router.get('/current', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const habit = await Habit.findOne({
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(200).json({
        streak: null,
        message: 'No active habit found',
      });
    }

    const currentStreak = await Streak.getCurrentStreak(user._id, habit._id);

    if (!currentStreak) {
      return res.status(200).json({
        streak: {
          streakLength: 0,
          startDate: null,
          isActive: false,
        },
        nextMilestone: getNextMilestone(0),
      });
    }

    const nextMilestone = getNextMilestone(currentStreak.streakLength);

    res.status(200).json({
      streak: {
        id: currentStreak._id,
        streakLength: currentStreak.streakLength,
        startDate: currentStreak.startDate,
        isActive: currentStreak.isActive,
        habitName: habit.habitName,
      },
      nextMilestone: nextMilestone,
      user: {
        longestStreak: user.longestStreak,
      },
    });
  } catch (error) {
    console.error('Error fetching current streak:', error);
    res.status(500).json({
      error: 'Failed to fetch current streak',
      status: 500,
    });
  }
});

/**
 * GET /api/streaks/stats
 * Get detailed streak statistics
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const habit = await Habit.findOne({
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(200).json({
        stats: null,
        message: 'No active habit found',
      });
    }

    const stats = await getStreakStats(user._id, habit._id);

    res.status(200).json({
      stats: stats,
    });
  } catch (error) {
    console.error('Error fetching streak stats:', error);
    res.status(500).json({
      error: 'Failed to fetch streak statistics',
      status: 500,
    });
  }
});

/**
 * GET /api/streaks/history
 * Get all past streaks (completed streaks)
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const habit = await Habit.findOne({
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(200).json({
        streaks: [],
        message: 'No active habit found',
      });
    }

    // Get all streaks (both active and completed)
    const streaks = await Streak.find({
      userId: user._id,
      habitId: habit._id,
    })
      .sort({ startDate: -1 })
      .limit(50); // Limit to last 50 streaks

    res.status(200).json({
      streaks: streaks.map(streak => ({
        id: streak._id,
        streakLength: streak.streakLength,
        startDate: streak.startDate,
        endDate: streak.endDate,
        isActive: streak.isActive,
      })),
      total: streaks.length,
    });
  } catch (error) {
    console.error('Error fetching streak history:', error);
    res.status(500).json({
      error: 'Failed to fetch streak history',
      status: 500,
    });
  }
});

/**
 * GET /api/streaks/leaderboard
 * Get top streaks (for future social features)
 */
router.get('/leaderboard', authenticateUser, async (req, res) => {
  try {
    // Get users with highest current streaks
    const topUsers = await User.find()
      .sort({ currentStreak: -1 })
      .limit(10)
      .select('displayName currentStreak longestStreak level');

    res.status(200).json({
      leaderboard: topUsers.map((user, index) => ({
        rank: index + 1,
        displayName: user.displayName,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        level: user.level,
      })),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      status: 500,
    });
  }
});

module.exports = router;
