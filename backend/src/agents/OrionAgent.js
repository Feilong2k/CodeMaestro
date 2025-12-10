const BaseAgent = require('./BaseAgent');
const AiService = require('../services/aiService');
const { broadcastToSubtask, broadcastToAll } = require('../socket/index');
const { AgentExecutor } = require('../services/AgentExecutor');
const TaskQueueService = require('../services/TaskQueueService');
const TacticalAdapter = require('../llm/TacticalAdapter');
const chatHistoryService = require('../services/chatHistoryService');
const memoryExtractionService = require('../services/memoryExtractionService');

// Synthetic event control (default: off). Set ORION_EMIT_SYNTHETIC=true to re-enable.
const EMIT_SYNTHETIC = String(process.env.ORION_EMIT_SYNTHETIC || 'false').toLowerCase() === 'true';
function emitSynthetic(event, payload) {
  if (!EMIT_SYNTHETIC) return;
  try {
    const enriched = { ...payload, synthetic: true };
    if (event === 'system_message' && typeof enriched.text === 'string') {
      enriched.text = `[synthetic] ${enriched.text}`;
    }
    broadcastToAll(event, enriched);
  } catch (e) {}
}

// Verbose thought logging (disabled by default). Set ORION_VERBOSE_THOUGHTS=true to enable.
const VERBOSE_THOUGHTS = String(process.env.ORION_VERBOSE_THOUGHTS || 'false').toLowerCase() === 'true';
function emitThought(stage, text, extra = {}) {
  if (!VERBOSE_THOUGHTS) return;
  try {
    broadcastToAll('agent_action', {
      agent: 'Orion',
      action: 'thought',
      stage,
      text,
      ...extra,
      timestamp: new Date()
    });
  } catch (e) {}
}

// Optional chat toggles: allow "debug thoughts on/off" via chat
function handleDebugToggles(msg) {
  const m = (msg || '').trim().toLowerCase();
  if (m === 'debug thoughts on') {
    process.env.ORION_VERBOSE_THOUGHTS = 'true';
    broadcastToAll('agent_action', { agent: 'Orion', action: 'config_update', key: 'ORION_VERBOSE_THOUGHTS', value: true, timestamp: new Date() });
    return 'Verbose thoughts enabled (session)';
  }
  if (m === 'debug thoughts off') {
    process.env.ORION_VERBOSE_THOUGHTS = 'false';
    broadcastToAll('agent_action', { agent: 'Orion', action: 'config_update', key: 'ORION_VERBOSE_THOUGHTS', value: false, timestamp: new Date() });
    return 'Verbose thoughts disabled (session)';
  }
  return null;
}

/**
 * OrionAgent - orchestrator agent that coordinates tasks and state transitions.
 */
class OrionAgent extends BaseAgent {
  constructor() {
    super('orion');
    this.prompt = this.loadPrompt('Orion_Orchestrator_v2');
  }

  /**
   * Execute orchestrator logic based on provided context.
   * Returns a set of actions describing what Orion wants to do.
   * @param {Object} context
   * @returns {Promise<{actions: Array}>}
   */
  async execute(context = {}) {
    const actions = [];
    try {
      const task = context.currentTask;
      if (!task) {
        return { actions };
      }

      const { status, id: subtaskId } = task;

      // Assign task when pending
      if (status === 'pending') {
        const agent = this.assignTask(subtaskId, context.availableAgents || context.assignTo);
        if (agent) {
          actions.push(agent);
          const transition = this.triggerTransition(subtaskId, 'pending', 'in_progress');
          if (transition) actions.push(transition);
        }
      }

      // Approve or reject when ready for review
      if (status === 'ready_for_review') {
        if (context.approved || context.reviewRequired) {
          actions.push(this.approveCompletion(subtaskId));
          const transition = this.triggerTransition(subtaskId, 'ready_for_review', 'completed');
          if (transition) actions.push(transition);
        } else if (Array.isArray(context.issues) && context.issues.length > 0) {
          actions.push(this.rejectCompletion(subtaskId, context.issues[0]));
        }
      }

      // Handle blockers
      if (status === 'blocked') {
        const issue = context.blocker || (Array.isArray(context.issues) ? context.issues[0] : 'Unknown blocker');
        actions.push(this.escalateBlocker(subtaskId, issue, context.blockedFor));
      }

      // Completion transition from in_progress
      if (status === 'in_progress' && context.completed) {
        const transition = this.triggerTransition(subtaskId, 'in_progress', 'ready_for_review');
        if (transition) actions.push(transition);
      }
    } catch (error) {
      // Graceful handling: do not throw, just return no-op actions
      return { actions, error: error.message };
    }

    return { actions };
  }

