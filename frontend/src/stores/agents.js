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
      // Unified handler to convert various events into activity entries
      const toActivity = (payload, type) => {
        const ts = payload.timestamp ? new Date(payload.timestamp) : new Date()
        const agent = payload.agent || 'System'
        let action = payload.action || type
        if (type === 'state_change') {
          action = `${payload.from || 'UNKNOWN'} → ${payload.to || 'UNKNOWN'}`
        } else if (type === 'system_message') {
          action = payload.text || 'system'
        } else if (type === 'log_entry') {
          action = payload.message || payload.text || JSON.stringify(payload)
        }
        return {
          agent,
          action,
          taskId: payload.taskId || payload.subtaskId || null,
          timestamp: ts
        }
      }

      const agentActionHandler = (data) => {
        if (data.agent && data.status) {
          this.updateAgentStatus(data.agent, data.status, data.taskId || null)
        }
        this.addActivity(toActivity(data, 'agent_action'))
      }

      const stateChangeHandler = (data) => {
        this.addActivity(toActivity(data, 'state_change'))
      }

      const systemMessageHandler = (data) => {
        this.addActivity(toActivity(data, 'system_message'))
      }

      const logEntryHandler = (data) => {
        this.addActivity(toActivity(data, 'log_entry'))
      }

      socket.on('agent_action', agentActionHandler)
      socket.on('state_change', stateChangeHandler)
      socket.on('system_message', systemMessageHandler)
      socket.on('log_entry', logEntryHandler)

      this._socketHandler = {
        agentActionHandler,
        stateChangeHandler,
        systemMessageHandler,
        logEntryHandler
      }
    },

    cleanupSocket() {
      if (this._socketHandler) {
        const { agentActionHandler, stateChangeHandler, systemMessageHandler, logEntryHandler } = this._socketHandler
        if (agentActionHandler) socket.off('agent_action', agentActionHandler)
        if (stateChangeHandler) socket.off('state_change', stateChangeHandler)
        if (systemMessageHandler) socket.off('system_message', systemMessageHandler)
        if (logEntryHandler) socket.off('log_entry', logEntryHandler)
        this._socketHandler = null
      }
    }
  }
})
