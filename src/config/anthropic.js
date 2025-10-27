const Anthropic = require('@anthropic-ai/sdk');

/**
 * Anthropic Claude API Configuration
 * Used for AI-powered image verification
 */

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not found in environment variables');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('✅ Anthropic Claude API client configured');

module.exports = anthropic;