  /**
   * Chat with Orion using Function Calling for reliable tool execution.
   * Falls back to XML-based agent mode if function calling isn't available.
   * @param {string} message - The user message.
   * @param {string} mode - 'strategic' or 'tactical' (default).
   * @param {number} projectId - Project ID for loading/saving chat history.
   * @returns {Promise<{response: string, usedAgentMode: boolean}>}
   */
  async chat(message, mode = 'tactical', projectId = null) {
    try {
      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'processing message',
        status: 'thinking',
        mode: mode,
        projectId: projectId,
        timestamp: new Date()
      });
      emitThought('OBSERVE', `User message: ${String(message).slice(0,200)}`);

      // Load conversation history from database
      let history = [];
      if (projectId) {
        try {
          history = await chatHistoryService.getHistoryForLLM(projectId, 100);
          console.log(`[OrionAgent] Loaded ${history.length} messages from project ${projectId}`);
        } catch (err) {
          console.warn('[OrionAgent] Failed to load chat history:', err.message);
        }
        
        // Save user message to database
        try {
          await chatHistoryService.saveMessage({
            projectId,
            role: 'user',
            content: message,
            mode
          });
        } catch (err) {
          console.warn('[OrionAgent] Failed to save user message:', err.message);
        }
      }

      // Load project context for LLM
      let projectContext = null;
      if (projectId) {
        try {
          const projectContextService = require('../services/projectContextService');
          const context = await projectContextService.buildContext(projectId);
          if (context) {
            projectContext = projectContextService.formatForLLM(context);
            console.log('[OrionAgent] Loaded project context for:', context.project?.name);
          }
        } catch (err) {
          console.warn('[OrionAgent] Failed to load project context:', err.message);
        }
      } else {
        // Default context for no project selected
        const path = require('path');
        // Use process.cwd() to get the actual runtime directory
        const currentDir = process.cwd(); 
        
        projectContext = `
=== CURRENT CONTEXT ===
No active project selected.
Working Directory: ${currentDir}
  - You are here.
  - Use relative paths from this directory.
=== END CONTEXT ===
`;
      }

      // Local intent router (optional) — enables file/git basics without external LLM
      // Deprecated: local router is permanently disabled to avoid hijacking natural language (e.g., "Read doc, and summarize")

