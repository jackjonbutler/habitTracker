const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Habit = require('../models/Habit');
const authenticateUser = require('../middleware/auth');
const { upload } = require('../middleware/validation');
const { uploadImage, isValidImage } = require('../services/imageService');
const { verifyImage } = require('../services/verificationService');
const { updateStreak } = require('../services/streakService');
const { calculateCheckInPoints, isMilestone } = require('../utils/pointsCalculator');
const { getStartOfDay } = require('../utils/dateHelpers');

/**
 * Check-in Routes
 * Handle daily check-ins with image upload
 */

/**
 * POST /api/checkins
 * Create a new check-in with image upload
 */
router.post('/', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    console.log('🔵 Check-in request started');
    
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    console.log('✅ User found:', user._id);

    // Check if user has an active habit
    const habit = await Habit.findOne({
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(400).json({
        error: 'No active habit found. Please create a habit first.',
        status: 400,
      });
    }

    console.log('✅ Habit found:', habit._id);

    // Validate image upload
    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required',
        status: 400,
      });
    }

    // Validate image buffer
    if (!isValidImage(req.file.buffer)) {
      return res.status(400).json({
        error: 'Invalid image file',
        status: 400,
      });
    }

    // ⭐ CHECK FOR EXISTING CHECK-IN BEFORE PROCEEDING
    console.log('🔍 Checking for existing check-in...');
    const existingCheckIn = await CheckIn.hasCheckedInToday(user._id, habit._id);

    if (existingCheckIn) {
      console.log('⚠️ Existing check-in found:', {
        id: existingCheckIn._id,
        status: existingCheckIn.verificationStatus,
        points: existingCheckIn.pointsEarned
      });
    }

    // Only block if there's already a VERIFIED check-in today
    if (existingCheckIn && existingCheckIn.verificationStatus === 'verified') {
      console.log('❌ BLOCKING: Already checked in today with verified status');
      return res.status(400).json({
        error: 'Already successfully checked in today',
        status: 400,
        message: 'You have already completed your habit today!',
        checkIn: {
          id: existingCheckIn._id,
          checkInDate: existingCheckIn.checkInDate,
          verificationStatus: existingCheckIn.verificationStatus,
          pointsEarned: existingCheckIn.pointsEarned,
        },
      });
    }

    // If there's a rejected or pending check-in, delete it to allow retry
    if (existingCheckIn && (existingCheckIn.verificationStatus === 'rejected' || existingCheckIn.verificationStatus === 'pending')) {
      console.log(`🗑️ Deleting ${existingCheckIn.verificationStatus} check-in to allow retry`);
      await CheckIn.findByIdAndDelete(existingCheckIn._id);
    }

    console.log('📤 Uploading image to R2...');
    // Upload image to R2
    const { imageUrl, imageKey } = await uploadImage(
      req.file.buffer,
      req.file.mimetype,
      user._id.toString()
    );
    console.log('✅ Image uploaded:', imageUrl);

    // Create check-in record with pending status
    const checkInDate = new Date();
    console.log('💾 Creating check-in record...');
    const checkIn = await CheckIn.create({
      userId: user._id,
      habitId: habit._id,
      imageUrl,
      imageKey,
      verificationStatus: 'pending',
      checkInDate: getStartOfDay(checkInDate),
      pointsEarned: 0, // Will be set after verification
    });
    console.log('✅ Check-in created:', checkIn._id);

    // ⭐ WAIT for AI verification before proceeding
    console.log('🤖 Starting AI verification...');
    const verificationResult = await verifyImage(imageUrl, habit.habitName);
    console.log('✅ Verification complete:', verificationResult.isVerified ? 'VERIFIED' : 'REJECTED');
    
    // Update check-in with verification results
    checkIn.verificationStatus = verificationResult.isVerified ? 'verified' : 'rejected';
    checkIn.aiVerificationNote = verificationResult.note;
    
    let pointsEarned = 0;
    let streakData = { current: 0, isMilestone: false };
    let pointsData = { earned: 0, total: user.totalPoints, level: user.level };

    // Only award points and update streak if verification PASSED
    if (verificationResult.isVerified) {
      console.log('🎉 Verification passed! Awarding points...');
      
      // Update streak before awarding points
      await updateStreak(user._id, habit._id, checkInDate);

      // Reload user to get updated streak
      const updatedUser = await User.findById(user._id);
      console.log('📊 User streak:', updatedUser.currentStreak);

      // Calculate points based on current streak
      pointsEarned = calculateCheckInPoints(updatedUser.currentStreak);
      checkIn.pointsEarned = pointsEarned;

      console.log('💰 Points before:', updatedUser.totalPoints);
      // Award points to user
      updatedUser.addPoints(pointsEarned);
      updatedUser.incrementCheckIns();
      await updatedUser.save();
      console.log('💰 Points after:', updatedUser.totalPoints, '(+' + pointsEarned + ')');

      // Check if this is a milestone
      const milestone = isMilestone(updatedUser.currentStreak);

      streakData = {
        current: updatedUser.currentStreak,
        longest: updatedUser.longestStreak,
        isMilestone: milestone,
      };

      pointsData = {
        earned: pointsEarned,
        total: updatedUser.totalPoints,
        level: updatedUser.level,
        totalCheckIns: updatedUser.totalCheckIns,
      };
    } else {
      console.log('❌ Verification failed, no points awarded');
    }

    // Save check-in with final verification status
    await checkIn.save();
    console.log('✅ Check-in saved with status:', checkIn.verificationStatus);

    // Return response with verification results
    console.log('📤 Sending response to client');
    return res.status(201).json({
      message: verificationResult.isVerified 
        ? 'Check-in created successfully' 
        : 'Check-in failed verification',
      success: verificationResult.isVerified,
      checkIn: {
        id: checkIn._id,
        imageUrl: checkIn.imageUrl,
        verificationStatus: checkIn.verificationStatus,
        aiVerificationNote: checkIn.aiVerificationNote,
        checkInDate: checkIn.checkInDate,
        pointsEarned: checkIn.pointsEarned,
        createdAt: checkIn.createdAt,
      },
      streak: verificationResult.isVerified ? streakData : null,
      points: verificationResult.isVerified ? pointsData : null,
    });

  } catch (error) {
    console.error('❌ Error creating check-in:', error);
    res.status(500).json({
      error: 'Failed to create check-in',
      status: 500,
    });
  }
});

