/**
 * ModelAdapter - Abstract base class for LLM providers.
 * Implementations should provide chat(), getModelName(), and getTokenCount().
 */
class ModelAdapter {
  constructor() {
    if (new.target === ModelAdapter) {
      throw new Error('ModelAdapter is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Send a chat completion request.
   * @abstract
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<{content: string, usage: Object}>}
   */
  // eslint-disable-next-line class-methods-use-this
  async chat() {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * Get the model name in use.
   * @abstract
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  getModelName() {
    throw new Error('getModelName() must be implemented by subclass');
  }

  /**
   * Get total tokens consumed by this client instance.
   * @abstract
   * @returns {number}
   */
  // eslint-disable-next-line class-methods-use-this
  getTokenCount() {
    throw new Error('getTokenCount() must be implemented by subclass');
  }
}

module.exports = ModelAdapter;
