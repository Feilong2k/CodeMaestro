const ModelAdapter = require('./ModelAdapter');

/**
 * TacticalAdapter - Client for DeepSeek API.
 * Handles operational tasks and initial routing checks.
 */
class TacticalAdapter extends ModelAdapter {
  constructor() {
    super();
    // In real implementation, this would use DeepseekClient
    this.model = 'deepseek-chat';
  }

  /**
   * Generate text response for a prompt.
   * Includes logic to check for escalation.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    // 1. Simulate "Self-Correction/Escalation" Check
    // If the prompt contains specific trigger words (simulating model uncertainty), escalate.
    const lowerPrompt = prompt.toLowerCase();
    
    // In a real LLM call, we would prepend a system prompt:
    // "You are a tactical assistant. If the request requires high-level architectural planning, 
    // deep reasoning, or is beyond your scope, respond with exactly: ESCALATE_TO_STRATEGIC"
    
    // Simulation: triggers for demo
    if (lowerPrompt.includes('analyze complexity') || lowerPrompt.includes('architectural review')) {
      return 'ESCALATE_TO_STRATEGIC';
    }

    // Default mock response
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
