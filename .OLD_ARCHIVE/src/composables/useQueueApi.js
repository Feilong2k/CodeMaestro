// useQueueApi composable for Agent Work Queue integration
// Subtask 2-2-6: Agent Work Queue & Priority Controls

import { ref, reactive, computed } from 'vue'

const API_BASE = '/api/projects'

export default function useQueueApi(projectId) {
  // State
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const hasError = computed(() => error.value !== null)
  const pendingItems = computed(() => items.value.filter(i => i.status === 'pending'))
  const runningItems = computed(() => items.value.filter(i => i.status === 'running'))
  const doneItems = computed(() => items.value.filter(i => i.status === 'done' || i.status === 'canceled'))

  // Helper to build URL
  const buildUrl = (path = '') => `${API_BASE}/${projectId}/queue${path}`

  // Fetch queue items
  const fetchQueue = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl())
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      items.value = data.items || []
      return items.value
    } catch (err) {
      error.value = {
        message: err.message,
        status: err.status
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Enqueue new item
  const enqueue = async (itemData) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl('/enqueue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      // Refresh queue
      await fetchQueue()
      return data
    } catch (err) {
      error.value = {
        message: err.message,
        status: err.status
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update priority
  const updatePriority = async (itemId, priority) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl(`/${itemId}/priority`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      // Refresh queue
      await fetchQueue()
      return data
    } catch (err) {
      error.value = {
        message: err.message,
        status: err.status
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Push item to top
  const pushToTop = async (itemId) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl(`/${itemId}/push-top`), {
        method: 'POST'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      await fetchQueue()
      return data
    } catch (err) {
      error.value = {
        message: err.message,
        status: err.status
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update status
  const updateStatus = async (itemId, status) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(buildUrl(`/${itemId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      await fetchQueue()
      return data
    } catch (err) {
      error.value = {
        message: err.message,
        status: err.status
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    items,
    loading,
    error,
    // Computed
    hasError,
    pendingItems,
    runningItems,
    doneItems,
    // Methods
    fetchQueue,
    enqueue,
    updatePriority,
    pushToTop,
    updateStatus,
    clearError
  }
}
