import { defineStore } from 'pinia'
import * as agentsApi from '../api/agents'
import socket from '../socket/client'

export const useAgentsStore = defineStore('agents', {
  state: () => ({
    agents: {
      orion: { status: 'idle', currentTask: null, lastActivity: null },
      tara: { status: 'idle', currentTask: null, lastActivity: null },
      devon: { status: 'idle', currentTask: null, lastActivity: null }
    },
    activityHistory: [],
    // Internal socket handler reference for cleanup
    _socketHandler: null
  }),

  getters: {
    // Returns array of [agentId, agentData] for active agents
    activeAgent(state) {
      return Object.entries(state.agents).filter(([_, agent]) => agent.status === 'active')
    },

    // Returns array of [agentId, agentData] for idle agents
    idleAgents(state) {
      return Object.entries(state.agents).filter(([_, agent]) => agent.status === 'idle')
    },

    // Returns recent activities, most recent first
    recentActivity: (state) => (limit = 10) => {
      const start = Math.max(0, state.activityHistory.length - limit)
      return state.activityHistory.slice(start).reverse()
    }
  },

  actions: {
    async fetchAgentStatus() {
      try {
        const response = await agentsApi.getStatus()
        // Update each agent with the data from the API
        Object.keys(response.data).forEach(agentId => {
          if (this.agents[agentId]) {
            // Convert string timestamp to Date object if present
            const agentData = response.data[agentId]
            if (agentData.lastActivity && typeof agentData.lastActivity === 'string') {
              agentData.lastActivity = new Date(agentData.lastActivity)
            }
            this.agents[agentId] = { ...this.agents[agentId], ...agentData }
          }
        })
      } catch (error) {
        console.error('Error fetching agent status:', error)
        // Don't throw, just log. The state remains unchanged.
      }
    },

    updateAgentStatus(agentId, status, currentTask = null) {
      // Normalize to lowercase (backend sends 'Orion', store uses 'orion')
      const normalizedId = agentId?.toLowerCase()
      if (!this.agents[normalizedId]) {
        console.warn(`Agent ${agentId} not found`)
        return
      }
      this.agents[normalizedId].status = status
      this.agents[normalizedId].currentTask = currentTask
      this.agents[normalizedId].lastActivity = new Date()
    },

    addActivity(activity) {
      // Ensure timestamp is a Date object
      const normalizedActivity = {
        ...activity,
        timestamp: activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp)
      }
      this.activityHistory.push(normalizedActivity)
      // Keep only the last 50 activities
      if (this.activityHistory.length > 50) {
        this.activityHistory = this.activityHistory.slice(-50)
      }
    },

    // WebSocket integration
    initSocket() {
      // If already initialized, clean up first
      if (this._socketHandler) {
        this.cleanupSocket()
      }
      const handler = (data) => {
        // Handle agent_action events
        if (data.agent && data.status) {
          this.updateAgentStatus(data.agent, data.status, data.taskId || null)
        }
        // Always add an activity for the event
        this.addActivity({
          agent: data.agent,
          action: data.action || 'unknown',
          taskId: data.taskId || null,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        })
      }
      socket.on('agent_action', handler)
      this._socketHandler = handler
    },

    cleanupSocket() {
      if (this._socketHandler) {
        socket.off('agent_action', this._socketHandler)
        this._socketHandler = null
      }
    }
  }
})
