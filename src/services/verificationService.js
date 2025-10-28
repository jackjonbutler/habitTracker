const openai = require('../config/openai');

/**
 * Verification Service
 * Uses OpenAI GPT-4 Vision API to verify habit completion from images
 */

/**
 * Generic image verification for different habit types
 * @param {string} imageUrl - Public URL of the image to verify
 * @param {string} habitName - Name of the habit to verify against (e.g., "Make my bed", "Go to the gym")
 * @returns {Promise<{isVerified: boolean, note: string}>}
 */
const verifyImage = async (imageUrl, habitName) => {
  try {
    // Get verification prompt based on habit type
    const prompt = getVerificationPrompt(habitName);

    // Call OpenAI API with vision capabilities
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective vision model
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    // Parse OpenAI's response
    const responseText = response.choices[0].message.content.trim();
    const lines = responseText.split('\n');
    const verdict = lines[0].toUpperCase().trim();
    const explanation = lines.slice(1).join(' ').trim() || 'No explanation provided.';

    const isVerified = verdict.includes('YES');

    return {
      isVerified,
      note: explanation,
    };
  } catch (error) {
    console.error('Error verifying image with OpenAI:', error.message);
    
    // Return a neutral result if verification fails
    return {
      isVerified: false,
      note: `Verification service error: ${error.message}`,
    };
  }
};

/**
 * Get appropriate verification prompt based on habit type
 * @param {string} habitName - Name of the habit
 * @returns {string} - Verification prompt for OpenAI
 */
const getVerificationPrompt = (habitName) => {
  const habitLower = habitName.toLowerCase();

  // Bed making habits
  if (habitLower.includes('bed') || habitLower.includes('make my bed')) {
    return `Does this image show a properly made bed? 

A made bed simply means: 
(1) pillows are at the head of the bed, 
(2) a duvet Or comforter OR blanket is spread over the mattress covering most of it, and 
(3) you're not currently sleeping in it. The bed can be wrinkled, messy, or casual - it just needs these basic elements.

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Gym/workout habits
  if (habitLower.includes('gym') || habitLower.includes('workout') || habitLower.includes('exercise')) {
    return `Does this image show evidence of being at a gym or doing a workout?

Valid evidence includes:
- Being in a gym facility (equipment, mirrors, weights visible)
- Actively exercising or working out
- Gym equipment being used
- Workout attire in a gym setting

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Reading habits
  if (habitLower.includes('read') || habitLower.includes('book')) {
    return `Does this image show someone reading or a book being read?

Valid evidence includes:
- A person holding or reading a book
- An open book or e-reader
- Reading materials clearly visible
- Someone engaged in reading activity

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Meditation habits
  if (habitLower.includes('meditat') || habitLower.includes('mindful')) {
    return `Does this image show someone meditating or in a meditation setting?

Valid evidence includes:
- Person in meditation posture (sitting cross-legged, hands in position)
- Meditation space with cushions, mat, or peaceful setting
- Person appearing to be in mindful practice
- Meditation-related setup or environment

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Cooking/meal prep habits
  if (habitLower.includes('cook') || habitLower.includes('meal') || habitLower.includes('food')) {
    return `Does this image show cooking or meal preparation?

Valid evidence includes:
- Food being prepared or cooked
- Cooking in progress (ingredients, utensils, pots/pans)
- Kitchen setting with meal preparation
- A prepared healthy meal

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Running/jogging habits
  if (habitLower.includes('run') || habitLower.includes('jog')) {
    return `Does this image show evidence of running or jogging?

Valid evidence includes:
- Person in running attire on a track, trail, or street
- Running shoes and athletic wear visible
- Running/jogging in progress
- Running-related scenery or equipment

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Water intake habits
  if (habitLower.includes('water') || habitLower.includes('hydrat')) {
    return `Does this image show someone drinking water or a water bottle?

Valid evidence includes:
- Person drinking water
- Water bottle clearly visible
- Glass or container of water
- Evidence of water consumption

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Yoga habits
  if (habitLower.includes('yoga')) {
    return `Does this image show someone doing yoga?

Valid evidence includes:
- Person in a yoga pose
- Yoga mat visible
- Yoga attire and appropriate setting
- Active yoga practice or yoga session

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Study/homework habits
  if (habitLower.includes('study') || habitLower.includes('homework')) {
    return `Does this image show someone studying or doing homework?

Valid evidence includes:
- Open textbooks, notebooks, or study materials
- Person at a desk with learning materials
- Study environment with books, laptop, or notes
- Active studying or homework session

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Cleaning habits
  if (habitLower.includes('clean') || habitLower.includes('tidy')) {
    return `Does this image show a clean or tidy space, or someone cleaning?

Valid evidence includes:
- Organized, clean living space
- Person actively cleaning
- Cleaning supplies being used
- Before/after showing tidiness

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Journaling/writing habits
  if (habitLower.includes('journal') || habitLower.includes('write') || habitLower.includes('diary')) {
    return `Does this image show journaling or writing?

Valid evidence includes:
- Open journal or notebook with writing
- Person writing in a journal
- Pen and paper/journal visible
- Active journaling or writing session

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Music practice habits
  if (habitLower.includes('guitar') || habitLower.includes('piano') || habitLower.includes('music') || habitLower.includes('instrument')) {
    return `Does this image show someone practicing music or playing an instrument?

Valid evidence includes:
- Person holding or playing an instrument
- Musical instrument visible and in use
- Music practice setup (sheet music, instrument, etc.)
- Active music practice session

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;
  }

  // Generic/default prompt for unknown habits
  return `Does this image provide valid evidence for completing the habit: "${habitName}"?

Consider whether the image clearly demonstrates:
- The activity or result described in the habit name
- Genuine evidence (not generic or unrelated content)
- Clear visual proof of the habit being completed

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation of what you see and why it does or doesn't match the habit.`;
};

module.exports = {
  verifyImage,
};