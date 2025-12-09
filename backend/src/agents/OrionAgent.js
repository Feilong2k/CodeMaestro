const BaseAgent = require('./BaseAgent');
const AiService = require('../services/aiService');
const { broadcastToSubtask, broadcastToAll } = require('../socket/index');
const { AgentExecutor } = require('../services/agentExecutor');
const TaskQueueService = require('../services/TaskQueueService');

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
   * Chat with Orion using AiService (Split-Brain).
   * Automatically switches to Agent Mode if tools are needed.
   * @param {string} message - The user message.
   * @param {string} mode - 'strategic' or 'tactical' (default).
   * @returns {Promise<{response: string, usedAgentMode: boolean}>}
   */
  async chat(message, mode = 'tactical') {
    try {
      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'processing message',
        status: 'thinking',
        mode: mode,
        timestamp: new Date()
      });

      // First, get initial response which may request agent mode
      const result = await AiService.generate(message, mode);

      // Check if agent mode is requested
      const agentModeMatch = result.match(/<use_agent_mode>(true|yes)<\/use_agent_mode>/i);
      
      if (agentModeMatch) {
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'switching to agent mode',
          status: 'executing',
          timestamp: new Date()
        });

        // Run in agent mode
        const agentResponse = await this.runAgentMode(message);
        
        broadcastToAll('agent_action', {
          agent: 'Orion',
          action: 'agent mode complete',
          status: 'idle',
          timestamp: new Date()
        });

        return { response: agentResponse, usedAgentMode: true };
      }

      // Normal chat response (strip any agent mode markers just in case)
      const cleanResult = result.replace(/<use_agent_mode>.*?<\/use_agent_mode>/gi, '').trim();

      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'replied',
        status: 'idle',
        timestamp: new Date()
      });

      return { response: cleanResult, usedAgentMode: false };
    } catch (error) {
      console.error('Orion chat error:', error);
      throw new Error(`Failed to get response from Orion: ${error.message}`);
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
