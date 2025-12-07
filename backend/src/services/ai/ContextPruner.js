const aiService = require('../aiService');

/**
 * ContextPruner - Utility to manage conversation context length
 * 
 * Handles pruning messages to fit within token limits while preserving
 * critical system instructions and active task context.
 */
class ContextPruner {
  /**
   * Approximate token count for a message (simplified for MVP)
   * Using 1 token ≈ 4 characters for English text
   * @param {Object} message - Message object with role and content
   * @returns {number} Approximate token count
   */
  _estimateTokens(message) {
    if (!message || !message.content) return 0;
    return Math.ceil(message.content.length / 4);
  }

  /**
   * Calculate total tokens for an array of messages
   * @param {Array} messages - Array of message objects
   * @returns {number} Total approximate tokens
   */
  _calculateTotalTokens(messages) {
    return messages.reduce((total, message) => {
      return total + this._estimateTokens(message);
    }, 0);
  }

  /**
   * Identify critical messages that must be preserved
   * @param {Array} messages - Array of message objects
   * @returns {Array} Array of critical message indices
   */
  _identifyCriticalIndices(messages) {
    const criticalIndices = [];
    
    messages.forEach((message, index) => {
      if (message.role === 'system') {
        criticalIndices.push(index);
      } else if (message.content && message.content.includes('Active subtask')) {
        criticalIndices.push(index);
      }
    });
    
    return criticalIndices;
  }

  /**
   * Prune messages to fit within token limit while preserving critical messages
   * @param {Array} messages - Array of message objects to prune
   * @param {number} tokenLimit - Maximum allowed tokens
   * @returns {Array} Pruned array of messages
   */
  prune(messages, tokenLimit) {
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array');
    }

    if (tokenLimit <= 0) {
      return [];
    }

    // If already under limit, return as-is
    const currentTokens = this._calculateTotalTokens(messages);
    if (currentTokens <= tokenLimit) {
      return messages;
    }

    // Identify critical messages that must be preserved
    const criticalIndices = this._identifyCriticalIndices(messages);
    
    // Separate critical and non-critical messages
    const criticalMessages = [];
    const nonCriticalMessages = [];
    
    messages.forEach((message, index) => {
      if (criticalIndices.includes(index)) {
        criticalMessages.push({
          ...message,
          originalIndex: index
        });
      } else {
        nonCriticalMessages.push({
          ...message,
          originalIndex: index
        });
      }
    });

    // Start with critical messages
    let selectedMessages = [...criticalMessages];
    let selectedTokens = this._calculateTotalTokens(selectedMessages);
    
    // If critical messages alone exceed limit, we must keep them anyway
    // (they're critical, after all)
    if (selectedTokens > tokenLimit) {
      // Sort critical messages by importance (system first, then active subtask)
      selectedMessages.sort((a, b) => {
        if (a.role === 'system' && b.role !== 'system') return -1;
        if (a.role !== 'system' && b.role === 'system') return 1;
        return a.originalIndex - b.originalIndex;
      });
      
      // Keep as many as possible while under limit
      const result = [];
      let current = 0;
      for (const message of selectedMessages) {
        const messageTokens = this._estimateTokens(message);
        if (current + messageTokens <= tokenLimit) {
          result.push({ role: message.role, content: message.content });
          current += messageTokens;
        } else {
          break;
        }
      }
      return result;
    }

    // Add non-critical messages in chronological order until limit is reached
    nonCriticalMessages.sort((a, b) => a.originalIndex - b.originalIndex);
    
    for (const message of nonCriticalMessages) {
      const messageTokens = this._estimateTokens(message);
      if (selectedTokens + messageTokens <= tokenLimit) {
        selectedMessages.push(message);
        selectedTokens += messageTokens;
      } else {
        break;
      }
    }

    // Sort back to original order and remove the originalIndex property
    return selectedMessages
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(({ originalIndex, ...message }) => message);
  }

  /**
   * Check if the rate limit for an agent has been exceeded (Time Constraint)
   * @param {string} agentId - ID of the agent making the request
   * @returns {boolean} True if under limit, False if rate limited
   */
  checkRateLimit(agentId) {
    if (!this.lastRequestTime) {
      this.lastRequestTime = {};
    }
    
    const now = Date.now();
    const lastTime = this.lastRequestTime[agentId] || 0;
    
    // Simple 1 request per second limit
    if (now - lastTime < 1000) {
      return false;
    }
    
    this.lastRequestTime[agentId] = now;
    return true;
  }

  /**
   * Generate a summary of conversation messages using AI
   * @param {Array} messages - Array of message objects to summarize
   * @returns {Promise<string>} Summary text
   */
  async summarize(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return 'No messages to summarize.';
    }

    try {
      // Format messages for the LLM
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call AI service to generate summary
      const summary = await aiService.callLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes conversations. ' +
                    'Provide a concise summary of the key points and decisions made.'
          },
          ...formattedMessages,
          {
            role: 'user',
            content: 'Please provide a concise summary of the above conversation.'
          }
        ]
      });

      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Identify and return critical messages that must be preserved
   * @param {Array} messages - Array of message objects
   * @returns {Array} Critical messages only
   */
  preserveCritical(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }

    return messages.filter(message => {
      if (message.role === 'system') {
        return true;
      }
      if (message.content && message.content.includes('Active subtask')) {
        return true;
      }
      return false;
    });
  }
}

// Create an instance and export its public methods as an object
const instance = new ContextPruner();

module.exports = {
  prune: instance.prune.bind(instance),
  summarize: instance.summarize.bind(instance),
  preserveCritical: instance.preserveCritical.bind(instance),
  checkRateLimit: instance.checkRateLimit.bind(instance),
  VERSION: '1.0.0'
};
