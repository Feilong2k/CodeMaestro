const StrategicAdapter = require('../llm/StrategicAdapter');
const TacticalAdapter = require('../llm/TacticalAdapter');
require('../config/ai'); // Ensure config is loaded

class AiService {
  constructor() {
    this.strategicAdapter = new StrategicAdapter();
    this.tacticalAdapter = new TacticalAdapter();
  }

  /**
   * Generate AI response based on mode with automatic escalation.
   * @param {string} prompt
   * @param {string} [mode='tactical'] - 'strategic' or 'tactical'
   * @returns {Promise<string>}
   */
  async generate(prompt, mode = 'tactical') {
    if (mode === 'strategic') {
      return this.strategicAdapter.generate(prompt);
    } 
    
    if (mode === 'tactical') {
      // 1. Try Tactical first
      const response = await this.tacticalAdapter.generate(prompt);

      // 2. Check for Escalation Signal
      if (response && response.trim() === 'ESCALATE_TO_STRATEGIC') {
        console.log('[AiService] Tactical model requested escalation. Switching to Strategic.');
        // 3. Fallback to Strategic
        return this.strategicAdapter.generate(prompt);
      }

      return response;
    } 
    
    throw new Error(`Invalid AI mode: ${mode}`);
  }
}

// Export singleton instance
module.exports = new AiService();
