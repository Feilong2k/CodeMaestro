import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

/**
 * WebSocket client composable for real-time communication with backend
 */
export function useSocket() {
  const socket = ref(null)
  const isConnected = ref(false)
  const logEntries = ref([])
  const stateChanges = ref([])
  const agentActions = ref([])

  /**
   * Initialize WebSocket connection
   */
  function connect() {
    if (socket.value) {
      console.warn('Socket already connected')
      return
    }

    // Create socket connection
    socket.value = io('http://localhost:4000', {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    })

    // Connection event handlers
    socket.value.on('connect', () => {
      console.log('WebSocket connected:', socket.value.id)
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      console.log('WebSocket disconnected')
      isConnected.value = false
    })

    // Application event handlers
    socket.value.on('state_change', (payload) => {
      console.log('State change:', payload)
      stateChanges.value.unshift({
        ...payload,
        timestamp: new Date(),
        type: 'state_change'
      })
    })

    socket.value.on('agent_action', (payload) => {
      console.log('Agent action:', payload)
      agentActions.value.unshift({
        ...payload,
        timestamp: new Date(),
        type: 'agent_action'
      })
    })

    socket.value.on('log_entry', (payload) => {
      console.log('Log entry:', payload)
      logEntries.value.unshift({
        ...payload,
        timestamp: new Date(),
        type: 'log_entry'
      })
    })

    socket.value.on('error', (payload) => {
      console.error('WebSocket error:', payload)
      logEntries.value.unshift({
        level: 'error',
        message: payload.message || 'Unknown error',
        timestamp: new Date(),
        type: 'error'
      })
    })

    socket.value.on('joined_subtask', (payload) => {
      console.log('Joined subtask:', payload)
    })

    socket.value.on('left_subtask', (payload) => {
      console.log('Left subtask:', payload)
    })
  }

  /**
   * Disconnect WebSocket connection
   */
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  /**
   * Join a subtask room for targeted events
   * @param {string} subtaskId - Subtask ID
   */
  function joinSubtask(subtaskId) {
    if (socket.value && isConnected.value) {
      socket.value.emit('join_subtask', subtaskId)
    }
  }

  /**
   * Leave a subtask room
   * @param {string} subtaskId - Subtask ID
   */
  function leaveSubtask(subtaskId) {
    if (socket.value && isConnected.value) {
      socket.value.emit('leave_subtask', subtaskId)
    }
  }

  /**
   * Emit a state change event (for testing/demo)
   * @param {Object} payload - State change payload
   */
  function emitStateChange(payload) {
    if (socket.value && isConnected.value) {
      socket.value.emit('state_change', payload)
    }
  }

  /**
   * Emit an agent action event (for testing/demo)
   * @param {Object} payload - Agent action payload
   */
  function emitAgentAction(payload) {
    if (socket.value && isConnected.value) {
      socket.value.emit('agent_action', payload)
    }
  }

  /**
   * Emit a log entry event (for testing/demo)
   * @param {Object} payload - Log entry payload
   */
  function emitLogEntry(payload) {
    if (socket.value && isConnected.value) {
      socket.value.emit('log_entry', payload)
    }
  }

  /**
   * Clear all stored events
   */
  function clearEvents() {
    logEntries.value = []
    stateChanges.value = []
    agentActions.value = []
  }

  // Auto-connect when composable is used
  connect()

  // Auto-disconnect when component is unmounted
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    logEntries,
    stateChanges,
    agentActions,
    connect,
    disconnect,
    joinSubtask,
    leaveSubtask,
    emitStateChange,
    emitAgentAction,
    emitLogEntry,
    clearEvents
  }
}