/**
 * GET /api/checkins
 * Get paginated list of user's check-ins
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // Get check-ins
    const checkIns = await CheckIn.find({ userId: user._id })
      .sort({ checkInDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('habitId', 'habitName');

    // Get total count for pagination
    const total = await CheckIn.countDocuments({ userId: user._id });

    res.status(200).json({
      checkIns: checkIns.map(checkIn => ({
        id: checkIn._id,
        habitName: checkIn.habitId?.habitName,
        imageUrl: checkIn.imageUrl,
        verificationStatus: checkIn.verificationStatus,
        aiVerificationNote: checkIn.aiVerificationNote,
        checkInDate: checkIn.checkInDate,
        pointsEarned: checkIn.pointsEarned,
        createdAt: checkIn.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + checkIns.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({
      error: 'Failed to fetch check-ins',
      status: 500,
    });
  }
});

/**
 * GET /api/checkins/today
 * Check if user has checked in today
 */
router.get('/today', authenticateUser, async (req, res) => {
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
        hasCheckedIn: false,
        checkIn: null,
      });
    }

    const checkIn = await CheckIn.hasCheckedInToday(user._id, habit._id);

    res.status(200).json({
      hasCheckedIn: !!checkIn,
      checkIn: checkIn ? {
        id: checkIn._id,
        imageUrl: checkIn.imageUrl,
        verificationStatus: checkIn.verificationStatus,
        checkInDate: checkIn.checkInDate,
        pointsEarned: checkIn.pointsEarned,
        createdAt: checkIn.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Error checking today\'s check-in:', error);
    res.status(500).json({
      error: 'Failed to check today\'s status',
      status: 500,
    });
  }
});

/**
 * GET /api/checkins/:id
 * Get specific check-in details
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const checkIn = await CheckIn.findOne({
      _id: req.params.id,
      userId: user._id,
    }).populate('habitId', 'habitName');

    if (!checkIn) {
      return res.status(404).json({
        error: 'Check-in not found',
        status: 404,
      });
    }

    res.status(200).json({
      checkIn: {
        id: checkIn._id,
        habitName: checkIn.habitId?.habitName,
        imageUrl: checkIn.imageUrl,
        verificationStatus: checkIn.verificationStatus,
        aiVerificationNote: checkIn.aiVerificationNote,
        checkInDate: checkIn.checkInDate,
        pointsEarned: checkIn.pointsEarned,
        createdAt: checkIn.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching check-in:', error);
    res.status(500).json({
      error: 'Failed to fetch check-in',
      status: 500,
    });
  }
});

module.exports = router;