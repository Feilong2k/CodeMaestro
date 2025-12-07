const StrategicAdapter = require('../llm/StrategicAdapter');
const TacticalAdapter = require('../llm/TacticalAdapter');
const { broadcastToAll } = require('../socket/index');
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

      // 2. Check for Escalation Signals (Extensible Pattern)
      if (response && response.trim().startsWith('ESCALATE_TO_')) {
        const target = response.trim().replace('ESCALATE_TO_', '');
        
        // Log the escalation
        this.logEscalation('tactical', target, 'Model requested escalation based on complexity/scope.');

        // Switch on target
        switch (target) {
          case 'STRATEGIC':
            return this.strategicAdapter.generate(prompt);
          
          case 'COUNCIL':
            // Future implementation
            console.warn('[AiService] COUNCIL escalation not yet implemented. Falling back to Strategic.');
            return this.strategicAdapter.generate(prompt);
            
          default:
            console.warn(`[AiService] Unknown escalation target: ${target}. Falling back to Strategic.`);
            return this.strategicAdapter.generate(prompt);
        }
      }

      return response;
    } 
    
    throw new Error(`Invalid AI mode: ${mode}`);
  }

  /**
   * Log escalation events to console and WebSocket
   */
  logEscalation(from, to, reason) {
    const message = `[Escalation] Switching from ${from.toUpperCase()} to ${to.toUpperCase()}. Reason: ${reason}`;
    console.log(message);
    
    try {
      broadcastToAll('system_notification', {
        type: 'info',
        message: message,
        timestamp: new Date()
      });
    } catch (e) {
      // Ignore socket errors during tests/demo
    }
  }
}

// Export singleton instance
module.exports = new AiService();
