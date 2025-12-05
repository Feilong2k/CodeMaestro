import { defineStore } from 'pinia'
import { chat } from '../api/agents'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [
      {
        id: 1,
        sender: 'Orion',
        content: "Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test.",
        timestamp: new Date()
      }
    ],
    sending: false,
    error: null
  }),

  actions: {
    async sendMessage(content) {
      if (!content.trim()) return

      // Add user message
      this.addMessage({
        sender: 'user',
        content: content.trim(),
        timestamp: new Date()
      })

      // Set sending flag
      this.sending = true
      this.error = null

      try {
        const response = await chat(content)
        // Add Orion's response
        this.addMessage({
          sender: 'Orion',
          content: response.data?.response || 'I received your message.',
          timestamp: new Date()
        })
      } catch (error) {
        this.error = `Failed to send message: ${error.message}`
        console.error('Chat error:', error)
      } finally {
        this.sending = false
      }
    },

    addMessage(message) {
      const id = this.messages.length + 1
      this.messages.push({
        id,
        ...message
      })
    },

    clearHistory() {
      // Keep the initial welcome message
      const welcomeMessage = this.messages.find(m => m.sender === 'Orion' && m.id === 1)
      this.messages = welcomeMessage ? [welcomeMessage] : []
      this.error = null
      this.sending = false
    }
  }
})