      // Removed local intent router
      /*
      if (LOCAL_ROUTER) {
        const msg = (message || '').trim();
        const tools = require('../tools/registry').getToolsForRole('Orion');
        // Simple patterns: /list docs, /read Docs/<file>, /git status (require leading slash for explicit commands)
        const listDocs = /^\/(list|show)\s+docs[:\\\/]?$/i;
        const readDocsFile = /^\/read\s+docs[:\\\/]([^]+)$/i;
        const gitStatus = /^\/(git\s+status|what\s+branch|which\s+branch)/i;

        // Helper to get a FileSystemTool instance (default root)
        function getFsTool() {
          const T = tools.FileSystemTool;
          return (typeof T === 'function') ? new T('Orion') : T;
        }

        if (listDocs.test(msg)) {
          try {
            const fsTool = getFsTool();
            broadcastToAll('agent_action', { agent: 'Orion', action: 'executing_function', tool: 'FileSystemTool', functionAction: 'list', params: { path: 'Docs' }, timestamp: new Date() });
            const items = fsTool.safeList('Docs');
            const response = `Docs contents (top-level):\n- ${items.join('\n- ')}`;
            if (projectId) { this.saveResponseToHistory(projectId, response, mode).catch(() => {}); }
            broadcastToAll('agent_action', { agent: 'Orion', action: 'function_result', tool: 'FileSystemTool', functionAction: 'list', result: items, timestamp: new Date() });
            return { response, usedAgentMode: false };
          } catch (err) {
            const response = `Could not list Docs: ${err.message}`;
            if (projectId) { this.saveResponseToHistory(projectId, response, mode).catch(() => {}); }
            return { response, usedAgentMode: false };
          }
        }

        const readMatch = msg.match(readDocsFile);
        if (readMatch) {
          try {
            const rel = `Docs/${readMatch[1]}`.replace(/^[.:]+/,'').replace(/\\/g, '/');
            const fsTool = getFsTool();
            broadcastToAll('agent_action', { agent: 'Orion', action: 'executing_function', tool: 'FileSystemTool', functionAction: 'read', params: { path: rel }, timestamp: new Date() });
            const content = fsTool.safeRead(rel);
            const snippet = content.length > 1200 ? content.slice(0, 1200) + '\n…(truncated)…' : content;
            const response = `Contents of ${rel}:\n\n${snippet}`;
            if (projectId) { this.saveResponseToHistory(projectId, response, mode).catch(() => {}); }
            broadcastToAll('agent_action', { agent: 'Orion', action: 'function_result', tool: 'FileSystemTool', functionAction: 'read', result: { path: rel, length: content.length }, timestamp: new Date() });
            return { response, usedAgentMode: false };
          } catch (err) {
            const response = `Could not read file: ${err.message}`;
            if (projectId) { this.saveResponseToHistory(projectId, response, mode).catch(() => {}); }
            return { response, usedAgentMode: false };
          }
        }

        // list docs/<folder>
        const listSubMatch = msg.match(/^list\s+docs[:\\\/]([^]+)$/i);
        if (listSubMatch) {
          try {
            const relDir = `Docs/${listSubMatch[1]}`.replace(/^[.:]+/,'').replace(/\\/g, '/');
            const fsTool = getFsTool();
            broadcastToAll('agent_action', { agent: 'Orion', action: 'executing_function', tool: 'FileSystemTool', functionAction: 'list', params: { path: relDir }, timestamp: new Date() });
            const items = fsTool.safeList(relDir);
            const response = `Docs listing for ${relDir}:\n- ${items.join('\n- ')}`;
            if (projectId) { this.saveResponseToHistory(projectId, response, mode).catch(() => {}); }
            broadcastToAll('agent_action', { agent: 'Orion', action: 'function_result', tool: 'FileSystemTool', functionAction: 'list', result: { path: relDir, count: items.length }, timestamp: new Date() });
            return { response, usedAgentMode: false };
          } catch (err) {
            const response = `Could not list directory: ${err.message}`;
            if (projectId) await this.saveResponseToHistory(projectId, response, mode);
            return { response, usedAgentMode: false };
          }
        }

        // search docs for <term>
        const searchMatch = msg.match(/^search\s+docs\s+for\s+(.+)$/i);
        if (searchMatch) {
          const term = searchMatch[1].trim();
          try {
            const fsTool = getFsTool();
            const results = [];

            function safeListRecursive(dirRel, depth = 0, maxDepth = 2) {
              if (depth > maxDepth) return;
              let entries;
              try { entries = fsTool.safeList(dirRel); } catch { return; }
              for (const name of entries) {
                const child = `${dirRel}/${name}`.replace(/\\/g, '/');
                // Heuristic: try to read; if it fails as a file, assume it's a dir and recurse
                try {
                  const content = fsTool.safeRead(child);
                  if (content && content.toLowerCase().includes(term.toLowerCase())) {
                    results.push(child);
                  }
                } catch (e) {
                  // Not a readable file; try descending
                  safeListRecursive(child, depth + 1, maxDepth);
                }
              }
            }

            safeListRecursive('Docs', 0, 2);
            const header = `Search Docs for "${term}": ${results.length} match(es)`;
            const body = results.length ? `\n- ${results.join('\n- ')}` : '\n(no matches)';
            const response = header + body;
            if (projectId) await this.saveResponseToHistory(projectId, response, mode);
            broadcastToAll('agent_action', { agent: 'Orion', action: 'function_result', tool: 'FileSystemTool', functionAction: 'read', result: { search: term, matches: results.length }, timestamp: new Date() });
            return { response, usedAgentMode: false };
          } catch (err) {
            const response = `Search failed: ${err.message}`;
            if (projectId) await this.saveResponseToHistory(projectId, response, mode);
            return { response, usedAgentMode: false };
          }
        }

        if (gitStatus.test(msg)) {
          try {
            const T = tools.GitTool;
            const git = (typeof T === 'function') ? new T('Orion') : T;
            broadcastToAll('agent_action', { agent: 'Orion', action: 'executing_function', tool: 'GitTool', functionAction: 'status', timestamp: new Date() });
            const result = await git.execute({ action: 'status' });
            const branch = result?.branch || result?.stdout || JSON.stringify(result);
            const response = `Git status: ${branch}`;
            if (projectId) await this.saveResponseToHistory(projectId, response, mode);
            broadcastToAll('agent_action', { agent: 'Orion', action: 'function_result', tool: 'GitTool', functionAction: 'status', result, timestamp: new Date() });
            return { response, usedAgentMode: false };
          } catch (err) {
            const response = `Could not get git status: ${err.message}`;
            if (projectId) await this.saveResponseToHistory(projectId, response, mode);
            return { response, usedAgentMode: false };
          }
        }
      }

      */
      // Use function calling for tactical mode
      if (mode === 'tactical') {
        const tacticalAdapter = new TacticalAdapter();
        const result = await tacticalAdapter.generateWithFunctions(message, true, history, projectContext);
        
        console.log('[OrionAgent] Function calling result type:', result.type);
        console.log('[OrionAgent] Tool calls:', result.toolCalls);
        console.log('[OrionAgent] Content:', result.content?.substring(0, 200));
        emitThought('THINK', `Model preview: ${(result.content || '').slice(0,200)}`, { toolCallsCount: Array.isArray(result.toolCalls) ? result.toolCalls.length : 0 });
        // Emit OBSERVE -> THINK for System Log visibility (chat path)
        emitSynthetic('state_change', {
          subtaskId: 'chat',
          agent: 'Orion',
          from: 'OBSERVE',
          to: 'THINK',
          timestamp: new Date().toISOString()
        });

        // Handle function calls
        if (result.type === 'function_call' && result.toolCalls?.length > 0) {
          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'function_calls_detected',
            status: 'executing',
            toolCalls: result.toolCalls,
          timestamp: new Date()
          });

