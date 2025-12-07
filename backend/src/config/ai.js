require('dotenv').config();

module.exports = {
  strategic: {
    key: process.env.GEMINI_KEY || 'dummy-gemini-key',
    model: process.env.GEMINI_MODEL || 'gemini-pro'
  },
  tactical: {
    key: process.env.DEEPSEEK_KEY || 'dummy-deepseek-key',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  }
};
