const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');
const authenticateUser = require('../middleware/auth');

/**
 * Habits Routes
 * Handle habit creation and management
 */

/**
 * POST /api/habits
 * Create a new habit for the user (MVP: limit to one habit)
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

    // Check if user already has an active habit
    const existingHabit = await Habit.findOne({
      userId: user._id,
      isActive: true,
    });

    if (existingHabit) {
      return res.status(400).json({
        error: 'User already has an active habit. MVP limits one habit per user.',
        status: 400,
        existingHabit: {
          id: existingHabit._id,
          habitName: existingHabit.habitName,
        },
      });
    }

    // Create habit with defaults or provided values
    const { habitName, description, reminderTime } = req.body;

    const habit = await Habit.create({
      userId: user._id,
      habitName: habitName || 'Make my bed',
      description: description || 'Daily bed-making habit',
      reminderTime: reminderTime || '09:00',
      verificationMethod: 'photo',
      isActive: true,
    });

    res.status(201).json({
      message: 'Habit created successfully',
      habit: {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        reminderTime: habit.reminderTime,
        verificationMethod: habit.verificationMethod,
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
    });

    res.status(200).json({
      habits: habits.map(habit => ({
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
        reminderTime: habit.reminderTime,
        verificationMethod: habit.verificationMethod,
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
        reminderTime: habit.reminderTime,
        verificationMethod: habit.verificationMethod,
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
    const { habitName, description, reminderTime, isActive } = req.body;

    if (habitName) habit.habitName = habitName;
    if (description) habit.description = description;
    if (reminderTime) habit.reminderTime = reminderTime;
    if (typeof isActive === 'boolean') habit.isActive = isActive;

    await habit.save();

    res.status(200).json({
      message: 'Habit updated successfully',
      habit: {
        id: habit._id,
        habitName: habit.habitName,
        description: habit.description,
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
