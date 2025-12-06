const StrategicAdapter = require('../llm/StrategicAdapter');
const TacticalAdapter = require('../llm/TacticalAdapter');
require('../config/ai'); // Ensure config is loaded

class AiService {
  constructor() {
    this.strategicAdapter = new StrategicAdapter();
    this.tacticalAdapter = new TacticalAdapter();
  }

  /**
   * Generate AI response based on mode.
   * @param {string} prompt
   * @param {string} [mode='tactical'] - 'strategic' or 'tactical'
   * @returns {Promise<string>}
   */
  async generate(prompt, mode = 'tactical') {
    if (mode === 'strategic') {
      return this.strategicAdapter.generate(prompt);
    } else if (mode === 'tactical') {
      return this.tacticalAdapter.generate(prompt);
    } else {
      throw new Error(`Invalid AI mode: ${mode}`);
    }
  }
}

// Export singleton instance
module.exports = new AiService();
