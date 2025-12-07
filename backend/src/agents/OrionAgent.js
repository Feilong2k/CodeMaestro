const BaseAgent = require('./BaseAgent');
const AiService = require('../services/aiService');
const { broadcastToSubtask, broadcastToAll } = require('../socket/index');

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
   * @param {string} message - The user message.
   * @param {string} mode - 'strategic' or 'tactical' (default).
   * @returns {Promise<{response: string}>}
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

      const result = await AiService.generate(message, mode);

      broadcastToAll('agent_action', {
        agent: 'Orion',
        action: 'replied',
        status: 'idle',
        timestamp: new Date()
      });

      return { response: result };
    } catch (error) {
      console.error('Orion chat error:', error);
      throw new Error(`Failed to get response from Orion: ${error.message}`);
    }
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
