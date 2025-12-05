<template>
  <div class="activity-log bg-bg-layer border border-line-base rounded-xl p-4 shadow-matrix-glow">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-text-primary font-matrix-sans">Activity Log</h3>
      <div class="flex items-center space-x-2">
        <span
          v-if="!isConnected"
          class="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning font-matrix-mono"
        >
          Disconnected
        </span>
        <span
          v-else
          class="px-2 py-1 text-xs rounded-full bg-success/10 text-success font-matrix-mono"
        >
          Live
        </span>
        <button
          @click="clearEvents"
          class="px-2 py-1 text-xs rounded bg-bg-elevated border border-line-base text-text-secondary hover:bg-bg-elevated/80 font-matrix-mono"
        >
          Clear
        </button>
      </div>
    </div>

    <div v-if="activityItems.length === 0" class="text-center py-8">
      <p class="text-text-muted font-matrix-sans">Waiting for activity...</p>
      <p class="text-xs text-text-muted/50 font-matrix-mono mt-2">Events will appear here in real-time</p>
    </div>

    <div v-else class="activity-list space-y-2 max-h-[300px] overflow-y-auto pr-2">
      <ActivityRow
        v-for="item in activityItems"
        :key="item.id"
        :agent="item.agent"
        :avatar-bg="item.avatarBg"
        :avatar-text="item.avatarText"
        :description="item.description"
        :status="item.status"
        :time-ago="item.timeAgo"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ActivityRow from './ActivityRow.vue'
import { useSocket } from '../composables/useSocket'

const {
  isConnected,
  logEntries,
  stateChanges,
  agentActions,
  clearEvents
} = useSocket()

// Generate unique ID for each activity item
let itemCounter = 0

const activityItems = computed(() => {
  const items = []

  // Process log entries
  logEntries.value.forEach(entry => {
    items.push({
      id: `log-${++itemCounter}`,
      agent: getAgentFromLog(entry),
      avatarBg: getAvatarBg(getAgentFromLog(entry)),
      avatarText: getAvatarText(getAgentFromLog(entry)),
      description: entry.message,
      status: entry.level,
      timeAgo: formatTimeAgo(entry.timestamp)
    })
  })

  // Process state changes
  stateChanges.value.forEach(change => {
    items.push({
      id: `state-${++itemCounter}`,
      agent: 'System',
      avatarBg: 'bg-accent-primary',
      avatarText: 'S',
      description: `State change: ${change.subtaskId} from ${change.from} to ${change.to}`,
      status: 'Transition',
      timeAgo: formatTimeAgo(change.timestamp)
    })
  })

  // Process agent actions
  agentActions.value.forEach(action => {
    items.push({
      id: `action-${++itemCounter}`,
      agent: action.agent,
      avatarBg: getAvatarBg(action.agent),
      avatarText: getAvatarText(action.agent),
      description: `Action: ${action.action}`,
      status: 'Active',
      timeAgo: formatTimeAgo(action.timestamp)
    })
  })

  // Sort by timestamp (newest first)
  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

function getAgentFromLog(entry) {
  // Try to extract agent from log message
  const message = entry.message || ''
  if (message.includes('Orion')) return 'Orion'
  if (message.includes('Tara')) return 'Tara'
  if (message.includes('Devon')) return 'Devon'
  return 'System'
}

function getAvatarBg(agent) {
  switch (agent) {
    case 'Orion': return 'bg-accent-primary'
    case 'Tara': return 'bg-accent-secondary'
    case 'Devon': return 'bg-accent-tertiary'
    default: return 'bg-accent-primary'
  }
}

function getAvatarText(agent) {
  return agent.charAt(0)
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
</script>

<style scoped>
.activity-log {
  min-height: 200px;
}

/* Custom scrollbar */
.activity-list::-webkit-scrollbar {
  width: 6px;
}

.activity-list::-webkit-scrollbar-track {
  background: transparent;
}

.activity-list::-webkit-scrollbar-thumb {
  background: rgba(100, 255, 100, 0.2);
  border-radius: 3px;
}

.activity-list::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 255, 100, 0.4);
}
</style>
