const fs = require('fs');
const path = require('path');

/**
 * Base Agent class that all specialized agents should inherit from.
 * Provides retry logic, prompt loading, and execution framework.
 */
class BaseAgent {
  constructor(name = 'BaseAgent') {
    this.name = name;
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }

  /**
   * Main execution method that should be overridden by subclasses
   * @param {Object} context - The execution context
   * @returns {Promise<Object>} Result with actions array
   */
  async execute(context) {
    // Default implementation returns empty actions
    // Subclasses should override this method
    return {
      actions: [],
      context,
      agent: this.name
    };
  }

  /**
   * Execute with retry logic for API failures
   * @param {Object} context - The execution context
   * @param {Function} executeFn - Optional custom execute function
   * @returns {Promise<Object>} Result from execute
   */
  async executeWithRetry(context, executeFn = null) {
    const fn = executeFn || this.execute.bind(this);
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn(context);
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Load prompt from .prompts/ directory
   * @param {string} promptName - Name of the prompt file (without extension)
   * @returns {string} The prompt content
   */
  loadPrompt(promptName) {
    const promptPath = path.join(process.cwd(), '..', '.prompts', `${promptName}.md`);
    try {
      return fs.readFileSync(promptPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load prompt ${promptName}: ${error.message}`);
    }
  }

  /**
   * Utility sleep function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BaseAgent;
