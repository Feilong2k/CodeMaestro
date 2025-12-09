require('dotenv').config();

module.exports = {
  strategic: {
    // Supports GEMINI_KEY, GEMINI_API_KEY, or OPENAI_API_KEY (if we switch provider)
    key: process.env.GEMINI_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-strategic-key',
    model: process.env.GEMINI_MODEL || 'gemini-3-pro-preview'
  },
  tactical: {
    // Supports DEEPSEEK_KEY or DEEPSEEK_API_KEY
    key: process.env.DEEPSEEK_KEY || process.env.DEEPSEEK_API_KEY || 'dummy-tactical-key',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  // Optional: dedicated openai config if we use 3 models later
  openai: {
    key: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  }
};
