import client from './client';

/**
 * Fetches all workflows from the backend.
 * @returns {Promise<Array>} Array of workflow objects
 */
export async function listWorkflows() {
  const response = await client.get('/workflows');
  return response.data;
}

/**
 * Fetches a specific workflow by its ID.
 * @param {string} workflowId - The workflow ID (name)
 * @returns {Promise<Object>} Workflow object
 */
export async function getWorkflow(workflowId) {
  const response = await client.get(`/workflows/${workflowId}`);
  return response.data;
}

/**
 * Updates a workflow (admin only).
 * @param {string} workflowId - The workflow ID (name)
 * @param {Object} updateData - The updated workflow data (must include name and definition)
 * @returns {Promise<Object>} Updated workflow object
 */
export async function updateWorkflow(workflowId, updateData) {
  const response = await client.put(`/workflows/${workflowId}`, updateData);
  return response.data;
}

/**
 * Mock data for development/testing when backend is not available.
 */
export const mockWorkflows = [
  {
    id: 'sample-workflow-1',
    name: 'Sample Workflow 1',
    status: 'active',
    definition: {
      initial: 'idle',
      states: {
        idle: { on: { START: 'running' } },
        running: { on: { COMPLETE: 'done' } },
        done: { type: 'final' }
      }
    },
    metadata: {
      version: '1.0',
      author: 'system'
    }
  },
  {
    id: 'sample-workflow-2',
    name: 'Sample Workflow 2',
    status: 'paused',
    definition: {
      initial: 'pending',
      states: {
        pending: { on: { APPROVE: 'approved', REJECT: 'rejected' } },
        approved: { on: { EXECUTE: 'completed' } },
        rejected: { type: 'final' },
        completed: { type: 'final' }
      }
    },
    metadata: {
      version: '2.0',
      author: 'admin'
    }
  }
];
