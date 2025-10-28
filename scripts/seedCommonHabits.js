const mongoose = require('mongoose');
const CommonHabit = require('../src/models/CommonHabit');
require('dotenv').config();

/**
 * Seed script to populate common habits
 * Run with: node scripts/seedCommonHabits.js
 */

const commonHabits = [
  {
    name: "Make My Bed",
    category: "lifestyle",
    description: "Make your bed every morning with neatly arranged sheets",
    verificationType: "photo",
    verificationPrompt: "Does this image show a properly made bed with neatly arranged sheets, minimal wrinkles, and pillows arranged neatly?",
    icon: "🛏️",
    difficulty: "easy",
    popularityScore: 100
  },
  {
    name: "Go to the Gym",
    category: "fitness",
    description: "Visit the gym and complete a workout session",
    verificationType: "photo",
    verificationPrompt: "Does this image show evidence of being at a gym or doing a workout? Valid evidence includes gym equipment, mirrors, weights, or active exercise.",
    icon: "💪",
    difficulty: "medium",
    popularityScore: 95
  },
  {
    name: "Read for 30 Minutes",
    category: "learning",
    description: "Read a book or educational material for at least 30 minutes",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone reading a book or engaged with reading material? Valid evidence includes holding a book, an open book, or e-reader.",
    icon: "📚",
    difficulty: "easy",
    popularityScore: 90
  },
  {
    name: "Meditate",
    category: "wellness",
    description: "Practice meditation or mindfulness for at least 10 minutes",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone meditating or in a meditation setting? Valid evidence includes meditation posture, cushions, or peaceful setting.",
    icon: "🧘",
    difficulty: "medium",
    popularityScore: 85
  },
  {
    name: "Drink Water",
    category: "health",
    description: "Drink at least 8 glasses of water throughout the day",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone drinking water or a water bottle? Valid evidence includes drinking water or a clearly visible water container.",
    icon: "💧",
    difficulty: "easy",
    popularityScore: 88
  },
  {
    name: "Cook a Healthy Meal",
    category: "health",
    description: "Prepare a nutritious, home-cooked meal",
    verificationType: "photo",
    verificationPrompt: "Does this image show cooking or meal preparation? Valid evidence includes food being prepared, cooking in progress, or a prepared healthy meal.",
    icon: "🍳",
    difficulty: "medium",
    popularityScore: 75
  },
  {
    name: "Practice Yoga",
    category: "fitness",
    description: "Complete a yoga session",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone doing yoga? Valid evidence includes a person in a yoga pose, yoga mat visible, or active yoga practice.",
    icon: "🧘‍♀️",
    difficulty: "medium",
    popularityScore: 80
  },
  {
    name: "Journal",
    category: "wellness",
    description: "Write in your journal or diary",
    verificationType: "photo",
    verificationPrompt: "Does this image show journaling or writing? Valid evidence includes an open journal with writing, a person writing, or pen and journal visible.",
    icon: "✍️",
    difficulty: "easy",
    popularityScore: 70
  },
  {
    name: "Go for a Run",
    category: "fitness",
    description: "Go running or jogging outdoors or on a treadmill",
    verificationType: "photo",
    verificationPrompt: "Does this image show evidence of running or jogging? Valid evidence includes running attire, running location, running shoes, or active jogging.",
    icon: "🏃",
    difficulty: "medium",
    popularityScore: 82
  },
  {
    name: "Practice an Instrument",
    category: "learning",
    description: "Practice playing a musical instrument",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone practicing music or playing an instrument? Valid evidence includes holding an instrument, instrument visible, or music practice setup.",
    icon: "🎸",
    difficulty: "medium",
    popularityScore: 65
  },
  {
    name: "Take Vitamins",
    category: "health",
    description: "Take your daily vitamins or supplements",
    verificationType: "photo",
    verificationPrompt: "Does this image show vitamins or supplements being taken? Valid evidence includes vitamin bottles, pills, or person taking supplements.",
    icon: "💊",
    difficulty: "easy",
    popularityScore: 78
  },
  {
    name: "Walk 10,000 Steps",
    category: "fitness",
    description: "Walk at least 10,000 steps in a day",
    verificationType: "photo",
    verificationPrompt: "Does this image show a step counter or fitness tracker displaying 10,000 or more steps?",
    icon: "🚶",
    difficulty: "medium",
    popularityScore: 85
  },
  {
    name: "Practice Gratitude",
    category: "wellness",
    description: "Write down three things you're grateful for",
    verificationType: "photo",
    verificationPrompt: "Does this image show gratitude journaling or written gratitude? Valid evidence includes written gratitude list or gratitude journal.",
    icon: "🙏",
    difficulty: "easy",
    popularityScore: 72
  },
  {
    name: "Learn Something New",
    category: "learning",
    description: "Spend time learning a new skill or topic",
    verificationType: "photo",
    verificationPrompt: "Does this image show someone engaged in learning? Valid evidence includes educational materials, online courses, tutorials, or study setup.",
    icon: "🎓",
    difficulty: "medium",
    popularityScore: 68
  },
  {
    name: "Clean/Tidy Space",
    category: "lifestyle",
    description: "Clean and organize your living or work space",
    verificationType: "photo",
    verificationPrompt: "Does this image show a clean or tidy space, or someone cleaning? Valid evidence includes organized space, cleaning supplies, or before/after tidiness.",
    icon: "🧹",
    difficulty: "easy",
    popularityScore: 76
  }
];

const seedCommonHabits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing common habits
    await CommonHabit.deleteMany({});
    console.log('🗑️  Cleared existing common habits');

    // Insert new common habits
    await CommonHabit.insertMany(commonHabits);
    console.log(`✅ Successfully seeded ${commonHabits.length} common habits`);

    // Display seeded habits
    console.log('\n📋 Seeded Habits:');
    commonHabits.forEach((habit, index) => {
      console.log(`${index + 1}. ${habit.icon} ${habit.name} (${habit.category})`);
    });

    console.log('\n🎉 Seed complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding common habits:', error);
    process.exit(1);
  }
};

// Run the seed script
seedCommonHabits();