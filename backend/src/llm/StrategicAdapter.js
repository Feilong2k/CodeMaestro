const ModelAdapter = require('./ModelAdapter');

/**
 * StrategicAdapter - Client for Gemini API.
 */
class StrategicAdapter extends ModelAdapter {
  constructor() {
    super();
    // For now, we are just mocking, so no real API client setup yet
    this.model = 'gemini-pro';
  }

  /**
   * Generate text response for a prompt.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    // Mock implementation for now
    return `[Strategic/Gemini] Mock response for: "${prompt}"`;
  }

  // Implementing abstract methods from ModelAdapter even if unused by generate()
  
  async chat(messages) {
    const lastMessage = messages[messages.length - 1];
    const content = await this.generate(lastMessage.content);
    return {
      content,
      usage: { total_tokens: 0 }
    };
  }

  getModelName() {
    return this.model;
  }

  getTokenCount() {
    return 0;
  }
}

module.exports = StrategicAdapter;
