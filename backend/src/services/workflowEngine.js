const { pool } = require('../db/connection');

/**
 * Workflow Engine - Executes dynamic workflows stored in the database.
 */
class WorkflowEngine {
  constructor() {
    this.workflowCache = new Map(); // name -> workflow object
    this.actionHandlers = new Map(); // actionName -> function
    this.paused = false;
    this.pausedWorkflows = new Set();
  }

  /**
   * Load a workflow from the database and cache it.
   * @param {string} name - Workflow name
   * @returns {Promise<Object>} Workflow object with definition and metadata
   */
  async loadWorkflow(name) {
    if (this.workflowCache.has(name)) {
      return this.workflowCache.get(name);
    }

    const result = await pool.query(
      'SELECT * FROM workflows WHERE name = $1 AND is_active = true',
      [name]
    );

    if (result.rows.length === 0) {
      throw new Error(`Workflow not found: ${name}`);
    }

    const row = result.rows[0];
    
    // Determine if the row has a definition column or separate states/transitions
    let definition = row.definition;
    if (!definition && (row.states || row.transitions)) {
      // Build definition from states and transitions
      const states = typeof row.states === 'string' ? JSON.parse(row.states) : row.states;
      const transitions = typeof row.transitions === 'string' ? JSON.parse(row.transitions) : row.transitions;
      definition = {
        initial: row.metadata?.initial || (states && Object.keys(states)[0]) || 'start',
        states: states || {},
        transitions: transitions || []
      };
    }
    // If definition is a string, parse it
    if (typeof definition === 'string') {
      definition = JSON.parse(definition);
    }
    
    const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;

    const workflow = {
      name: row.name,
      definition,
      metadata: metadata || {}
    };

    this.workflowCache.set(name, workflow);
    return workflow;
  }

  /**
   * Register a handler for an auto-action.
   * @param {string} actionName
   * @param {Function} handler
   */
  registerActionHandler(actionName, handler) {
    this.actionHandlers.set(actionName, handler);
  }

  /**
   * Execute an auto-action if a handler is registered.
   * @param {string} actionName
   * @param {Object} context
   */
  async executeAction(actionName, context) {
    const handler = this.actionHandlers.get(actionName);
    if (handler) {
      await handler(context);
    }
  }

  /**
   * Transition from current state to next state based on event and context.
   * @param {string} workflowName
   * @param {string} currentState
   * @param {Object} event - { type: string, ... }
   * @param {Object} context - Additional context (strategy, isBugEscalation, etc.)
   * @returns {Promise<string>} Next state
   */
  async transition(workflowName, currentState, event, context = {}) {
    if (this.paused || this.pausedWorkflows.has(workflowName)) {
      throw new Error('Workflow execution is paused');
    }

    const workflow = await this.loadWorkflow(workflowName);
    const { definition, metadata } = workflow;

    // Apply bug escalation rule: if escalated from devon, force strategic mode
    if (context.escalatedFrom === 'devon' || context.isBugEscalation) {
      context.strategy = 'three-tier'; // Force three-tier (strategic) planning
    }

    // Determine the next state based on the workflow definition and context
    const nextState = this.calculateNextState(definition, currentState, event, context);

    // Execute auto_actions for the current state (if defined in metadata)
    if (metadata && metadata.auto_actions && metadata.auto_actions[currentState]) {
      const actionName = metadata.auto_actions[currentState];
      await this.executeAction(actionName, context);
    }

    // Also check if there are auto_actions for the next state (if we want to execute on entry)
    if (metadata && metadata.auto_actions && metadata.auto_actions[nextState]) {
      const actionName = metadata.auto_actions[nextState];
      await this.executeAction(actionName, context);
    }

    return nextState;
  }

