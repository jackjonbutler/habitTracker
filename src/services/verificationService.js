const openai = require('../config/openai');

/**
 * Verification Service
 * Uses OpenAI GPT-4 Vision API to verify habit completion from images
 * Now uses the verification prompt stored on each habit for consistency
 */

/**
 * Verify image using the habit's stored verification prompt
 * @param {string} imageUrl - Public URL of the image to verify
 * @param {string} verificationPrompt - The verification prompt stored on the habit
 * @returns {Promise<{isVerified: boolean, note: string}>}
 */
const verifyImage = async (imageUrl, verificationPrompt) => {
  try {
    // Format the prompt for consistent AI responses
    const fullPrompt = `${verificationPrompt}

Respond with ONLY "YES" or "NO" on the first line, followed by a brief 1-2 sentence explanation.`;

    console.log('🔍 Using verification prompt:', verificationPrompt);

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
              text: fullPrompt,
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

module.exports = {
  verifyImage,
};