const ModelAdapter = require('./ModelAdapter');
const OpenAI = require('openai');
const aiConfig = require('../config/ai');
const agentRegistryService = require('../services/agentRegistryService');

/**
 * TacticalAdapter - Client for DeepSeek API (OpenAI-compatible).
 * Handles operational tasks and initial routing checks.
 */
class TacticalAdapter extends ModelAdapter {
  constructor() {
    super();
    this.model = aiConfig.tactical.model || 'deepseek-chat';
    
    // DeepSeek uses OpenAI-compatible API
    const apiKey = aiConfig.tactical.key;
    
    if (apiKey && apiKey !== 'dummy-tactical-key') {
      this.client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com'
      });
      this.isConfigured = true;
    } else {
      console.warn('[TacticalAdapter] No DEEPSEEK_KEY configured. Using mock mode.');
      this.isConfigured = false;
    }
  }

  /**
   * Build system prompt dynamically from database registry
   */
  async buildSystemPrompt() {
    const registry = await agentRegistryService.getCachedRegistry();
    
    const toolList = Object.entries(registry.toolDescriptions)
      .map(([name, desc]) => `- ${name}: ${desc}`)
      .join('\n');

    const roleList = Object.entries(registry.agentTools)
      .map(([agent, tools]) => `- ${agent}: ${tools.join(', ') || 'No tools'}`)
      .join('\n');

    return `You are Orion, the strategic AI orchestrator for CodeMaestro - an autonomous development platform.
You coordinate development tasks, provide guidance, and help users understand the system.
Be concise, helpful, and focused on actionable responses.

AVAILABLE TOOLS (only mention these - do not make up tools):
${toolList}

AGENT ROLES:
${roleList}

AGENT MODE:
If you need to query the database, check permissions, list files, or perform any action using tools, 
include this tag at the START of your response:
<use_agent_mode>true</use_agent_mode>

Use agent mode for questions like:
- "What permissions does Tara have?" (needs DatabaseTool)
- "List all projects" (needs DatabaseTool)
- "Show me the files in src/" (needs FileSystemTool)
- "What's the git status?" (needs GitTool)

Do NOT use agent mode for:
- General questions about concepts
- Explanations of how things work
- Greetings and simple conversations

If a question requires architectural decisions, multi-file refactors, security implications, or scalability planning, respond with exactly: ESCALATE_TO_STRATEGIC`;
  }

  /**
   * Generate text response for a prompt.
   * Includes logic to check for escalation.
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    // Check for escalation triggers first
    const lowerPrompt = prompt.toLowerCase();
    const complexTriggers = [
      'analyze complexity', 
      'architectural review',
      'security audit',
      'scale to millions',
      'rewrite core'
    ];

    if (complexTriggers.some(trigger => lowerPrompt.includes(trigger))) {
      return 'ESCALATE_TO_STRATEGIC';
    }

    // If not configured, return mock response
    if (!this.isConfigured) {
      return `[Tactical/DeepSeek] Mock response (no API key): "${prompt.substring(0, 50)}..."`;
    }

    try {
      const systemPrompt = await this.buildSystemPrompt();
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('[TacticalAdapter] API Error:', error.message);
      return `[Tactical Error] ${error.message}`;
    }
  }

  async chat(messages) {
    if (!this.isConfigured) {
      const lastMessage = messages[messages.length - 1];
      return {
        content: `[Tactical/DeepSeek] Mock response (no API key): "${lastMessage.content.substring(0, 50)}..."`,
        usage: { total_tokens: 0 }
      };
    }

    try {
      // Add system message if not present
      const systemPrompt = await this.buildSystemPrompt();
      const chatMessages = messages[0]?.role === 'system' ? messages : [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2000
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage || { total_tokens: 0 }
      };
    } catch (error) {
      console.error('[TacticalAdapter] Chat API Error:', error.message);
      return {
        content: `[Tactical Error] ${error.message}`,
        usage: { total_tokens: 0 }
      };
    }
  }

  getModelName() {
    return this.model;
  }

  getTokenCount() {
    return 0;
  }
}

module.exports = TacticalAdapter;
