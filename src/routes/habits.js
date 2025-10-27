const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');
const CheckIn = require('../models/CheckIn');
const authenticateUser = require('../middleware/auth');

/**
 * Habits Routes
 * Handle habit creation and management (supports multiple habits)
 */

/**
 * POST /api/habits
 * Create a new habit for the user (supports multiple habits)
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

    // Validate required fields
    const { habitName, description, reminderTime, category, icon, isCustom, commonHabitId, verificationType, verificationPrompt } = req.body;

    if (!habitName || !description) {
      return res.status(400).json({
        error: 'habitName and description are required',
        status: 400,
      });
    }

    // Create habit with provided values
    const habitData = {
      userId: user._id,
      habitName,
      description,
      reminderTime: reminderTime || '09:00',
      category: category || 'custom',
      icon: icon || '✓',
      isCustom: isCustom || false,
      isActive: true,
      verificationType: verificationType || 'photo',
      verificationPrompt: verificationPrompt || `Does this image show evidence of completing: ${habitName}?`,
    };

    // If created from a common habit, link it
    if (commonHabitId) {
      habitData.commonHabitId = commonHabitId;
    }

    const habit = await Habit.create(habitData);

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
 * Update habit settings
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
    const { habitName, description, reminderTime, isActive, category, icon } = req.body;

    if (habitName) habit.habitName = habitName;
    if (description) habit.description = description;
    if (reminderTime) habit.reminderTime = reminderTime;
    if (category) habit.category = category;
    if (icon) habit.icon = icon;
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