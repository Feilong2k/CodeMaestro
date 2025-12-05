const BaseAgent = require('./BaseAgent');
const DeepseekClient = require('../llm/DeepseekClient');
const { broadcastToSubtask } = require('../socket/index');

/**
 * OrionAgent - orchestrator agent that coordinates tasks and state transitions.
 */
class OrionAgent extends BaseAgent {
  constructor() {
    super('orion');
    this.prompt = this.loadPrompt('Orion_Orchestrator_v2');
    this.deepseek = new DeepseekClient();
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
   * Chat with Orion using Deepseek.
   * @param {string} message - The user message.
   * @returns {Promise<{response: string}>}
   */
  async chat(message) {
    const messages = [
      {
        role: 'system',
        content: `You are Orion, an AI development assistant in the CodeMaestro system.
        You help users with planning, building, and testing software.
        You are part of a multi-agent system that includes Tara (tester) and Devon (developer).
        Keep your responses concise and helpful.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const result = await this.deepseek.chat(messages, {
        temperature: 0.7,
        max_tokens: 1000
      });
      return { response: result.content };
    } catch (error) {
      console.error('Deepseek chat error:', error);
      throw new Error(`Failed to get response from Orion: ${error.message}`);
    }
  }

  assignTask(subtaskId, agents) {
    if (!agents) return null;
    const agent = Array.isArray(agents) ? agents[0] : agents;
    if (!agent) return null;

    // Emit log entry via socket
    try {
      broadcastToSubtask(subtaskId, 'log_entry', {
        level: 'info',
        message: `Assigned subtask ${subtaskId} to agent ${agent}`
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
