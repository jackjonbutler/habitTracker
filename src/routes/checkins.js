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
 * Handle daily check-ins with image upload (supports multiple habits)
 */

/**
 * POST /api/checkins
 * Create a new check-in with image upload
 * Requires habitId in request body to identify which habit to check in
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

    // ⭐ Get habitId from request body
    const { habitId } = req.body;

    if (!habitId) {
      return res.status(400).json({
        error: 'habitId is required',
        status: 400,
        message: 'Please specify which habit you want to check in for',
      });
    }

    console.log('🎯 Checking in for habit:', habitId);

    // Get the specific habit
    const habit = await Habit.findOne({
      _id: habitId,
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
        status: 404,
        message: 'This habit does not exist or is not active',
      });
    }

    console.log('✅ Habit found:', habit.habitName);

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

    // ⭐ CHECK FOR EXISTING CHECK-IN FOR THIS SPECIFIC HABIT
    console.log('🔍 Checking for existing check-in for this habit today...');
    const existingCheckIn = await CheckIn.hasCheckedInToday(user._id, habit._id);

    if (existingCheckIn) {
      console.log('⚠️ Existing check-in found:', {
        id: existingCheckIn._id,
        habit: habit.habitName,
        status: existingCheckIn.verificationStatus,
        points: existingCheckIn.pointsEarned
      });
    }

    // Only block if there's already a VERIFIED check-in today for THIS habit
    if (existingCheckIn && existingCheckIn.verificationStatus === 'verified') {
      console.log('❌ BLOCKING: Already checked in today for this habit');
      return res.status(400).json({
        error: 'Already successfully checked in today',
        status: 400,
        message: `You have already completed "${habit.habitName}" today!`,
        checkIn: {
          id: existingCheckIn._id,
          habitId: habit._id,
          habitName: habit.habitName,
          checkInDate: existingCheckIn.checkInDate,
          verificationStatus: existingCheckIn.verificationStatus,
          pointsEarned: existingCheckIn.pointsEarned,
        },
      });
    }

    // If there's a rejected or pending check-in for this habit, delete it to allow retry
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

    // ⭐ Use habit's custom verification prompt
    console.log('🤖 Starting AI verification with prompt:', habit.verificationPrompt);
    const verificationResult = await verifyImage(
      imageUrl, 
      habit.verificationPrompt || habit.habitName
    );
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
      
      // Update streak before awarding points (for this specific habit)
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
        ? `Check-in for "${habit.habitName}" successful!` 
        : `Check-in for "${habit.habitName}" failed verification`,
      success: verificationResult.isVerified,
      checkIn: {
        id: checkIn._id,
        habitId: habit._id,
        habitName: habit.habitName,
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
 * Optional: Filter by habitId
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

    // Optional: Filter by habitId
    const filter = { userId: user._id };
    if (req.query.habitId) {
      filter.habitId = req.query.habitId;
    }

    // Get check-ins
    const checkIns = await CheckIn.find(filter)
      .sort({ checkInDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('habitId', 'habitName icon category');

    // Get total count for pagination
    const total = await CheckIn.countDocuments(filter);

    res.status(200).json({
      checkIns: checkIns.map(checkIn => ({
        id: checkIn._id,
        habitId: checkIn.habitId?._id,
        habitName: checkIn.habitId?.habitName,
        habitIcon: checkIn.habitId?.icon,
        habitCategory: checkIn.habitId?.category,
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
 * Check if user has checked in today for a specific habit
 * Requires habitId query parameter
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

    const { habitId } = req.query;

    if (!habitId) {
      return res.status(400).json({
        error: 'habitId query parameter is required',
        status: 400,
      });
    }

    const habit = await Habit.findOne({
      _id: habitId,
      userId: user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
        status: 404,
      });
    }

    const checkIn = await CheckIn.hasCheckedInToday(user._id, habit._id);

    res.status(200).json({
      hasCheckedIn: !!checkIn,
      habitId: habit._id,
      habitName: habit.habitName,
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
    }).populate('habitId', 'habitName icon category');

    if (!checkIn) {
      return res.status(404).json({
        error: 'Check-in not found',
        status: 404,
      });
    }

    res.status(200).json({
      checkIn: {
        id: checkIn._id,
        habitId: checkIn.habitId?._id,
        habitName: checkIn.habitId?.habitName,
        habitIcon: checkIn.habitId?.icon,
        habitCategory: checkIn.habitId?.category,
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