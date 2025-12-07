const ModelAdapter = require('./ModelAdapter');

/**
 * TacticalAdapter - Client for DeepSeek API.
 * Currently a mock implementation. In the future, this should integrate with or wrap DeepseekClient.
 */
class TacticalAdapter extends ModelAdapter {
  constructor() {
    super();
    // For now, we are just mocking
    this.model = 'deepseek-chat';
  }

  /**
   * Generate text response for a prompt.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    // Mock implementation for now
    return `[Tactical/DeepSeek] Mock response for: "${prompt}"`;
  }

  // Implementing abstract methods from ModelAdapter
  
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

module.exports = TacticalAdapter;
