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
          @click="clearActivity"
          class="px-2 py-1 text-xs rounded bg-bg-elevated border border-line-base text-text-secondary hover:bg-bg-elevated/80 font-matrix-mono"
          :disabled="activityItems.length === 0"
        >
          Clear
        </button>
      </div>
    </div>

    <div v-if="activityItems.length === 0" class="text-center py-8">
      <p class="text-text-muted font-matrix-sans">Waiting for activity...</p>
      <p class="text-xs text-text-muted/50 font-matrix-mono mt-2">Agent actions will appear here in real-time</p>
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
import { computed, onMounted, onUnmounted } from 'vue'
import ActivityRow from './ActivityRow.vue'
import { useAgentsStore } from '../stores/agents'

const agentsStore = useAgentsStore()

// Initialize WebSocket connection for agent actions
onMounted(() => {
  agentsStore.initSocket()
})

// Clean up WebSocket connection
onUnmounted(() => {
  agentsStore.cleanupSocket()
})

const isConnected = computed(() => {
  // For now, we assume connection is always active when socket is initialized.
  // In a real app, we might want to track connection status via the socket client.
  return true
})

const activityItems = computed(() => {
  // Get recent activities from the agents store (most recent first)
  const recentActivities = agentsStore.recentActivity(50) // Show up to 50 most recent
  return recentActivities.map((activity, index) => ({
    id: `activity-${index}-${activity.timestamp.getTime()}`,
    agent: activity.agent,
    avatarBg: getAvatarBg(activity.agent),
    avatarText: getAvatarText(activity.agent),
    description: formatDescription(activity),
    status: getStatus(activity.action),
    timeAgo: formatTimeAgo(activity.timestamp)
  }))
})

function formatDescription(activity) {
  if (activity.action && activity.taskId) {
    return `${activity.agent}: ${activity.action} (${activity.taskId})`
  } else if (activity.action) {
    return `${activity.agent}: ${activity.action}`
  } else {
    return `${activity.agent}: Unknown action`
  }
}

function getStatus(action) {
  if (action.includes('completed') || action.includes('finished')) {
    return 'Completed'
  } else if (action.includes('started') || action.includes('began')) {
    return 'Active'
  } else if (action.includes('error') || action.includes('failed')) {
    return 'Error'
  } else {
    return 'Info'
  }
}

function getAvatarBg(agent) {
  switch (agent.toLowerCase()) {
    case 'orion': return 'bg-accent-primary'
    case 'tara': return 'bg-accent-secondary'
    case 'devon': return 'bg-accent-tertiary'
    default: return 'bg-accent-primary'
  }
}

function getAvatarText(agent) {
  return agent.charAt(0).toUpperCase()
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

function clearActivity() {
  // Clear the activity history in the agents store
  agentsStore.activityHistory = []
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
