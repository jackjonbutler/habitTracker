const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');
const CommonHabit = require('../models/CommonHabit');
const authenticateUser = require('../middleware/auth');
const { suggestVerification } = require('../services/habitSuggestionService');

/**
 * Habits Routes
 * Handle habit creation and management (supports multiple habits)
 */

/**
 * POST /api/habits/suggest-verification
 * Get AI suggestion for verification method and prompt
 * Used when creating custom habits
 */
router.post('/suggest-verification', authenticateUser, async (req, res) => {
  try {
    const { habitName, description } = req.body;

    if (!habitName || !description) {
      return res.status(400).json({
        error: 'habitName and description are required',
        status: 400,
      });
    }

    console.log('🤖 Generating verification suggestion for:', habitName);

    // Get AI suggestion
    const suggestion = await suggestVerification(habitName, description);

    console.log('✅ Verification suggestion generated:', suggestion.verificationType);

    res.status(200).json({
      suggestion: {
        verificationType: suggestion.verificationType,
        verificationPrompt: suggestion.verificationPrompt,
        reasoning: suggestion.reasoning,
        alternatives: suggestion.alternatives || [],
      },
    });
  } catch (error) {
    console.error('Error generating verification suggestion:', error);
    res.status(500).json({
      error: 'Failed to generate verification suggestion',
      status: 500,
    });
  }
});

/**
 * GET /api/habits/common
 * Get list of common/popular pre-defined habits
 */
router.get('/common', authenticateUser, async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const commonHabits = await CommonHabit.find(query)
      .sort({ popularityScore: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      habits: commonHabits.map(habit => ({
        id: habit._id,
        name: habit.name,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        difficulty: habit.difficulty,
        verificationType: habit.verificationType,
        verificationPrompt: habit.verificationPrompt,
      })),
    });
  } catch (error) {
    console.error('Error fetching common habits:', error);
    res.status(500).json({
      error: 'Failed to fetch common habits',
      status: 500,
    });
  }
});

/**
 * POST /api/habits
 * Create a new habit for the user (supports multiple habits)
 * 
 * Flow A: From Common Habit
 * - Pass habitName (matches common habit by name) + reminderTime
 * - Copies all details from common habit
 * 
 * Flow B: Custom Habit
 * - Pass habitName, description, verificationPrompt
 * - User has already confirmed AI suggestion
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const { 
      habitName, 
      description, 
      reminderTime, 
      category, 
      icon, 
      verificationType, 
      verificationPrompt 
    } = req.body;

    if (!habitName) {
      return res.status(400).json({
        error: 'habitName is required',
        status: 400,
      });
    }

    let habitData;

    // Try to find a common habit with this name
    const commonHabit = await CommonHabit.findOne({ 
      name: habitName,
      isActive: true 
    });

    // Flow A: Creating from a common habit (matched by name)
    if (commonHabit) {
      console.log('📋 Creating habit from common habit:', habitName);

      habitData = {
        userId: user._id,
        habitName: commonHabit.name,
        description: commonHabit.description,
        category: commonHabit.category,
        icon: commonHabit.icon,
        reminderTime: reminderTime || '09:00',
        verificationType: commonHabit.verificationType,
        verificationPrompt: commonHabit.verificationPrompt, // ⭐ Use common habit's prompt
        isCustom: false,
        commonHabitId: commonHabit._id,
        isActive: true,
      };

      console.log('✅ Using pre-defined verification prompt from common habit');
    } 
    // Flow B: Creating custom habit with AI-suggested (and user-confirmed) prompt
    else {
      console.log('✨ Creating custom habit:', habitName);

      if (!description || !verificationPrompt) {
        return res.status(400).json({
          error: 'description and verificationPrompt are required for custom habits',
          status: 400,
          message: 'Please provide all required fields. Use /suggest-verification to get AI suggestions first.',
        });
      }

      habitData = {
        userId: user._id,
        habitName,
        description,
        reminderTime: reminderTime || '09:00',
        category: category || 'custom',
        icon: icon || '✓',
        verificationType: verificationType || 'photo',
        verificationPrompt, // ⭐ User-confirmed AI-suggested prompt
        isCustom: true,
        aiGenerated: true, // Flag that this was AI-suggested
        isActive: true,
      };

      console.log('✅ Using AI-suggested verification prompt (user confirmed)');
    }

    const habit = await Habit.create(habitData);

    console.log('🎉 Habit created:', habit._id);
    console.log('📝 Verification prompt:', habit.verificationPrompt);

    res.status(201).json({
      message: 'Habit created successfully',
      habit: {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        reminderTime: habit.reminderTime,
        verificationType: habit.verificationType,
        verificationPrompt: habit.verificationPrompt,
        isCustom: habit.isCustom,
        isActive: habit.isActive,
        createdAt: habit.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({
      error: 'Failed to create habit',
      status: 500,
    });
  }
});

/**
 * GET /api/habits
 * Get user's active habit(s)
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

    const habits = await Habit.find({
      userId: user._id,
      isActive: true,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      habits: habits.map(habit => ({
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        reminderTime: habit.reminderTime,
        verificationType: habit.verificationType,
        verificationPrompt: habit.verificationPrompt,
        isCustom: habit.isCustom,
        isActive: habit.isActive,
        createdAt: habit.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({
      error: 'Failed to fetch habits',
      status: 500,
    });
  }
});

/**
 * GET /api/habits/dashboard
 * Get all user habits with today's completion status
 * Perfect for app state management
 */
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    // Get all active habits
    const habits = await Habit.find({
      userId: user._id,
      isActive: true,
    }).sort({ createdAt: 1 }); // Oldest first

    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get all check-ins for today for this user
    const todaysCheckIns = await CheckIn.find({
      userId: user._id,
      checkInDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Create a map of habitId -> check-in status
    const checkInMap = {};
    todaysCheckIns.forEach(checkIn => {
      checkInMap[checkIn.habitId.toString()] = {
        isCompleted: checkIn.verificationStatus === 'verified',
        checkInId: checkIn._id,
        verificationStatus: checkIn.verificationStatus,
        pointsEarned: checkIn.pointsEarned,
        imageUrl: checkIn.imageUrl,
        createdAt: checkIn.createdAt,
      };
    });

    // Build response with completion status for each habit
    const habitsWithStatus = habits.map(habit => {
      const checkInStatus = checkInMap[habit._id.toString()];
      
      return {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        reminderTime: habit.reminderTime,
        isCustom: habit.isCustom,
        verificationType: habit.verificationType,
        
        // Today's status
        isCompletedToday: checkInStatus?.isCompleted || false,
        checkIn: checkInStatus || null,
      };
    });

    res.status(200).json({
      habits: habitsWithStatus,
      summary: {
        total: habits.length,
        completedToday: habitsWithStatus.filter(h => h.isCompletedToday).length,
        remainingToday: habitsWithStatus.filter(h => !h.isCompletedToday).length,
      },
    });
  } catch (error) {
    console.error('Error fetching habits dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch habits dashboard',
      status: 500,
    });
  }
});

