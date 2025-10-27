const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticateUser = require('../middleware/auth');

/**
 * Authentication Routes
 * Handle user authentication and profile creation
 */

/**
 * POST /api/auth/verify
 * Verify Firebase token and create/update user in database
 */
router.post('/verify', authenticateUser, async (req, res) => {
  try {
    const { uid, email, displayName } = req.user;

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email: email,
        displayName: displayName || email.split('@')[0],
      });

      console.log(`New user created: ${uid}`);
    } else {
      // Update existing user's display name if it changed
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
        await user.save();
      }
    }

    res.status(200).json({
      message: 'Authentication successful',
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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      error: 'Failed to verify authentication',
      status: 500,
    });
  }
});

/**
 * GET /api/auth/status
 * Check if user is authenticated (for testing)
 */
router.get('/status', authenticateUser, async (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: req.user,
  });
});

module.exports = router;