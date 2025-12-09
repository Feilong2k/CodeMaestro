const TaskQueueService = require('./TaskQueueService');
const registry = require('../tools/registry');
const DeepseekClient = require('../llm/DeepseekClient');
const AgentFSM = require('../machines/AgentFSM');
const AgentFsmLogService = require('./AgentFsmLogService');
const { broadcastToAll } = require('../socket/index');

/**
 * Simple XML parser for extracting tool calls from LLM output.
 * This is a temporary implementation until XmlOutputParser (5-4) is ready.
 */
class SimpleXmlParser {
  /**
   * Extract tool calls from text containing XML tags.
   * @param {string} text - The text to parse
   * @returns {Array<Object>} Array of tool call objects
   */
  extractToolCalls(text) {
    const toolCalls = [];
    const toolRegex = /<tool\s+([^>]+)>(.*?)<\/tool>/gs;
    let match;
    while ((match = toolRegex.exec(text)) !== null) {
      const attrs = match[1];
      const content = match[2];
      const toolCall = {};

      // Parse attributes like name="FileSystemTool" action="write"
      const attrRegex = /(\w+)="([^"]+)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        toolCall[attrMatch[1]] = attrMatch[2];
      }

      // Parse inner elements like <path>test.js</path>
      const innerRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(content)) !== null) {
        toolCall[innerMatch[1]] = innerMatch[2];
      }

      toolCalls.push(toolCall);
    }
    return toolCalls;
  }
}

/**
 * AgentExecutor orchestrates the execution of agent tasks.
 * It uses the AgentFSM to drive the OBSERVE-THINK-ACT-WAIT-VERIFY-COMPLETE loop.
 */
class AgentExecutor {
  constructor(config = {}) {
    this.maxSteps = config.maxSteps || 20;
    this.xmlParser = new SimpleXmlParser();
    this.fsm = AgentFSM;
  }

  /**
   * Execute a task by its ID.
   * @param {number} taskId - The task ID (currently unused in dequeue, but kept for future)
   */
  async executeTask(taskId) {
    // Dequeue the task
    const task = await TaskQueueService.dequeue('agent-executor');
    if (!task) {
      throw new Error(`Task ${taskId} not found or already taken`);
    }

    const { id, type, payload } = task;
    let context = { ...payload, steps: [], stepCount: 0 };
    let state = this.fsm.initialState; // OBSERVE
    const subtaskId = payload.subtaskId || `task-${id}`;
    const agent = type; // e.g., 'devon'

    try {
      // Get tools allowed for this agent role
      const tools = registry.getToolsForRole(type);

      // Main execution loop driven by FSM
      while (state !== this.fsm.STATES.COMPLETE && state !== this.fsm.STATES.ERROR) {
        if (context.stepCount >= this.maxSteps) {
          // Transition to ERROR due to step budget exceeded
          state = this.fsm.transition(state, this.fsm.EVENTS.ERROR_OCCURRED, {
            ...context,
            error: `Step budget exceeded (max ${this.maxSteps} steps)`
          });
          context = this.fsm.updateContext(state, this.fsm.EVENTS.ERROR_OCCURRED, context);
          break;
        }

        // Increment step count
        context.stepCount++;
        
        // Determine next action based on state
        let event = null;
        let llmResponse = null;
        let toolCalls = [];

        switch (state) {
          case this.fsm.STATES.OBSERVE:
            // Build prompt based on current context
            const prompt = this.buildPrompt(context, tools);
            try {
              llmResponse = await DeepseekClient.chatCompletion(prompt);
              event = this.fsm.EVENTS.OBSERVE_COMPLETE;
              context.lastResult = llmResponse.content;
            } catch (error) {
              // Network error -> transition to ERROR
              event = this.fsm.EVENTS.ERROR_OCCURRED;
              context.error = `LLM call failed: ${error.message}`;
            }
            break;

          case this.fsm.STATES.THINK:
            // Parse tool calls from LLM response
            toolCalls = this.xmlParser.extractToolCalls(context.lastResult);
            if (toolCalls.length === 0) {
              // No tool calls means task is complete
              event = this.fsm.EVENTS.THINK_COMPLETE;
              context.lastResult = 'No tools needed';
            } else {
              event = this.fsm.EVENTS.THINK_COMPLETE;
              context.toolCalls = toolCalls;
            }
            break;

          case this.fsm.STATES.ACT:
            // Execute tool calls from previous think step
            const stepResults = [];
            for (const toolCall of context.toolCalls) {
              const toolName = toolCall.name;
              const tool = tools[toolName];
              if (!tool) {
                throw new Error(`Tool ${toolName} not allowed for role ${type}`);
              }
              const { name, action, ...params } = toolCall;
              const result = await tool.execute(params);
              stepResults.push({ tool: toolName, action, params, result });
            }
            context.steps.push({
              step: context.stepCount,
              toolCalls: stepResults,
            });
            event = this.fsm.EVENTS.ACTION_COMPLETE;
            context.lastResult = stepResults;
            break;

          case this.fsm.STATES.WAIT:
            // In this simple implementation, we move directly to VERIFY
            event = this.fsm.EVENTS.WAIT_COMPLETE;
            break;

          case this.fsm.STATES.VERIFY:
            // For now, we assume verification passes if we got here
            event = this.fsm.EVENTS.VERIFICATION_PASSED;
            break;

          default:
            // Unexpected state, go to ERROR
            event = this.fsm.EVENTS.ERROR_OCCURRED;
            context.error = `Unexpected state: ${state}`;
            break;
        }

        // Perform transition
        const nextState = this.fsm.transition(state, event, context);
        // Log the transition
        await AgentFsmLogService.logTransition(subtaskId, agent, state, nextState);
        // Emit state_change over WebSocket for live System Log visibility
        try {
          broadcastToAll('state_change', {
            subtaskId,
            agent,
            from: state,
            to: nextState,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          // Non-fatal: logging only
          // console.warn('[AgentExecutor] Failed to emit state_change:', e?.message)
        }
        // Update context based on transition
        context = this.fsm.updateContext(state, event, context);
        // Move to next state
        state = nextState;
      }

      // Finalize based on terminal state
      if (state === this.fsm.STATES.COMPLETE) {
        await TaskQueueService.complete(id, { context, completed: true });
      } else if (state === this.fsm.STATES.ERROR) {
        throw new Error(context.error || 'Agent execution failed');
      }
    } catch (error) {
      // Mark task as failed
      await TaskQueueService.fail(id, error.message);
      // Do not re-throw the error - the task has been marked as failed
    }
  }

  /**
   * Build a prompt for the LLM based on context and available tools.
   * @param {Object} context - The current execution context
   * @param {Object} tools - Available tools for the agent
   * @returns {string} The prompt string
   */
  buildPrompt(context, tools) {
    const toolDescriptions = Object.keys(tools).map(name => `- ${name}`).join('\n');
    return `
You are an AI agent executing a task. You have access to the following tools:
${toolDescriptions}

Current task context:
${JSON.stringify(context, null, 2)}

Please respond with XML tool calls to perform the next step. Use the format:
<tool name="ToolName" action="action">
  <param1>value1</param1>
  <param2>value2</param2>
</tool>

If the task is complete, respond with an empty message (no tool calls).
`;
  }
}

module.exports = { AgentExecutor };
