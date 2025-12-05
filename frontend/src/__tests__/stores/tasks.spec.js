import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../../stores/tasks'
import * as subtasksApi from '../../api/subtasks'
import socket from '../../socket/client'

// Mock the API and socket
vi.mock('../../api/subtasks')
vi.mock('../../socket/client')

describe('tasksStore', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
    // reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // ensure any listeners are cleaned up
    if (socket.off) {
      socket.off('state_change')
      socket.off('log_entry')
    }
  })

  it('should exist and be a Pinia store', () => {
    expect(useTasksStore).toBeDefined()
    const store = useTasksStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  describe('initial state', () => {
    it('should have subtasks as an empty array', () => {
      const store = useTasksStore()
      expect(store.subtasks).toEqual([])
    })

    it('should have loading as false', () => {
      const store = useTasksStore()
      expect(store.loading).toBe(false)
    })

    it('should have error as null', () => {
      const store = useTasksStore()
      expect(store.error).toBe(null)
    })
  })

  describe('actions', () => {
    describe('fetchSubtasks', () => {
      it('should fetch subtasks from API and update state', async () => {
        const mockSubtasks = [
          { id: '1', title: 'Task 1', status: 'pending' },
          { id: '2', title: 'Task 2', status: 'completed' }
        ]
        subtasksApi.list.mockResolvedValue({ data: mockSubtasks })

        const store = useTasksStore()
        await store.fetchSubtasks()

        expect(store.loading).toBe(false)
        expect(store.subtasks).toEqual(mockSubtasks)
        expect(store.error).toBe(null)
      })

      it('should set error when API fails', async () => {
        const error = new Error('Network error')
        subtasksApi.list.mockRejectedValue(error)

        const store = useTasksStore()
        await store.fetchSubtasks()

        expect(store.loading).toBe(false)
        expect(store.subtasks).toEqual([])
        expect(store.error).toBe('Network error')
      })

      it('should set loading to true while fetching', async () => {
        let resolvePromise
        const promise = new Promise(resolve => {
          resolvePromise = () => resolve({ data: [] })
        })
        subtasksApi.list.mockReturnValue(promise)

        const store = useTasksStore()
        const fetchPromise = store.fetchSubtasks()
        expect(store.loading).toBe(true)

        resolvePromise()
        await fetchPromise
        expect(store.loading).toBe(false)
      })
    })

    describe('updateSubtask', () => {
      it('should update subtask via API and update local state', async () => {
        const initialSubtasks = [
          { id: '1', title: 'Task 1', status: 'pending' },
          { id: '2', title: 'Task 2', status: 'pending' }
        ]
        const updatedSubtask = { id: '1', title: 'Task 1', status: 'completed' }
        subtasksApi.update.mockResolvedValue({ data: updatedSubtask })

        const store = useTasksStore()
        store.subtasks = initialSubtasks

        await store.updateSubtask('1', { status: 'completed' })

        expect(subtasksApi.update).toHaveBeenCalledWith('1', { status: 'completed' })
        expect(store.subtasks).toEqual([updatedSubtask, initialSubtasks[1]])
        expect(store.error).toBe(null)
      })

      it('should set error when update fails', async () => {
        const error = new Error('Update failed')
        subtasksApi.update.mockRejectedValue(error)

        const store = useTasksStore()
        store.subtasks = [{ id: '1', title: 'Task 1', status: 'pending' }]

        await store.updateSubtask('1', { status: 'completed' })

        expect(store.error).toBe('Update failed')
        // state should remain unchanged
        expect(store.subtasks[0].status).toBe('pending')
      })
    })

    describe('setSubtaskStatus', () => {
      it('should update status of a subtask locally (optimistic update)', () => {
        const initialSubtasks = [
          { id: '1', title: 'Task 1', status: 'pending' },
          { id: '2', title: 'Task 2', status: 'pending' }
        ]
        const store = useTasksStore()
        store.subtasks = initialSubtasks

        store.setSubtaskStatus('1', 'completed')

        expect(store.subtasks[0].status).toBe('completed')
        expect(store.subtasks[1].status).toBe('pending')
      })

      it('should do nothing if subtask not found', () => {
        const store = useTasksStore()
        store.subtasks = [{ id: '1', title: 'Task 1', status: 'pending' }]

        store.setSubtaskStatus('2', 'completed')

        expect(store.subtasks[0].status).toBe('pending')
      })
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      const store = useTasksStore()
      store.subtasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'completed' },
        { id: '3', title: 'Task 3', status: 'pending' }
      ]
    })

    describe('getSubtaskById', () => {
      it('should return subtask by id', () => {
        const store = useTasksStore()
        const subtask = store.getSubtaskById('2')
        expect(subtask).toEqual({ id: '2', title: 'Task 2', status: 'completed' })
      })

      it('should return undefined for non-existent id', () => {
        const store = useTasksStore()
        const subtask = store.getSubtaskById('99')
        expect(subtask).toBeUndefined()
      })
    })

    describe('getSubtasksByStatus', () => {
      it('should return subtasks filtered by status', () => {
        const store = useTasksStore()
        const pending = store.getSubtasksByStatus('pending')
        expect(pending).toHaveLength(2)
        expect(pending.map(t => t.id)).toEqual(['1', '3'])
      })

      it('should return empty array if no matching status', () => {
        const store = useTasksStore()
        const cancelled = store.getSubtasksByStatus('cancelled')
        expect(cancelled).toEqual([])
      })
    })

    describe('blockedSubtasks', () => {
      it('should return subtasks that are blocked by dependencies', () => {
        const store = useTasksStore()
        // Add dependencies to some subtasks
        store.subtasks = [
          { id: '1', title: 'Task 1', status: 'pending', dependencies: [] },
          { id: '2', title: 'Task 2', status: 'pending', dependencies: ['1'] },
          { id: '3', title: 'Task 3', status: 'pending', dependencies: ['2'] },
          { id: '4', title: 'Task 4', status: 'pending', dependencies: [] }
        ]
        // Mark task 1 as completed
        store.setSubtaskStatus('1', 'completed')
        // Now task 2 is no longer blocked, task 3 is still blocked by task 2
        const blocked = store.blockedSubtasks
        expect(blocked).toHaveLength(1)
        expect(blocked[0].id).toBe('3')
      })
    })
  })

  describe('WebSocket integration', () => {
    it('should subscribe to state_change events when initSocket is called', () => {
      const store = useTasksStore()
      store.initSocket()
      expect(socket.on).toHaveBeenCalledWith('state_change', expect.any(Function))
    })

    it('should update subtask when state_change event is received', () => {
      const store = useTasksStore()
      store.initSocket()
      store.subtasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'pending' }
      ]
      // Get the handler that was registered
      const handler = socket.on.mock.calls.find(call => call[0] === 'state_change')[1]
      // Simulate event
      handler({ id: '1', status: 'completed' })
      // Check that the local state was updated
      expect(store.subtasks[0].status).toBe('completed')
    })

    it('should unsubscribe from socket events when cleanupSocket is called', () => {
      const store = useTasksStore()
      store.initSocket()
      // Get the handler that was registered
      const handler = socket.on.mock.calls.find(call => call[0] === 'state_change')[1]
      // Simulate cleanup
      store.cleanupSocket()
      // The store should have unsubscribed
      expect(socket.off).toHaveBeenCalledWith('state_change', handler)
    })
  })
})
