import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '../../stores/chat'
import * as agentsApi from '../../api/agents'

vi.mock('../../api/agents')

describe('chat store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should exist and be a Pinia store', () => {
    expect(useChatStore).toBeDefined()
    const store = useChatStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  describe('state', () => {
    it('should have initial messages array with a welcome message', () => {
      const store = useChatStore()
      expect(store.messages).toBeDefined()
      expect(Array.isArray(store.messages)).toBe(true)
      // Should have at least one welcome message from Orion
      expect(store.messages.length).toBeGreaterThan(0)
      const welcomeMessage = store.messages.find(m => m.sender === 'Orion')
      expect(welcomeMessage).toBeDefined()
    })

    it('should have sending flag set to false initially', () => {
      const store = useChatStore()
      expect(store.sending).toBe(false)
    })

    it('should have error state initially null', () => {
      const store = useChatStore()
      expect(store.error).toBeNull()
    })
  })

  describe('actions', () => {
    it('should have a sendMessage action', () => {
      const store = useChatStore()
      expect(typeof store.sendMessage).toBe('function')
    })

    it('should have an addMessage action', () => {
      const store = useChatStore()
      expect(typeof store.addMessage).toBe('function')
    })

    it('should have a clearHistory action', () => {
      const store = useChatStore()
      expect(typeof store.clearHistory).toBe('function')
    })
  })

  describe('sendMessage integration', () => {
    it('should call API with user message and add Orion response to messages', async () => {
      const mockResponse = { data: { response: 'I am Orion, your assistant.' } }
      agentsApi.chat.mockResolvedValue(mockResponse)

      const store = useChatStore()
      const userMessage = 'Hello, Orion'
      await store.sendMessage(userMessage)

      // Check that API was called with the user message
      expect(agentsApi.chat).toHaveBeenCalledWith(userMessage)
      // Check that the user message was added to the store
      expect(store.messages).toContainEqual(expect.objectContaining({
        sender: 'user',
        content: userMessage
      }))
      // Check that the Orion response was added
      expect(store.messages).toContainEqual(expect.objectContaining({
        sender: 'Orion',
        content: mockResponse.data.response
      }))
      // Sending flag should be false after
      expect(store.sending).toBe(false)
    })

    it('should set sending flag to true while waiting for response', async () => {
      // Create a promise that we can resolve later
      let resolvePromise
      const promise = new Promise(resolve => {
        resolvePromise = () => resolve({ data: { response: 'test' } })
      })
      agentsApi.chat.mockReturnValue(promise)

      const store = useChatStore()
      const userMessage = 'test'
      const sendPromise = store.sendMessage(userMessage)

      // Check that sending is true while the request is in flight
      expect(store.sending).toBe(true)

      // Resolve the promise
      resolvePromise()
      await sendPromise

      // Now sending should be false
      expect(store.sending).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error')
      agentsApi.chat.mockRejectedValue(error)

      const store = useChatStore()
      const userMessage = 'Hello'
      await store.sendMessage(userMessage)

      // Error should be set in state
      expect(store.error).toBe('Failed to send message: Network error')
      // Sending flag should be false
      expect(store.sending).toBe(false)
      // User message should still be added, but no Orion response
      expect(store.messages).toContainEqual(expect.objectContaining({
        sender: 'user',
        content: userMessage
      }))
      // No Orion message added
      const orionMessages = store.messages.filter(m => m.sender === 'Orion')
      expect(orionMessages.length).toBe(1) // only the initial welcome message
    })
  })
})
