import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '../../stores/chat'

// Mock the API client for Orion chat
vi.mock('../../api/agents', () => ({
  sendMessageToOrion: vi.fn()
}))

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
      // This test will fail because the implementation doesn't exist yet.
      // We are in Red phase, so that's okay.
      expect(true).toBe(false)
    })

    it('should set sending flag to true while waiting for response', async () => {
      // This test will also fail.
      expect(true).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      // This test will also fail.
      expect(true).toBe(false)
    })
  })
})
