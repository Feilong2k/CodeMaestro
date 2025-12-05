const ModelAdapter = require('./ModelAdapter');

/**
 * DeepseekClient - OpenAI-compatible client for Deepseek API.
 */
class DeepseekClient extends ModelAdapter {
  constructor() {
    super();
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }

    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.baseUrl = 'https://api.deepseek.com';
    this.timeout = 30000; // ms
    this.maxRetries = 3;
    this.retryBaseDelay = 1000; // ms
    this._totalTokens = 0;
  }

  /**
   * Send chat messages to Deepseek.
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<{content: string, usage: Object}>}
   */
  async chat(messages, options = {}) {
    const payload = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000
    };

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this._requestWithTimeout(payload);
        return result;
      } catch (error) {
        lastError = error;

        // authentication errors should not retry
        if (error.message === 'Authentication failed') {
          throw error;
        }

        // timeout should only retry if attempts remain
        if (error.message === 'Request timeout' && attempt === this.maxRetries) {
          throw error;
        }

        // handle rate limit with backoff
        if (error.statusCode === 429 && attempt < this.maxRetries) {
          const delay = this.retryBaseDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
          continue;
        }

        // other errors: rethrow
        if (attempt === this.maxRetries || error.statusCode !== 429) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async _requestWithTimeout(body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchPromise = fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const response = await Promise.race([
        fetchPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ]);

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 429) {
          const err = new Error('Rate limit exceeded');
          err.statusCode = 429;
          throw err;
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const usage = data.usage || {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      };

      this._totalTokens += usage.total_tokens || 0;

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError' || error.message === 'Request timeout') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  getModelName() {
    return this.model;
  }

  getTokenCount() {
    return this._totalTokens;
  }

  // Convenience alias used in tests
  getTotalTokens() {
    return this._totalTokens;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DeepseekClient;
