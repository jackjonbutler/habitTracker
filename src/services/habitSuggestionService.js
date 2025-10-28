const openai = require('../config/openai');

/**
 * Habit Suggestion Service
 * Uses AI to suggest verification methods for custom habits
 */

/**
 * Generate verification suggestion for custom habit
 * @param {string} habitName - Name of the habit
 * @param {string} description - Description of the habit
 * @returns {Promise<Object>} - Verification suggestion
 */
const suggestVerification = async (habitName, description) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are a habit tracking expert. Given a habit name and description, suggest the best way to verify completion.

Verification options:
1. PHOTO: User takes a photo as proof (best for visual activities)
2. MANUAL: User manually confirms completion (best for private/mental activities)
3. TIMER: User starts/completes a timer (best for time-based activities)
4. LOCATION: GPS verification (best for location-specific activities)

Respond in valid JSON format:
{
  "verificationType": "photo|manual|timer|location",
  "verificationPrompt": "Detailed prompt for AI image verification (if photo) or clear instructions (if other type)",
  "reasoning": "1-2 sentences explaining why this method is best for this specific habit",
  "alternatives": [
    {
      "type": "manual|timer|location",
      "description": "Brief description of alternative method"
    }
  ]
}

IMPORTANT: 
- For photo verification, write the verificationPrompt as a question starting with "Does this image show..."
- Make prompts specific to the habit
- Keep reasoning concise and helpful`
        },
        {
          role: 'user',
          content: `Habit Name: ${habitName}\nDescription: ${description}\n\nSuggest the best verification method for this habit.`
        }
      ],
    });

    const content = response.choices[0].message.content.trim();
    
    // Try to parse JSON, handling potential markdown code blocks
    let jsonContent = content;
    if (content.startsWith('```')) {
      // Extract JSON from markdown code block
      const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (match) {
        jsonContent = match[1];
      }
    }
    
    const result = JSON.parse(jsonContent);
    
    // Validate result structure
    if (!result.verificationType || !result.verificationPrompt) {
      throw new Error('Invalid AI response structure');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error generating verification suggestion:', error.message);
    
    // Fallback to intelligent default based on habit name
    const fallback = generateFallbackSuggestion(habitName, description);
    return fallback;
  }
};

/**
 * Generate fallback verification suggestion
 * @param {string} habitName 
 * @param {string} description 
 * @returns {Object}
 */
const generateFallbackSuggestion = (habitName, description) => {
  const nameLower = habitName.toLowerCase();
  
  // Check for common patterns
  if (nameLower.includes('read') || nameLower.includes('book')) {
    return {
      verificationType: 'photo',
      verificationPrompt: `Does this image show someone reading a book or engaged with reading material?`,
      reasoning: 'Photo verification works well for reading habits as books are easily photographed.',
      alternatives: [
        { type: 'manual', description: 'Manually confirm you completed your reading session' }
      ]
    };
  }
  
  if (nameLower.includes('meditat') || nameLower.includes('mindful')) {
    return {
      verificationType: 'timer',
      verificationPrompt: 'Complete a meditation session using the timer',
      reasoning: 'Meditation is best tracked with a timer as it\'s time-based and private.',
      alternatives: [
        { type: 'manual', description: 'Manually confirm completion' }
      ]
    };
  }
  
  if (nameLower.includes('gym') || nameLower.includes('workout') || nameLower.includes('exercise')) {
    return {
      verificationType: 'photo',
      verificationPrompt: `Does this image show evidence of being at a gym or doing a workout?`,
      reasoning: 'Photo proof from the gym provides clear verification of workout completion.',
      alternatives: [
        { type: 'location', description: 'Use GPS to verify you\'re at the gym' }
      ]
    };
  }
  
  // Generic fallback
  return {
    verificationType: 'photo',
    verificationPrompt: `Does this image show evidence of completing: ${habitName}? The image should demonstrate that the activity described as "${description}" has been completed.`,
    reasoning: 'Photo verification provides visual proof of habit completion and works for most activities.',
    alternatives: [
      { type: 'manual', description: 'Manually confirm you completed this habit' },
      { type: 'timer', description: 'Use a timer if this is a time-based activity' }
    ]
  };
};

module.exports = {
  suggestVerification,
};