/**
 * GET /api/habits/:id
 * Get specific habit details
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

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: user._id,
    });

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
        status: 404,
      });
    }

    res.status(200).json({
      habit: {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        reminderTime: habit.reminderTime,
        verificationType: habit.verificationType,
        verificationPrompt: habit.verificationPrompt,
        isCustom: habit.isCustom,
        isActive: habit.isActive,
        createdAt: habit.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching habit:', error);
    res.status(500).json({
      error: 'Failed to fetch habit',
      status: 500,
    });
  }
});

/**
 * PUT /api/habits/:id
 * Update habit settings (including verification prompt)
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: user._id,
    });

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
        status: 404,
      });
    }

    // Update allowed fields
    const { 
      habitName, 
      description, 
      reminderTime, 
      isActive, 
      category, 
      icon,
      verificationPrompt // ⭐ Allow updating the prompt
    } = req.body;

    if (habitName) habit.habitName = habitName;
    if (description) habit.description = description;
    if (reminderTime) habit.reminderTime = reminderTime;
    if (category) habit.category = category;
    if (icon) habit.icon = icon;
    if (verificationPrompt) habit.verificationPrompt = verificationPrompt;
    if (typeof isActive === 'boolean') habit.isActive = isActive;

    await habit.save();

    res.status(200).json({
      message: 'Habit updated successfully',
      habit: {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        category: habit.category,
        icon: habit.icon,
        reminderTime: habit.reminderTime,
        verificationPrompt: habit.verificationPrompt,
        isActive: habit.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({
      error: 'Failed to update habit',
      status: 500,
    });
  }
});

/**
 * DELETE /api/habits/:id
 * Delete/deactivate a habit
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404,
      });
    }

    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: user._id,
    });

    if (!habit) {
      return res.status(404).json({
        error: 'Habit not found',
        status: 404,
      });
    }

    // Soft delete - just mark as inactive
    habit.isActive = false;
    await habit.save();

    res.status(200).json({
      message: 'Habit deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({
      error: 'Failed to delete habit',
      status: 500,
    });
  }
});

module.exports = router;