const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateUser = require('../middleware/auth');
const { getNextMilestone, getLevelProgress } = require('../utils/pointsCalculator');

/**
 * User Routes
 * Handle user profile and statistics
 */

/**
 * GET /api/users/profile
 * Get current user's profile with all statistics
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    // Calculate additional statistics
    const nextMilestone = getNextMilestone(user.currentStreak);
    const levelProgress = getLevelProgress(user.totalPoints);

    res.status(200).json({
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints,
        level: user.level,
        totalCheckIns: user.totalCheckIns,
        levelProgress: levelProgress,
        lastCheckInDate: user.lastCheckInDate,
        nextMilestone: nextMilestone,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      status: 500,
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile (display name, etc.)
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { displayName } = req.body;

    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    // Update allowed fields
    if (displayName) {
      user.displayName = displayName;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      status: 500,
    });
  }
});

/**
 * GET /api/users/stats
 * Get detailed user statistics
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

    const CheckIn = require('../models/CheckIn');
    
    // Calculate total check-ins
    const totalCheckIns = await CheckIn.countDocuments({ userId: user._id });
    
    // Calculate verified check-ins
    const verifiedCheckIns = await CheckIn.countDocuments({
      userId: user._id,
      verificationStatus: 'verified',
    });

    // Calculate days since joining
    const daysSinceJoining = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json({
      stats: {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints,
        level: user.level,
        totalCheckIns: totalCheckIns,
        verifiedCheckIns: verifiedCheckIns,
        daysSinceJoining: daysSinceJoining,
        lastCheckInDate: user.lastCheckInDate,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      status: 500,
    });
  }
});

module.exports = router;
