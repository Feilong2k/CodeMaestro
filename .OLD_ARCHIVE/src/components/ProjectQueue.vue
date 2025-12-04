<template>
  <div class="project-queue">
    <div class="queue-header">
      <h2>Agent Work Queue</h2>
      <div class="project-info" v-if="projectId">
        Project: <code>{{ projectId }}</code>
      </div>
    </div>

    <div class="queue-controls">
      <button @click="fetchQueue" :disabled="loading">
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
      <button @click="showEnqueueForm = !showEnqueueForm">
        {{ showEnqueueForm ? 'Cancel' : 'Enqueue' }}
      </button>
    </div>

    <div v-if="error" class="error-banner">
      {{ error.message }}
      <button @click="clearError">Dismiss</button>
    </div>

    <div v-if="showEnqueueForm" class="enqueue-form">
      <h3>Enqueue New Task</h3>
      <form @submit.prevent="handleEnqueue">
        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" v-model="newItem.role" required>
            <option value="developer">Developer</option>
            <option value="tester">Tester</option>
            <option value="orchestrator">Orchestrator</option>
          </select>
        </div>
        <div class="form-group">
          <label for="title">Title</label>
          <input id="title" v-model="newItem.title" required placeholder="Task description" />
        </div>
        <div class="form-group">
          <label for="taskId">Task ID (optional)</label>
          <input id="taskId" v-model="newItem.taskId" placeholder="e.g., 2-2-3" />
        </div>
        <div class="form-group">
          <label for="priority">Priority (optional)</label>
          <input id="priority" type="number" v-model.number="newItem.priority" placeholder="0" />
        </div>
        <button type="submit" :disabled="loading">Enqueue</button>
      </form>
    </div>

    <div class="queue-stats">
      <span>Pending: {{ pendingItems.length }}</span>
      <span>Running: {{ runningItems.length }}</span>
      <span>Done/Canceled: {{ doneItems.length }}</span>
    </div>

    <div class="queue-list">
      <div v-if="items.length === 0" class="empty-queue">
        No items in queue.
      </div>
      <div v-for="item in items" :key="item.id" class="queue-item" :class="item.status">
        <div class="item-header">
          <span class="item-title">{{ item.title }}</span>
          <span class="item-priority">Priority: {{ item.priority }}</span>
        </div>
        <div class="item-details">
          <span class="item-role">{{ item.role }}</span>
          <span class="item-status">{{ item.status }}</span>
          <span class="item-id">{{ item.id.slice(0, 8) }}</span>
        </div>
        <div class="item-actions">
          <button @click="pushToTop(item.id)" :disabled="loading">Push to Top</button>
          <select v-model="selectedStatus[item.id]" @change="updateStatus(item.id, selectedStatus[item.id])">
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
          <input type="number" v-model.number="newPriority[item.id]" placeholder="New priority" />
          <button @click="updatePriority(item.id, newPriority[item.id])" :disabled="loading">Set</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import useQueueApi from '../composables/useQueueApi.js'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const {
  items,
  loading,
  error,
  pendingItems,
  runningItems,
  doneItems,
  fetchQueue,
  enqueue,
  updatePriority,
  pushToTop,
  updateStatus,
  clearError
} = useQueueApi(props.projectId)

const showEnqueueForm = ref(false)
const newItem = reactive({
  role: 'developer',
  title: '',
  taskId: '',
  priority: 0
})
const selectedStatus = reactive({})
const newPriority = reactive({})

onMounted(() => {
  fetchQueue()
})

const handleEnqueue = async () => {
  try {
    await enqueue(newItem)
    showEnqueueForm.value = false
    newItem.title = ''
    newItem.taskId = ''
    newItem.priority = 0
  } catch (err) {
    // error handled by composable
  }
}

const handleUpdatePriority = async (itemId, priority) => {
  if (typeof priority !== 'number') return
  await updatePriority(itemId, priority)
}

const handleUpdateStatus = async (itemId, status) => {
  await updateStatus(itemId, status)
}
</script>

<style scoped>
.project-queue {
  background: var(--bg-elevated);
  border: 1px solid var(--line-base);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin: 1rem 0;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.queue-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.queue-controls button {
  padding: 0.5rem 1rem;
  background: var(--accent-primary);
  color: var(--bg-base);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.queue-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-banner {
  background: #ff6b6b;
  color: white;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.enqueue-form {
  background: var(--bg-subtle);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  background: var(--bg-layer);
  border: 1px solid var(--line-base);
  border-radius: 4px;
  color: var(--text-primary);
}

.queue-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: var(--text-muted);
}

.queue-item {
  background: var(--bg-layer);
  border: 1px solid var(--line-base);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.queue-item.running {
  border-left: 4px solid var(--accent-primary);
}

.queue-item.done,
.queue-item.canceled {
  opacity: 0.7;
}

.item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.item-title {
  font-weight: bold;
  color: var(--text-primary);
}

.item-priority {
  color: var(--accent-secondary);
}

.item-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.item-actions button,
.item-actions select,
.item-actions input {
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.empty-queue {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}
</style>