  /**
   * Calculate the next state based on the workflow definition, current state, event, and context.
   * @param {Object} definition - Workflow definition (initial, states, transitions)
   * @param {string} currentState
   * @param {Object} event
   * @param {Object} context
   * @returns {string} Next state
   */
  calculateNextState(definition, currentState, event, context) {
    // Use transitions array from definition
    if (!definition.transitions || !Array.isArray(definition.transitions)) {
      throw new Error('Invalid workflow definition: missing transitions array');
    }

    // Find a transition that matches currentState, event.type, and condition (if any)
    const matchingTransitions = definition.transitions.filter(t => {
      if (t.from !== currentState) return false;
      if (t.event !== event.type) return false;
      // If there is a condition, evaluate it (simplified)
      if (t.condition) {
        // For now, we only handle strategy condition
        if (t.condition === 'strategy:standard' && context.strategy !== 'standard') return false;
        if (t.condition === 'strategy:three-tier' && context.strategy !== 'three-tier') return false;
        // Add other conditions as needed
      }
      return true;
    });

    if (matchingTransitions.length === 0) {
      throw new Error(`No valid transition from state ${currentState} with event ${event.type}`);
    }

    // For now, take the first matching transition
    return matchingTransitions[0].to;
  }

  /**
   * Validate if a state exists in the workflow.
   * @param {string} workflowName
   * @param {string} state
   * @returns {Promise<boolean>}
   */
  async validateState(workflowName, state) {
    const workflow = await this.loadWorkflow(workflowName);
    // Check if the state exists in definition.states
    if (workflow.definition.states && workflow.definition.states[state]) {
      return true;
    }
    // Alternatively, check if the state appears in transitions
    if (workflow.definition.transitions) {
      const allStates = new Set();
      workflow.definition.transitions.forEach(t => {
        allStates.add(t.from);
        allStates.add(t.to);
      });
      return allStates.has(state);
    }
    return false;
  }

  /**
   * Pause the entire engine or a specific workflow.
   * @param {string|null} workflowName - If null, pause all workflows.
   */
  pause(workflowName = null) {
    if (workflowName) {
      this.pausedWorkflows.add(workflowName);
    } else {
      this.paused = true;
    }
  }

  /**
   * Resume the entire engine or a specific workflow.
   * @param {string|null} workflowName - If null, resume all workflows.
   */
  resume(workflowName = null) {
    if (workflowName) {
      this.pausedWorkflows.delete(workflowName);
    } else {
      this.paused = false;
    }
  }

  /**
   * Check if the engine (or a specific workflow) is paused.
   * @param {string|null} workflowName - If null, check global pause.
   * @returns {boolean}
   */
  isPaused(workflowName = null) {
    if (workflowName) {
      return this.pausedWorkflows.has(workflowName);
    }
    return this.paused;
  }

  /**
   * List all active workflows.
   * @returns {Promise<Array>} Array of workflow objects with id, name, status
   */
  async listWorkflows() {
    const result = await pool.query(
      'SELECT name, is_active FROM workflows WHERE is_active = true ORDER BY name'
    );
    return result.rows.map(row => ({
      id: row.name,
      name: row.name,
      status: row.is_active ? 'active' : 'inactive'
    }));
  }

  /**
   * Get a workflow by its name (id).
   * @param {string} id - Workflow name (used as id)
   * @returns {Promise<Object|null>} Workflow object or null if not found
   */
  async getWorkflow(id) {
    try {
      const workflow = await this.loadWorkflow(id);
      return {
        id: workflow.name,
        name: workflow.name,
        definition: workflow.definition,
        metadata: workflow.metadata
      };
    } catch (error) {
      if (error.message.includes('Workflow not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update a workflow by its name (id).
   * @param {string} id - Workflow name (used as id)
   * @param {Object} data - Update data (name, definition, metadata, etc.)
   * @returns {Promise<Object|null>} Updated workflow or null if not found
   */
  async updateWorkflow(id, data) {
    // Validate required fields
    if (!data.name || !data.definition) {
      throw new Error('Workflow update requires name and definition');
    }

    // Check if workflow exists
    const existing = await pool.query(
      'SELECT name FROM workflows WHERE name = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return null;
    }

    // Update the workflow
    const result = await pool.query(
      `UPDATE workflows 
       SET name = $1, definition = $2, metadata = $3, updated_at = NOW()
       WHERE name = $4
       RETURNING name, definition, metadata, is_active`,
      [data.name, JSON.stringify(data.definition), JSON.stringify(data.metadata || {}), id]
    );

    const row = result.rows[0];
    // Clear cache for this workflow
    this.workflowCache.delete(id);
    if (id !== data.name) {
      this.workflowCache.delete(data.name);
    }

    return {
      id: row.name,
      name: row.name,
      definition: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = new WorkflowEngine();
