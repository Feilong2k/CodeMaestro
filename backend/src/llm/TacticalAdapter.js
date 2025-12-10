const ModelAdapter = require('./ModelAdapter');
const OpenAI = require('openai');
const aiConfig = require('../config/ai');
const agentRegistryService = require('../services/agentRegistryService');
const functionDefinitions = require('../tools/functionDefinitions');
const { parseFunctionCall } = require('../tools/functionDefinitions');

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

AVAILABLE TOOLS:
${toolList}

TOOL ACTIONS (use exact action names):

ProjectTool actions:
- action: "create" - Create new project (params: name, description)
- action: "list" - List all active projects
- action: "get" - Get project details (params: projectId)
- action: "update" - Update project (params: projectId, name?, description?)
- action: "delete" - SOFT DELETE a project (params: projectId)

DatabaseTool actions:
- action: "getAgentPermissions" - Get permissions for an agent (params: agentName)
- action: "getAgentRegistry" - Get all agents and their tools
- action: "listTables" - List all database tables
- action: "query" - Run custom SQL (params: sql, params[])

FileSystemTool actions:
- action: "read" - Read file contents (params: path)
- action: "write" - Write to file (params: path, content)
- action: "list" - List directory contents (params: path)
- action: "mkdir" - Create directory recursively (params: path)

GitTool actions:
- action: "status" - Get git status
- action: "commit" - Commit changes (params: message)
- action: "branch" - List or create branches

AGENT ROLES:
${roleList}

AGENT MODE:
If you need to perform ANY action using tools, include this at the START of your response:
<use_agent_mode>true</use_agent_mode>

Then include your tool call:
<tool name="ToolName">
  <action>actionName</action>
  <paramName>value</paramName>
</tool>

IMPORTANT: Match user intent to correct action:
- "delete project X" → action: "delete" (NOT "get")
- "remove project X" → action: "delete"
- "list projects" → action: "list"
- "create project" → action: "create"
- "update project" → action: "update" (NOT "list" or "get")
- "change path" → action: "update" with path parameter
- "set path to" → action: "update" with path parameter
- "modify project" → action: "update"

ProjectTool UPDATE example:
<tool name="ProjectTool">
  <action>update</action>
  <projectId>1</projectId>
  <path>Projects/CodeMaestro</path>
</tool>

CONFIRMATION HANDLING:
When user says "yes", "proceed", "go ahead", "do it", or confirms a proposed action:
- You MUST use agent mode and actually execute the tools
- Do NOT just describe what you would do
- Do NOT pretend to have done it
- Actually call the tools with <use_agent_mode>true</use_agent_mode>

Example:
User: "Yes, proceed with creating the folder and updating the path"
You MUST respond with:
<use_agent_mode>true</use_agent_mode>
<tool name="FileSystemTool">...</tool>
<tool name="ProjectTool">...</tool>

Do NOT use agent mode for general questions or explanations.

If a question requires architectural decisions, multi-file refactors, security implications, or scalability planning, respond with exactly: ESCALATE_TO_STRATEGIC`;
  }

  /**
   * Build a simpler system prompt for function calling mode
   */
  buildFunctionCallingPrompt() {
    return `You are Orion, the strategic AI orchestrator for CodeMaestro.
You have access to tools via function calling. Use them to help the user.

IMPORTANT: You must use the function calling feature (JSON format) for tool calls. Do not output tool calls in XML or any other text format.

AVAILABLE TOOLS:
- FileSystemTool: read, write, list, mkdir, delete
- GitTool: status, commit, branch
- ShellTool: execute (run shell commands)
- ProjectTool: list, get, create, update, delete
- DatabaseTool: query, getAgentPermissions, getAgentRegistry
- MemoryTool: search

GENERAL RULES:
1. Use tools only when the user explicitly requests an action that requires a tool.
2. For general questions or explanations, respond with helpful text and do NOT call tools.
3. If you are unsure about the user's intent, ask for clarification.
4. Do not hallucinate tool calls. Only call tools when you have clear intent.

FILE OPERATIONS RULES:
- When the user asks you to create, update, or modify a file, use the FileSystemTool.
- When the user asks to read or list files, use the FileSystemTool.
- Example: If the user says "create a todo.md file with a list of tasks", you should call the FileSystemTool's write action with the appropriate path and content.
- Example: If the user says "read the file README.md", you should call the FileSystemTool's read action.

SAFETY RULES:
- When asked to delete or modify existing data, ask for confirmation first.
- When asked to create new files or folders, you may proceed without confirmation.
- When asked to run shell commands, ensure they are safe (e.g., git clone, npm install). If unsure, ask.

WORKING DIRECTORY:
All file paths are relative to the current working directory. If the user does not specify a project, assume the current directory.

REMINDER: You are an autonomous developer. You have tools to interact with the file system, Git, database, etc. Use them to accomplish the user's request.

If a question requires architectural decisions, security reviews, or complex multi-step planning, respond with: ESCALATE_TO_STRATEGIC`;
  }

  /**
   * Generate response with function calling support.
   * @param {string} prompt
   * @param {boolean} useFunctionCalling - Whether to use function calling (default: true)
   * @returns {Promise<Object>} { type: 'text'|'function_call', content?, toolCalls? }
   */
  async generateWithFunctions(prompt, useFunctionCalling = true, history = [], projectContext = null) {
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
      return { type: 'text', content: 'ESCALATE_TO_STRATEGIC' };
    }

    // If not configured, return mock response
    if (!this.isConfigured) {
      return { 
        type: 'text', 
        content: `[Tactical/DeepSeek] Mock response (no API key): "${prompt.substring(0, 50)}..."` 
      };
    }

    try {
      let systemPrompt = this.buildFunctionCallingPrompt();
      
      // Append project context if available
      if (projectContext) {
        systemPrompt += '\n' + projectContext;
      }
      
      // Build messages array with history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history (up to 100 messages for full context)
      if (history && history.length > 0) {
        const recentHistory = history.slice(-100);
        console.log(`[TacticalAdapter] Adding ${recentHistory.length} history messages to context`);
        for (const msg of recentHistory) {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            });
          }
        }
      } else {
        console.log('[TacticalAdapter] No history provided or empty');
      }
      
      // Add current message
      messages.push({ role: 'user', content: prompt });
      
      const requestParams = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      };

      // Add function calling if enabled
      if (useFunctionCalling) {
        requestParams.tools = functionDefinitions;
        requestParams.tool_choice = 'auto';
      }

      const response = await this.client.chat.completions.create(requestParams);
      const message = response.choices[0].message;

      // Check if LLM wants to call functions
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls = message.tool_calls.map(tc => ({
          id: tc.id,
          ...parseFunctionCall(tc)
        }));
        
        return {
          type: 'function_call',
          toolCalls,
          rawMessage: message
        };
      }

      // Regular text response
      return {
        type: 'text',
        content: message.content || ''
      };
    } catch (error) {
      console.error('[TacticalAdapter] Function Calling Error:', error.message);
      return {
        type: 'text',
        content: `[Tactical Error] ${error.message}`
      };
    }
  }

  /**
   * Generate text response for a prompt (legacy method, now uses function calling).
   * @param {string} prompt
   * @returns {Promise<string>}
   */
  async generate(prompt) {
    // Use function calling and extract text content
    const result = await this.generateWithFunctions(prompt, false);
    return result.content || '';
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
