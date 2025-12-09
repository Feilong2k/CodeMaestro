const ModelAdapter = require('./ModelAdapter');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const aiConfig = require('../config/ai');

/**
 * StrategicAdapter - Client for Gemini or OpenAI API.
 * Handles complex architectural decisions and strategic planning.
 */
class StrategicAdapter extends ModelAdapter {
  constructor() {
    super();
    this.isConfigured = false;
    this.provider = null;

    // Try Gemini first
    const geminiKey = aiConfig.strategic.key;
    if (geminiKey && geminiKey !== 'dummy-strategic-key' && !geminiKey.startsWith('sk-')) {
      try {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        this.model = aiConfig.strategic.model || 'gemini-3-pro-preview';
        this.geminiModel = this.genAI.getGenerativeModel({ model: this.model });
        this.isConfigured = true;
        this.provider = 'gemini';
      } catch (error) {
        console.warn('[StrategicAdapter] Failed to initialize Gemini:', error.message);
      }
    }

    // Fallback to OpenAI
    if (!this.isConfigured) {
      const openaiKey = aiConfig.openai?.key || aiConfig.strategic.key;
      if (openaiKey && openaiKey.startsWith('sk-')) {
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
        this.model = aiConfig.openai?.model || 'gpt-4o';
        this.isConfigured = true;
        this.provider = 'openai';
      }
    }

    if (!this.isConfigured) {
      console.warn('[StrategicAdapter] No GEMINI_KEY or OPENAI_KEY configured. Using mock mode.');
    }
  }

  /**
   * Generate text response for a prompt.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    if (!this.isConfigured) {
      return `[Strategic] Mock response (no API key): "${prompt.substring(0, 50)}..."`;
    }

    const systemPrompt = `You are Orion, the strategic AI orchestrator for CodeMaestro - an autonomous development platform.
You handle complex architectural decisions, security implications, scalability planning, and multi-file refactors.
Provide thorough, well-reasoned responses. Consider trade-offs and long-term implications.`;

    try {
      if (this.provider === 'gemini') {
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }] }]
        });
        return result.response.text();
      } else if (this.provider === 'openai') {
        const response = await this.openaiClient.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });
        return response.choices[0].message.content;
      }
    } catch (error) {
      console.error(`[StrategicAdapter] ${this.provider} API Error:`, error.message);
      return `[Strategic Error] ${error.message}`;
    }

    return `[Strategic] Unconfigured provider`;
  }

  async chat(messages) {
    if (!this.isConfigured) {
      const lastMessage = messages[messages.length - 1];
      return {
        content: `[Strategic] Mock response (no API key): "${lastMessage.content.substring(0, 50)}..."`,
        usage: { total_tokens: 0 }
      };
    }

    const systemPrompt = `You are Orion, the strategic AI orchestrator for CodeMaestro.
You handle complex architectural decisions and strategic planning.`;

    try {
      if (this.provider === 'gemini') {
        // Convert messages to Gemini format
        const history = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        const chat = this.geminiModel.startChat({ history: history.slice(0, -1) });
        const lastMessage = history[history.length - 1];
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        
        return {
          content: result.response.text(),
          usage: { total_tokens: 0 }
        };
      } else if (this.provider === 'openai') {
        const chatMessages = messages[0]?.role === 'system' ? messages : [
          { role: 'system', content: systemPrompt },
          ...messages
        ];

        const response = await this.openaiClient.chat.completions.create({
          model: this.model,
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 4000
        });

        return {
          content: response.choices[0].message.content,
          usage: response.usage || { total_tokens: 0 }
        };
      }
    } catch (error) {
      console.error(`[StrategicAdapter] ${this.provider} Chat Error:`, error.message);
      return {
        content: `[Strategic Error] ${error.message}`,
        usage: { total_tokens: 0 }
      };
    }

    return { content: '[Strategic] Unconfigured provider', usage: { total_tokens: 0 } };
  }

  getModelName() {
    return `${this.provider || 'mock'}:${this.model || 'none'}`;
  }

  getTokenCount() {
    return 0;
  }
}

module.exports = StrategicAdapter;
