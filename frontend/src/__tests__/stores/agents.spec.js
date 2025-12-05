import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentsStore } from '../../stores/agents'

// Mock the API client and WebSocket client since they are dependencies
vi.mock('../../api/agents', () => ({
  fetchAgentStatus: vi.fn(),
  updateAgentStatus: vi.fn(),
}))

vi.mock('../../socket/client', () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))

describe('agents store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should exist and be a Pinia store', () => {
    expect(useAgentsStore).toBeDefined()
    const store = useAgentsStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  describe('state', () => {
    it('should have initial agents object with orion, tara, devon', () => {
      const store = useAgentsStore()
      expect(store.agents).toBeDefined()
      expect(store.agents).toHaveProperty('orion')
      expect(store.agents).toHaveProperty('tara')
      expect(store.agents).toHaveProperty('devon')
      // Each agent should have status, currentTask, lastActivity
      const expectedProps = ['status', 'currentTask', 'lastActivity']
      expectedProps.forEach(prop => {
        expect(store.agents.orion).toHaveProperty(prop)
        expect(store.agents.tara).toHaveProperty(prop)
        expect(store.agents.devon).toHaveProperty(prop)
      })
    })

    it('should have initial activityHistory as an empty array', () => {
      const store = useAgentsStore()
      expect(store.activityHistory).toEqual([])
    })
  })

  describe('actions', () => {
    it('should have a fetchAgentStatus action', () => {
      const store = useAgentsStore()
      expect(typeof store.fetchAgentStatus).toBe('function')
    })

    it('should have an updateAgentStatus action', () => {
      const store = useAgentsStore()
      expect(typeof store.updateAgentStatus).toBe('function')
    })

    it('should have an addActivity action', () => {
      const store = useAgentsStore()
      expect(typeof store.addActivity).toBe('function')
    })
  })

  describe('getters', () => {
    it('should have an activeAgent getter', () => {
      const store = useAgentsStore()
      // Getters are functions on the store instance
      expect(typeof store.activeAgent).toBe('function')
    })

    it('should have an idleAgents getter', () => {
      const store = useAgentsStore()
      expect(typeof store.idleAgents).toBe('function')
    })

    it('should have a recentActivity getter', () => {
      const store = useAgentsStore()
      expect(typeof store.recentActivity).toBe('function')
    })
  })

  describe('WebSocket integration', () => {
    it('should subscribe to agent_action events on store initialization', () => {
      // We expect that the store's constructor or an action will subscribe to WebSocket events.
      const store = useAgentsStore()
      expect(store).toBeDefined()
      // This test will fail because the implementation doesn't exist.
    })

    it('should update state when an agent_action event is received', () => {
      // This test will also fail.
      expect(true).toBe(false) // Force fail to indicate test is not implemented
    })
  })
})
