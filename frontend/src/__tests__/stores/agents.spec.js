import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentsStore } from '../../stores/agents'
import * as agentsApi from '../../api/agents'
import socket from '../../socket/client'

// Mock the API and socket
vi.mock('../../api/agents')
vi.mock('../../socket/client')

describe('agentsStore', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
    // reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // ensure any listeners are cleaned up
    if (socket.off) {
      socket.off('agent_action')
    }
  })

  it('should exist and be a Pinia store', () => {
    expect(useAgentsStore).toBeDefined()
    const store = useAgentsStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  describe('initial state', () => {
    it('should have agents object with orion, tara, and devon', () => {
      const store = useAgentsStore()
      expect(store.agents).toEqual({
        orion: { status: 'idle', currentTask: null, lastActivity: null },
        tara: { status: 'idle', currentTask: null, lastActivity: null },
        devon: { status: 'idle', currentTask: null, lastActivity: null }
      })
    })

    it('should have activityHistory as an empty array', () => {
      const store = useAgentsStore()
      expect(store.activityHistory).toEqual([])
    })
  })

  describe('actions', () => {
    describe('fetchAgentStatus', () => {
      it('should fetch agent status from API and update state', async () => {
        const mockStatus = {
          orion: { status: 'active', currentTask: '3-4', lastActivity: '2025-12-05T10:00:00Z' },
          tara: { status: 'idle', currentTask: null, lastActivity: '2025-12-05T09:30:00Z' },
          devon: { status: 'active', currentTask: '3-3', lastActivity: '2025-12-05T10:15:00Z' }
        }
        agentsApi.getStatus.mockResolvedValue({ data: mockStatus })

        const store = useAgentsStore()
        await store.fetchAgentStatus()

        expect(agentsApi.getStatus).toHaveBeenCalled()
        expect(store.agents).toEqual(mockStatus)
      })

      it('should handle API errors gracefully', async () => {
        const error = new Error('Network error')
        agentsApi.getStatus.mockRejectedValue(error)

        const store = useAgentsStore()
        await store.fetchAgentStatus()

        expect(agentsApi.getStatus).toHaveBeenCalled()
        // State should remain unchanged (initial state)
        expect(store.agents.orion.status).toBe('idle')
      })
    })

    describe('updateAgentStatus', () => {
      it('should update agent status locally', () => {
        const store = useAgentsStore()
        store.updateAgentStatus('orion', 'active', '3-4')

        expect(store.agents.orion.status).toBe('active')
        expect(store.agents.orion.currentTask).toBe('3-4')
        expect(store.agents.orion.lastActivity).toBeInstanceOf(Date)
        // Other agents should remain unchanged
        expect(store.agents.tara.status).toBe('idle')
        expect(store.agents.devon.status).toBe('idle')
      })

      it('should update lastActivity when status changes', () => {
        const store = useAgentsStore()
        const beforeUpdate = new Date()
        store.updateAgentStatus('tara', 'active', 'testing')
        const afterUpdate = new Date()

        expect(store.agents.tara.lastActivity).toBeInstanceOf(Date)
        const activityTime = store.agents.tara.lastActivity.getTime()
        expect(activityTime).toBeGreaterThanOrEqual(beforeUpdate.getTime())
        expect(activityTime).toBeLessThanOrEqual(afterUpdate.getTime())
      })
    })

    describe('addActivity', () => {
      it('should add activity to activityHistory', () => {
        const store = useAgentsStore()
        const activity = {
          agent: 'orion',
          action: 'started_task',
          taskId: '3-4',
          timestamp: new Date()
        }

        store.addActivity(activity)

        expect(store.activityHistory).toHaveLength(1)
        expect(store.activityHistory[0]).toEqual(activity)
      })

      it('should limit activityHistory to 50 items', () => {
        const store = useAgentsStore()
        const activity = {
          agent: 'orion',
          action: 'test',
          taskId: 'test',
          timestamp: new Date()
        }

        // Add 51 activities
        for (let i = 0; i < 51; i++) {
          store.addActivity({ ...activity, action: `action_${i}` })
        }

        expect(store.activityHistory).toHaveLength(50)
        expect(store.activityHistory[0].action).toBe('action_1') // First one should be removed
        expect(store.activityHistory[49].action).toBe('action_50') // Last one should be the most recent
      })
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      const store = useAgentsStore()
      store.agents = {
        orion: { status: 'active', currentTask: '3-4', lastActivity: new Date() },
        tara: { status: 'idle', currentTask: null, lastActivity: new Date('2025-12-05T09:00:00Z') },
        devon: { status: 'active', currentTask: '3-3', lastActivity: new Date() }
      }
      store.activityHistory = [
        { agent: 'orion', action: 'started', taskId: '3-4', timestamp: new Date('2025-12-05T10:00:00Z') },
        { agent: 'tara', action: 'tested', taskId: '3-3', timestamp: new Date('2025-12-05T10:05:00Z') },
        { agent: 'devon', action: 'committed', taskId: '3-3', timestamp: new Date('2025-12-05T10:10:00Z') }
      ]
    })

    describe('activeAgent', () => {
      it('should return agents with active status', () => {
        const store = useAgentsStore()
        const active = store.activeAgent
        expect(active).toHaveLength(2)
        expect(active.map(a => a[0])).toEqual(['orion', 'devon'])
      })

      it('should return empty array if no active agents', () => {
        const store = useAgentsStore()
        store.agents.orion.status = 'idle'
        store.agents.devon.status = 'idle'
        const active = store.activeAgent
        expect(active).toEqual([])
      })
    })

    describe('idleAgents', () => {
      it('should return agents with idle status', () => {
        const store = useAgentsStore()
        const idle = store.idleAgents
        expect(idle).toHaveLength(1)
        expect(idle.map(a => a[0])).toEqual(['tara'])
      })

      it('should return all agents if all are idle', () => {
        const store = useAgentsStore()
        store.agents.orion.status = 'idle'
        store.agents.devon.status = 'idle'
        const idle = store.idleAgents
        expect(idle).toHaveLength(3)
        expect(idle.map(a => a[0])).toEqual(['orion', 'tara', 'devon'])
      })
    })

    describe('recentActivity', () => {
      it('should return recent activities (default 10)', () => {
        const store = useAgentsStore()
        // Add more activities to test limit
        for (let i = 0; i < 15; i++) {
          store.addActivity({
            agent: 'orion',
            action: `action_${i}`,
            taskId: 'test',
            timestamp: new Date()
          })
        }
        const recent = store.recentActivity()
        expect(recent).toHaveLength(10)
        // We added 15 new activities, plus 3 in beforeEach = 18 total
        // recentActivity returns most recent first, so:
        // action_14 (most recent), action_13, ..., action_5 (10th most recent)
        expect(recent[0].action).toBe('action_14')
        expect(recent[9].action).toBe('action_5')
      })

      it('should return specified number of activities', () => {
        const store = useAgentsStore()
        const recent = store.recentActivity(2)
        expect(recent).toHaveLength(2)
        // Most recent first: committed (added in beforeEach), then tested
        expect(recent[0].action).toBe('committed')
        expect(recent[1].action).toBe('tested')
      })
    })
  })

  describe('WebSocket integration', () => {
    it('should subscribe to agent_action events when initSocket is called', () => {
      const store = useAgentsStore()
      store.initSocket()
      expect(socket.on).toHaveBeenCalledWith('agent_action', expect.any(Function))
    })

    it('should update agent state when agent_action event is received', () => {
      const store = useAgentsStore()
      store.initSocket()
      // Get the handler that was registered
      const handler = socket.on.mock.calls.find(call => call[0] === 'agent_action')[1]
      // Simulate event
      handler({
        agent: 'orion',
        action: 'status_change',
        status: 'active',
        taskId: '3-4',
        timestamp: '2025-12-05T10:30:00Z'
      })
      // Check that the agent was updated
      expect(store.agents.orion.status).toBe('active')
      expect(store.agents.orion.currentTask).toBe('3-4')
      expect(store.agents.orion.lastActivity).toBeInstanceOf(Date)
    })

    it('should add activity when agent_action event is received', () => {
      const store = useAgentsStore()
      store.initSocket()
      const handler = socket.on.mock.calls.find(call => call[0] === 'agent_action')[1]
      handler({
        agent: 'tara',
        action: 'test_completed',
        taskId: '3-3',
        timestamp: '2025-12-05T10:35:00Z'
      })
      expect(store.activityHistory).toHaveLength(1)
      expect(store.activityHistory[0].agent).toBe('tara')
      expect(store.activityHistory[0].action).toBe('test_completed')
    })

    it('should unsubscribe from socket events when cleanupSocket is called', () => {
      const store = useAgentsStore()
      store.initSocket()
      // Get the handler that was registered
      const handler = socket.on.mock.calls.find(call => call[0] === 'agent_action')[1]
      // Simulate cleanup
      store.cleanupSocket()
      // The store should have unsubscribed
      expect(socket.off).toHaveBeenCalledWith('agent_action', handler)
    })
  })
})
