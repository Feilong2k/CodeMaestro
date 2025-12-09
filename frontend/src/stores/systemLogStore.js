import { defineStore } from 'pinia'

export const useSystemLogStore = defineStore('systemLog', {
  state: () => ({
    connected: false,
    messages: []
  }),

  actions: {
    setConnected(value) {
      this.connected = value
    },

    addMessage(message) {
      this.messages.unshift(message)
    },

    clear() {
      this.messages = []
    }
  },

  getters: {
    formattedMessages: (state) => {
      return state.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }))
    }
  }
})
