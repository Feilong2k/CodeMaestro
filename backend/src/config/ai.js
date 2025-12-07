require('dotenv').config();

module.exports = {
  strategic: {
    key: process.env.GEMINI_KEY || process.env.GEMINI_API_KEY || 'dummy-gemini-key',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'
  },
  tactical: {
    key: process.env.DEEPSEEK_KEY || process.env.DEEPSEEK_API_KEY || 'dummy-deepseek-key',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  }
};
