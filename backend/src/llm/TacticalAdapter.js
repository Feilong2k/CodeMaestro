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

AVAILABLE TOOLS:
- FileSystemTool_read, FileSystemTool_write, FileSystemTool_list, FileSystemTool_mkdir, FileSystemTool_delete
- GitTool_status, GitTool_commit, GitTool_branch
- ShellTool_execute - Run shell commands (git clone, npm install, etc.)
- ProjectTool_list, ProjectTool_get, ProjectTool_create, ProjectTool_update, ProjectTool_delete
- DatabaseTool_query, DatabaseTool_getAgentPermissions, DatabaseTool_getAgentRegistry
- MemoryTool_search - Search past conversations

AUTONOMY RULES:

AUTO-EXECUTE (just do it, no confirmation needed):
- Read files or directories
- List files or directories
- Create folders (mkdir)
- Create/write new files (use FileSystemTool_write)
- Git status, git clone
- Run shell commands (ShellTool_execute) for safe operations like: git clone, npm install, ls, dir
- Query database (SELECT only)
- Get agent permissions/registry

CRITICAL RULES - FOLLOW EXACTLY:

1. "Create a file" → Call FileSystemTool_write IMMEDIATELY. Do NOT call list first.
2. "Write to file" → Call FileSystemTool_write IMMEDIATELY.
3. "Make a file" → Call FileSystemTool_write IMMEDIATELY.
4. "git clone X" → Call ShellTool_execute with command: "git clone X" IMMEDIATELY.
5. "run npm install" → Call ShellTool_execute with command: "npm install" IMMEDIATELY.
6. "git status" → Call ShellTool_execute with command: "git status" OR use GitTool_status.

The write function creates parent directories automatically. You don't need to verify anything first.

WRONG: User says "create file X" → you call list to check → WRONG!
RIGHT: User says "create file X" → you call FileSystemTool_write → CORRECT!
WRONG: User says "git clone X" → you describe what would happen → WRONG!
RIGHT: User says "git clone X" → you call ShellTool_execute → CORRECT!

CONFIRM FIRST (ask user before executing):
- Delete files or folders
- Modify/update existing files
- Git commit, push, or branch changes
- Update database records
- Update project settings

For AUTO-EXECUTE actions: Call the function immediately without asking.
For CONFIRM actions: Explain what you'll do and ask "Should I proceed?"

CLARIFICATION - ASK WHEN UNCLEAR:
If the user's request is ambiguous or missing critical information, ASK for clarification:
- "Which file do you want me to create?"
- "What should the file contain?"
- "Which project are you referring to?"
- "Do you want me to use the current branch or create a new one?"

TOOL LIMITATIONS - BE HONEST:
If you cannot do something because you lack the tools, say so clearly:
- "I don't have the tools to browse the web."
- "I can't send emails - I only have file, git, shell, and database tools."
- "I can't access external APIs - would you like me to create code that does?"
- "I can't run a server continuously, but I can start it for you."

DO NOT pretend to do things you cannot do. DO NOT hallucinate results.

AFTER USER CONFIRMS - CRITICAL:
When user responds with "yes", "confirmed", "proceed", "go ahead", "do it", "sure", "ok":
- Look at conversation history to see what action was proposed
- IMMEDIATELY call the appropriate function to execute it
- Do NOT ask again
- Do NOT say "How can I help you?"
- EXECUTE THE ACTION

Example conversation:
History: [User asked to delete file X, You asked "Should I proceed?"]
User: "confirmed"
Your response: Call FileSystemTool_delete with path X

If multiple steps are needed (e.g., create folder then create file), do all AUTO-EXECUTE steps immediately.

For questions that don't require tools, respond directly with helpful information.

If a question requires architectural decisions, security reviews, or complex multi-step planning,
respond with: ESCALATE_TO_STRATEGIC`;
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
