import { defineStore } from 'pinia'
import * as subtasksApi from '../api/subtasks'
import socket from '../socket/client'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    subtasks: [],
    loading: false,
    error: null,
    // Internal socket handler reference for cleanup
    _socketHandler: null
  }),

  getters: {
    getSubtaskById: (state) => (id) => {
      return state.subtasks.find(subtask => subtask.id === id)
    },

    getSubtasksByStatus: (state) => (status) => {
      return state.subtasks.filter(subtask => subtask.status === status)
    },

    blockedSubtasks(state) {
      // A subtask is blocked if any of its dependencies are not completed
      return state.subtasks.filter(subtask => {
        if (!subtask.dependencies || subtask.dependencies.length === 0) {
          return false
        }
        return subtask.dependencies.some(depId => {
          const dep = state.subtasks.find(s => s.id === depId)
          return !dep || dep.status !== 'completed'
        })
      })
    }
  },

  actions: {
    async fetchSubtasks() {
      this.loading = true
      this.error = null
      try {
        const response = await subtasksApi.list()
        this.subtasks = response.data
      } catch (error) {
        this.error = error.message || 'Failed to fetch subtasks'
        console.error('Error fetching subtasks:', error)
      } finally {
        this.loading = false
      }
    },

    async updateSubtask(id, data) {
      this.error = null
      try {
        const response = await subtasksApi.update(id, data)
        // Update the subtask in the local state
        const index = this.subtasks.findIndex(s => s.id === id)
        if (index !== -1) {
          this.subtasks[index] = { ...this.subtasks[index], ...response.data }
        }
      } catch (error) {
        this.error = error.message || 'Failed to update subtask'
        console.error('Error updating subtask:', error)
      }
    },

    setSubtaskStatus(id, status) {
      const subtask = this.subtasks.find(s => s.id === id)
      if (subtask) {
        subtask.status = status
      }
    },

    // WebSocket integration
    initSocket() {
      // If already initialized, clean up first
      if (this._socketHandler) {
        this.cleanupSocket()
      }
      const handler = (data) => {
        // Handle state_change events
        if (data.id) {
          this.setSubtaskStatus(data.id, data.status)
        }
      }
      socket.on('state_change', handler)
      this._socketHandler = handler
    },

    cleanupSocket() {
      if (this._socketHandler) {
        socket.off('state_change', this._socketHandler)
        this._socketHandler = null
      }
    }
  }
})
