import { defineStore } from 'pinia'
import { chat } from '../api/agents'
import { classifyMessage } from '../api/router'

// LocalStorage key for persistence
const CHAT_STORAGE_KEY = 'codemaestro_chat'

// Helper to save chat state to localStorage
function saveToStorage(state) {
  try {
    const serialized = JSON.stringify({
      messages: state.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
      })),
      isPlanApproved: state.isPlanApproved
    })
    localStorage.setItem(CHAT_STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save chat to localStorage:', error)
  }
}

// Helper to load chat state from localStorage
function loadFromStorage() {
  try {
    const serialized = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!serialized) return null

    const data = JSON.parse(serialized)
    return {
      messages: data.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        typingEffect: false // Disable typing effect for loaded messages
      })),
      isPlanApproved: data.isPlanApproved || false
    }
  } catch (error) {
    console.error('Failed to load chat from localStorage:', error)
    return null
  }
}

export const useChatStore = defineStore('chat', {
  state: () => {
    // Try to load from localStorage first
    const saved = loadFromStorage()
    
    return {
      messages: saved?.messages || [
        {
          id: 1,
          sender: 'Orion',
          content: "Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test.",
          timestamp: new Date()
        }
      ],
      sending: false,
      error: null,
      isPlanApproved: saved?.isPlanApproved || false
    }
  },

  getters: {
    // Check if Act button should be disabled
    isActDisabled: (state) => !state.isPlanApproved,
    
    // Get the last message for typing effect
    lastMessage: (state) => state.messages.length > 0 ? state.messages[state.messages.length - 1] : null
  },

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
        // 1. Classify the message to determine mode (Strategic vs Tactical)
        let mode = 'tactical' // Default
        try {
          const routeRes = await classifyMessage(content)
          if (routeRes.data && routeRes.data.mode) {
            mode = routeRes.data.mode
          }
          console.log(`[Chat] Routing message via mode: ${mode.toUpperCase()}`)
        } catch (routeErr) {
          console.warn('[Chat] Routing failed, defaulting to tactical:', routeErr)
        }

        // 2. Send message with the determined mode
        const response = await chat(content, mode)
        
        // Add Orion's response
        this.addMessage({
          sender: 'Orion',
          content: response.data?.response || 'I received your message.',
          timestamp: new Date(),
          typingEffect: true,
          mode: mode // Optional: store mode to display icon/badge later
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
      const newMessage = {
        id,
        ...message
      }
      this.messages.push(newMessage)
      
      // Auto-save to localStorage
      this.saveState()
      
      return newMessage
    },

    clearHistory() {
      // Keep the initial welcome message
      const welcomeMessage = this.messages.find(m => m.sender === 'Orion' && m.id === 1)
      this.messages = welcomeMessage ? [welcomeMessage] : []
      this.error = null
      this.sending = false
      
      // Save cleared state
      this.saveState()
    },

    // Save current state to localStorage
    saveState() {
      saveToStorage({
        messages: this.messages,
        isPlanApproved: this.isPlanApproved
      })
    },

    // Toggle plan approval (for Act blocking)
    approvePlan() {
      this.isPlanApproved = true
      this.saveState()
    },

    rejectPlan() {
      this.isPlanApproved = false
      this.saveState()
    },

    // Clear all data including localStorage
    clearAll() {
      this.messages = [
        {
          id: 1,
          sender: 'Orion',
          content: "Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test.",
          timestamp: new Date()
        }
      ]
      this.sending = false
      this.error = null
      this.isPlanApproved = false
      
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY)
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
    }
  }
})
