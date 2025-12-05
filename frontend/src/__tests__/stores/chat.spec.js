import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '../../stores/chat'
import * as agentsApi from '../../api/agents'

vi.mock('../../api/agents')

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

describe('chat store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
    // Clear all mocks
    vi.clearAllMocks()
    // Clear localStorage mock
    localStorageMock.clear()
    // Set up global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
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

    it('should have isPlanApproved set to false initially', () => {
      const store = useChatStore()
      expect(store.isPlanApproved).toBe(false)
    })
  })

  describe('getters', () => {
    it('isActDisabled should return true when plan is not approved', () => {
      const store = useChatStore()
      store.isPlanApproved = false
      expect(store.isActDisabled).toBe(true)
    })

    it('isActDisabled should return false when plan is approved', () => {
      const store = useChatStore()
      store.isPlanApproved = true
      expect(store.isActDisabled).toBe(false)
    })

    it('lastMessage should return the last message in the array', () => {
      const store = useChatStore()
      const testMessage = { id: 999, sender: 'user', content: 'test', timestamp: new Date() }
      store.messages.push(testMessage)
      expect(store.lastMessage).toEqual(testMessage)
    })

    it('lastMessage should return null if there are no messages', () => {
      const store = useChatStore()
      store.messages = []
      expect(store.lastMessage).toBeNull()
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

    it('should have an approvePlan action', () => {
      const store = useChatStore()
      expect(typeof store.approvePlan).toBe('function')
    })

    it('should have a rejectPlan action', () => {
      const store = useChatStore()
      expect(typeof store.rejectPlan).toBe('function')
    })

    it('should have a clearAll action', () => {
      const store = useChatStore()
      expect(typeof store.clearAll).toBe('function')
    })

    it('should have a saveState action', () => {
      const store = useChatStore()
      expect(typeof store.saveState).toBe('function')
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
      // No Orion message added (except the initial welcome message)
      const orionMessages = store.messages.filter(m => m.sender === 'Orion')
      expect(orionMessages.length).toBe(1) // only the initial welcome message
    })
  })

  describe('plan approval actions', () => {
    it('approvePlan should set isPlanApproved to true and save to localStorage', () => {
      const store = useChatStore()
      store.approvePlan()
      expect(store.isPlanApproved).toBe(true)
      // Check that localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('rejectPlan should set isPlanApproved to false and save to localStorage', () => {
      const store = useChatStore()
      store.isPlanApproved = true
      store.rejectPlan()
      expect(store.isPlanApproved).toBe(false)
      // Check that localStorage.setItem was called
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('persistence', () => {
    it('should load state from localStorage on initialization', () => {
      const savedState = {
        messages: [
          { id: 1, sender: 'user', content: 'saved', timestamp: '2025-01-01T00:00:00.000Z' },
          { id: 2, sender: 'Orion', content: 'response', timestamp: '2025-01-01T00:00:01.000Z' }
        ],
        isPlanApproved: true
      }
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedState))

      const store = useChatStore()
      expect(store.messages).toHaveLength(2)
      expect(store.messages[0].content).toBe('saved')
      expect(store.isPlanApproved).toBe(true)
    })

    it('should handle malformed localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json')

      const store = useChatStore()
      // Should fall back to default state
      expect(store.messages).toHaveLength(1) // the welcome message
      expect(store.isPlanApproved).toBe(false)
    })

    it('should save state when addMessage is called', () => {
      const store = useChatStore()
      store.addMessage({ sender: 'user', content: 'test', timestamp: new Date() })
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('clearAll should reset state and remove localStorage item', () => {
      const store = useChatStore()
      store.clearAll()
      expect(store.messages).toHaveLength(1) // welcome message
      expect(store.isPlanApproved).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })
  })
})