          // Emit THINK -> ACT when executing functions
          emitSynthetic('state_change', {
            subtaskId: 'chat',
            agent: 'Orion',
            from: 'THINK',
            to: 'ACT',
            timestamp: new Date().toISOString()
          });

          emitThought('ACT', `Executing ${result.toolCalls.length} tool call(s)`);
          // Execute via function calling agent mode (pass projectId for scoped operations)
          const agentResponse = await this.runFunctionCallingMode(message, result.toolCalls, projectId);
          emitThought('VERIFY', 'Tool call(s) completed');
          
          // Save assistant response to database
          if (projectId) {
            await this.saveResponseToHistory(projectId, agentResponse, mode);
          }
          
          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'agent mode complete',
            status: 'idle',
            timestamp: new Date()
          });

          // Emit ACT -> VERIFY -> COMPLETE for System Log visibility
          emitSynthetic('state_change', { subtaskId: 'chat', agent: 'Orion', from: 'ACT', to: 'VERIFY', timestamp: new Date().toISOString() });
          emitSynthetic('state_change', { subtaskId: 'chat', agent: 'Orion', from: 'VERIFY', to: 'COMPLETE', timestamp: new Date().toISOString() });

          return { response: agentResponse, usedAgentMode: true };
        }

        // Text response - check for escalation
        if (result.content === 'ESCALATE_TO_STRATEGIC') {
          // Re-run in strategic mode
          return this.chat(message, 'strategic');
        }

        // Also check for XML-based agent mode request (fallback)
        const agentModeMatch = result.content?.match(/<use_agent_mode>(true|yes)<\/use_agent_mode>/i);
        if (agentModeMatch) {
          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'switching to agent mode (XML fallback)',
            status: 'executing',
            timestamp: new Date()
          });

          const agentResponse = await this.runAgentMode(message);
          
          // Save assistant response to database
          if (projectId) {
            await this.saveResponseToHistory(projectId, agentResponse, mode);
          }
          
          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'agent mode complete',
            status: 'idle',
            timestamp: new Date()
          });

          // Emit ACT -> VERIFY -> COMPLETE for System Log visibility (XML fallback)
          try {
            broadcastToAll('state_change', {
              subtaskId: 'chat', agent: 'Orion', from: 'ACT', to: 'VERIFY', timestamp: new Date().toISOString()
            });
            broadcastToAll('state_change', {
              subtaskId: 'chat', agent: 'Orion', from: 'VERIFY', to: 'COMPLETE', timestamp: new Date().toISOString()
            });
          } catch (e) {}

          return { response: agentResponse, usedAgentMode: true };
        }

        // Normal text response
        // Emit OBSERVE -> THINK -> COMPLETE for System Log visibility
        emitSynthetic('state_change', { subtaskId: 'chat', agent: 'Orion', from: 'OBSERVE', to: 'THINK', timestamp: new Date().toISOString() });
        emitSynthetic('state_change', { subtaskId: 'chat', agent: 'Orion', from: 'THINK', to: 'COMPLETE', timestamp: new Date().toISOString() });
        // Compact spacing in markdown to reduce visual gaps
        const reply = this.compactMarkdown(result.content || '');
        // Save assistant response to database
        if (projectId && reply) {
          await this.saveResponseToHistory(projectId, reply, mode);
        }
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'replied',
          status: 'idle',
          timestamp: new Date()
        });

        emitThought('COMPLETE', 'Replying to user');
        return { response: reply, usedAgentMode: false };
      }

      // Strategic mode - use legacy flow
      const result = await AiService.generate(message, mode);

      // Save assistant response to database
      if (projectId && result) {
        await this.saveResponseToHistory(projectId, result, mode);
      }

      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'replied',
        status: 'idle',
        timestamp: new Date()
      });

      return { response: result, usedAgentMode: false };
    } catch (error) {
      console.error('Orion chat error:', error);
      throw new Error(`Failed to get response from Orion: ${error.message}`);
    }
  }

  /**
   * Helper to save assistant response to chat history.
   * @param {number} projectId - Project ID
   * @param {string} content - Response content
   * @param {string} mode - 'tactical' or 'strategic'
   */
  async saveResponseToHistory(projectId, content, mode) {
    try {
      await chatHistoryService.saveMessage({
        projectId,
        role: 'assistant',
        content,
        agent: 'Orion',
        mode
      });
      
      // Check if memory extraction is needed (runs every 50 messages)
      memoryExtractionService.checkAndExtract(projectId).catch(err => {
        console.warn('[OrionAgent] Memory extraction check failed:', err.message);
      });
    } catch (err) {
      console.warn('[OrionAgent] Failed to save assistant response:', err.message);
    }
  }

  /**
   * Run agent mode using function calling results.
   * @param {string} query - Original user query
   * @param {Array} toolCalls - Parsed tool calls from function calling
   * @param {number} projectId - Project ID for scoped operations
   * @returns {Promise<string>} Final response
   */
  async runFunctionCallingMode(query, toolCalls, projectId = null) {
    console.log('[runFunctionCallingMode] Starting with', toolCalls.length, 'tool calls, projectId:', projectId);
    try {
      const registry = require('../tools/registry');
      const tools = registry.getToolsForRole('Orion');
      console.log('[runFunctionCallingMode] Available tools:', Object.keys(tools));
      const results = [];
      
      // Get project path for scoped file operations
      let projectPath = null;
      if (projectId) {
        try {
          const { getProject } = require('../db/connection');
          const project = await getProject(projectId);
          if (project?.path) {
            projectPath = project.path;
            console.log('[runFunctionCallingMode] Project path:', projectPath);
          }
        } catch (err) {
          console.warn('[runFunctionCallingMode] Could not load project:', err.message);
        }
      }

      // Execute each function call
      for (const toolCall of toolCalls) {
        const { tool: toolName, action, params, id } = toolCall;
        
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'executing_function',
          tool: toolName,
          functionAction: action,
          params: params,
          callId: id,
          timestamp: new Date()
        });

        try {
          console.log('[runFunctionCallingMode] Looking for tool:', toolName);
          const tool = tools[toolName];
          if (!tool) {
            const errorMsg = `Tool ${toolName} not found. Available: ${Object.keys(tools).join(', ')}`;
            console.log('[runFunctionCallingMode] ERROR:', errorMsg);
            results.push({ tool: toolName, action, error: errorMsg });
            broadcastToAll('agent_action', {
              agent: 'Orion',
              action: 'function_error',
              tool: toolName,
              error: errorMsg,
              timestamp: new Date()
            });
            continue;
          }

          // Instantiate tool if it's a class
          console.log('[runFunctionCallingMode] Tool found, type:', typeof tool);
          let toolInstance;
          if (typeof tool === 'function') {
            // Special handling for FileSystemTool - pass projectPath
            if (toolName === 'FileSystemTool' && projectPath) {
              toolInstance = new tool(projectPath);
              console.log('[runFunctionCallingMode] FileSystemTool scoped to:', projectPath);
            } else {
              toolInstance = new tool('Orion');
            }
          } else {
            // Tool is already an instance
            // For FileSystemTool, create new scoped instance if needed
            if (toolName === 'FileSystemTool' && projectPath) {
              const FileSystemTool = require('../tools/FileSystemTool').FileSystemTool;
              toolInstance = new FileSystemTool(projectPath);
              console.log('[runFunctionCallingMode] FileSystemTool scoped to:', projectPath);
            } else {
              toolInstance = tool;
            }
          }
          
          // Special handling for MemoryTool - pass projectId in params
          if (toolName === 'MemoryTool' && projectId) {
            params.projectId = projectId;
            console.log('[runFunctionCallingMode] MemoryTool using projectId:', projectId);
          }
          
          // Special handling for ShellTool - inject project path as cwd
          if (toolName === 'ShellTool' && projectPath) {
            // Only set cwd if not already specified in params
            if (!params.cwd) {
              params.cwd = projectPath;
              console.log('[runFunctionCallingMode] ShellTool using project cwd:', projectPath);
            }
          }
          
          // Execute with action included in params
          const executeParams = { action, ...params };
          console.log('[runFunctionCallingMode] Executing with params:', executeParams);
          const result = await toolInstance.execute(executeParams);
          console.log('[runFunctionCallingMode] Result:', JSON.stringify(result).substring(0, 200));
          results.push({ tool: toolName, action, result });

          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'function_result',
            tool: toolName,
            functionAction: action,
            result: result,
            timestamp: new Date()
          });
          // Also emit a concise system_message for System Log visibility
          try {
            const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let extra = '';
            if (toolName === 'FileSystemTool' && action === 'list') {
              const count = Array.isArray(result?.items) ? result.items.length : (Array.isArray(result) ? result.length : undefined);
              extra = typeof count === 'number' ? ` (${count} items)` : '';
            }
            emitSynthetic('system_message', {
              timestamp: ts,
              level: 'info',
              text: `Orion: ${toolName}.${action} completed${extra}`
            });
          } catch (e) {
            console.warn('[OrionAgent] Failed to emit system_message for function_result:', e?.message);
          }
        } catch (execError) {
          results.push({ tool: toolName, action, error: execError.message });
          broadcastToAll('agent_action', {
            agent: 'Orion',
            action: 'function_error',
            tool: toolName,
            error: execError.message,
            timestamp: new Date()
          });
        }
      }

      // Summarize results
      const tacticalAdapter = new TacticalAdapter();
      const summaryPrompt = `You executed these tool calls for the user's query: "${query}"

Results:
${results.map(r => {
  if (r.error) return `❌ ${r.tool}.${r.action}: Error - ${r.error}`;
  return `✅ ${r.tool}.${r.action}: ${JSON.stringify(r.result, null, 2)}`;
}).join('\n')}

Please provide a helpful, compact summary with minimal spacing:
- Use simple hyphen bullets (-), not emojis
- No blank lines between items or sections
- Keep headings short; avoid extra line breaks
- One line per item; wrap naturally if needed
- Be concise but complete.`;

      const summaryResult = await tacticalAdapter.generateWithFunctions(summaryPrompt, false);
      return summaryResult.content || JSON.stringify(results, null, 2);
    } catch (error) {
      console.error('Function calling mode error:', error);
      return `Function calling encountered an error: ${error.message}`;
    }
  }

  /**
   * Run a query in Agent Mode with tool access.
   * @param {string} query - The user's question/request
   * @returns {Promise<string>} The final response
   */
  async runAgentMode(query) {
    try {
      // Queue the task
      const task = await TaskQueueService.enqueue(
        'Orion',
        { 
          query,
          mode: 'agent',
          requestedAt: new Date().toISOString()
        }
      );

      // Execute immediately (synchronous agent mode for chat)
      const executor = new AgentExecutor({ maxSteps: 10 });
      
      // Get tools for Orion
      const registry = require('../tools/registry');
      const tools = registry.getToolsForRole('Orion');
      
      // Build context
      let context = {
        query,
        steps: [],
        results: []
      };

      // Simple agent loop for chat
      const maxSteps = 10;
      for (let step = 0; step < maxSteps; step++) {
        const prompt = this.buildAgentPrompt(context, tools);
        
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'thinking',
          step: step + 1,
          message: `Step ${step + 1}: Generating response...`,
          timestamp: new Date()
        });
        
        const llmResponse = await AiService.generate(prompt, 'tactical');
        
        // Broadcast the raw LLM response
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'llm_response',
          step: step + 1,
          message: llmResponse,
          timestamp: new Date()
        });
        
        console.log('[AgentMode] LLM Response:', llmResponse.substring(0, 500));
        
        // Check for tool calls
        const toolCalls = this.extractToolCalls(llmResponse);
        console.log('[AgentMode] Parsed tool calls:', JSON.stringify(toolCalls, null, 2));
        
        // Broadcast parsed tool calls
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'tool_calls',
          step: step + 1,
          toolCalls: toolCalls,
          timestamp: new Date()
        });
        
        if (toolCalls.length === 0) {
          // No more tool calls - extract final answer
          const finalAnswer = this.extractFinalAnswer(llmResponse);
          await TaskQueueService.complete(task.id, { context, finalAnswer });
          return finalAnswer || llmResponse;
        }

        // Execute tool calls
        for (const toolCall of toolCalls) {
          try {
            const tool = tools[toolCall.name];
            if (!tool) {
              const errorMsg = `Tool ${toolCall.name} not found`;
              context.results.push({ tool: toolCall.name, error: errorMsg });
              broadcastToAll('agent_action', {
                agent: 'Orion',
                action: 'tool_error',
                tool: toolCall.name,
                error: errorMsg,
                timestamp: new Date()
              });
              continue;
            }
            
            // Broadcast tool execution start
            broadcastToAll('agent_action', {
              agent: 'Orion',
              action: 'executing_tool',
              tool: toolCall.name,
              params: toolCall.params,
              timestamp: new Date()
            });
            
            // Instantiate tool with role if it's a class
            const toolInstance = typeof tool === 'function' ? new tool('Orion') : tool;
            const result = await toolInstance.execute(toolCall.params);
            context.results.push({ tool: toolCall.name, result });
            
            // Broadcast tool result
            broadcastToAll('agent_action', {
              agent: 'Orion',
              action: 'tool_result',
              tool: toolCall.name,
              result: result,
              timestamp: new Date()
            });
          } catch (toolError) {
            context.results.push({ tool: toolCall.name, error: toolError.message });
            broadcastToAll('agent_action', {
              agent: 'Orion',
              action: 'tool_error',
              tool: toolCall.name,
              error: toolError.message,
              timestamp: new Date()
            });
          }
        }
        
        context.steps.push({ step: step + 1, toolCalls, results: context.results.slice(-toolCalls.length) });
      }

      // Max steps reached
      await TaskQueueService.complete(task.id, { context, maxStepsReached: true });
      return 'I gathered some information but reached my step limit. Here\'s what I found: ' + 
             JSON.stringify(context.results, null, 2);
    } catch (error) {
      console.error('Agent mode error:', error);
      return `Agent mode encountered an error: ${error.message}`;
    }
  }

  /**
   * Build prompt for agent mode
   */
  buildAgentPrompt(context, tools) {
    // If we have results, tell the LLM to summarize
    if (context.results.length > 0) {
      const resultsText = context.results.map(r => {
        if (r.error) return `ERROR from ${r.tool}: ${r.error}`;
        return `SUCCESS from ${r.tool}: ${JSON.stringify(r.result, null, 2)}`;
      }).join('\n\n');

      return `You are Orion. You already have the data you need. Now provide a FINAL ANSWER.

Original Query: ${context.query}

TOOL RESULTS:
${resultsText}

IMPORTANT: You already have the answer! Do NOT call any more tools.
Just summarize the results in a helpful way and respond with:

<final_answer>
Your helpful summary of the results here. Format nicely for the user.
</final_answer>`;
    }

    // First step - no results yet
    return `You are Orion in Agent Mode. Answer this query using your tools.

Query: ${context.query}

AVAILABLE TOOLS AND ACTIONS:

DatabaseTool (for database queries):
- action: getAgentPermissions, params: agentId (e.g., "tara", "devon", "orion")
- action: getAgentRegistry (no params) - list all agents and their tools
- action: listTables (no params) - list database tables

FileSystemTool (for file operations):
- action: read, params: path
- action: list, params: dirPath

GitTool (for git operations):
- action: status (no params)

ProjectTool (for project management):
- action: list (no params)
- action: get, params: projectId

EXAMPLE - For "What permissions does Tara have?":
<tool name="DatabaseTool">
  <action>getAgentPermissions</action>
  <agentId>tara</agentId>
</tool>

Respond with ONE tool call to get the information you need.`;
  }

  /**
   * Extract tool calls from LLM response
   */
  extractToolCalls(text) {
    const toolCalls = [];
    const toolRegex = /<tool\s+name="([^"]+)">(.*?)<\/tool>/gs;
    let match;
    
    while ((match = toolRegex.exec(text)) !== null) {
      const toolName = match[1];
      const content = match[2];
      const params = {};
      
      // Extract parameters
      const paramRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(content)) !== null) {
        params[paramMatch[1]] = paramMatch[2];
      }
      
      toolCalls.push({ name: toolName, params });
    }
    
    return toolCalls;
  }

  /**
   * Extract final answer from LLM response
   */
  extractFinalAnswer(text) {
    const match = text.match(/<final_answer>([\s\S]*?)<\/final_answer>/i);
    return match ? match[1].trim() : null;
  }

  // Collapse excessive whitespace and blank lines to achieve minimal spacing
  compactMarkdown(text) {
    if (!text) return '';
    let t = String(text);
    // Remove extra blank lines
    t = t.replace(/\n\s*\n+/g, '\n');
    // Trim leading/trailing whitespace
    t = t.trim();
    return t;
  }

  assignTask(subtaskId, agents) {
    if (!agents) return null;
    const agent = Array.isArray(agents) ? agents[0] : agents;
    if (!agent) return null;

    // Emit log entry via socket
    try {
      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'assigned task',
        taskId: subtaskId,
        status: 'active',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit log entry for assignTask:', error);
    }

    return {
      type: 'assignTask',
      subtaskId,
      agent
    };
  }

  approveCompletion(subtaskId) {
    // Emit log entry via socket
    try {
      broadcastToSubtask(subtaskId, 'log_entry', {
        level: 'info',
        message: `Approved completion of subtask ${subtaskId}`
      });
    } catch (error) {
      console.error('Failed to emit log entry for approveCompletion:', error);
    }

    return {
      type: 'approveCompletion',
      subtaskId
    };
  }

  rejectCompletion(subtaskId, reason = 'Unspecified issue') {
    // Emit log entry via socket
    try {
      broadcastToSubtask(subtaskId, 'log_entry', {
        level: 'warn',
        message: `Rejected completion of subtask ${subtaskId}: ${reason}`
      });
    } catch (error) {
      console.error('Failed to emit log entry for rejectCompletion:', error);
    }

    return {
      type: 'rejectCompletion',
      subtaskId,
      reason
    };
  }

  escalateBlocker(subtaskId, issue, duration) {
    // Emit log entry via socket
    try {
      broadcastToSubtask(subtaskId, 'log_entry', {
        level: 'error',
        message: `Subtask ${subtaskId} blocked: ${issue} (duration: ${duration || 'unknown'})`
      });
    } catch (error) {
      console.error('Failed to emit log entry for escalateBlocker:', error);
    }

    return {
      type: 'escalateBlocker',
      subtaskId,
      issue,
      duration
    };
  }

  triggerTransition(subtaskId, from, to) {
    // Emit log entry via socket
    try {
      broadcastToSubtask(subtaskId, 'log_entry', {
        level: 'info',
        message: `Transitioned subtask ${subtaskId} from ${from} to ${to}`
      });
    } catch (error) {
      console.error('Failed to emit log entry for triggerTransition:', error);
    }

    return {
      type: 'triggerTransition',
      subtaskId,
      from,
      to
    };
  }
}

module.exports = OrionAgent;
