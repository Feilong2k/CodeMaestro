<template>
  <div class="status-bar fixed bottom-0 left-0 right-0 bg-bg-layer border-t border-line-base px-4 py-2 z-40">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Traffic light indicator for agent activity -->
        <TrafficLight :status="trafficLightStatus" />

        <!-- Current state text -->
        <div class="state-text text-sm text-text-secondary font-matrix-sans flex items-center">
          <!-- Connection indicator -->
          <span class="inline-flex items-center">
            <span
              class="w-2 h-2 rounded-full mr-2"
              :class="connectionDotClass"
              :title="connectionStatusText"
            ></span>
            <span class="text-text-primary font-medium">{{ connectionStatusText }}</span>
          </span>
          <span class="mx-2">•</span>
          <!-- Agent status -->
          <span>{{ agentStatusText }}</span>
          <span class="mx-2">•</span>
          <!-- Task status (Clickable) -->
          <button 
            @click="appStore.toggleTaskDashboard()"
            class="hover:text-accent-primary transition-colors focus:outline-none"
            title="View Task Dashboard"
          >
            {{ taskStatusText }}
          </button>
        </div>
      </div>

      <div class="hidden md:flex items-center space-x-4 text-xs text-text-muted font-matrix-mono">
        <span>Last updated: <span class="text-text-secondary">{{ lastUpdatedText }}</span></span>
        <span>•</span>
        <span>Version: <span class="text-text-secondary">0.1.0</span></span>
      </div>
    </div>

    <!-- Task Queue Modal -->
    <div v-if="showTaskQueue" class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showTaskQueue = false">
      <div class="bg-bg-layer border border-line-base rounded-xl p-6 w-full max-w-2xl shadow-matrix-glow-lg max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-text-primary">Task Queue</h3>
          <button @click="showTaskQueue = false" class="text-text-secondary hover:text-text-primary">
            ✕
          </button>
        </div>
        
        <div class="overflow-y-auto flex-1 pr-2 space-y-2">
          <div 
            v-for="task in tasksStore.subtasks" 
            :key="task.id"
            class="p-3 rounded-lg border border-line-base bg-bg-base/50 flex justify-between items-center"
            :class="{ 'border-accent-primary/50': task.status === 'in_progress' }"
          >
            <div>
              <span class="font-mono text-xs text-text-muted mr-2">{{ task.id }}</span>
              <span class="text-text-primary font-medium">{{ task.title }}</span>
            </div>
            <span 
              class="text-xs px-2 py-1 rounded border capitalize"
              :class="{
                'bg-accent-primary/20 text-accent-primary border-accent-primary/30': task.status === 'in_progress',
                'bg-green-500/20 text-green-400 border-green-500/30': task.status === 'completed',
                'bg-bg-layer text-text-secondary border-line-base': task.status === 'pending'
              }"
            >
              {{ task.status.replace('_', ' ') }}
            </span>
          </div>
          
          <div v-if="tasksStore.subtasks.length === 0" class="text-center text-text-muted py-8">
            No tasks in queue.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAgentsStore } from '../stores/agents'
import { useTasksStore } from '../stores/tasks'
import { useAppStore } from '../stores/appStore'
import { useSocket } from '../composables/useSocket'
import TrafficLight from './TrafficLight.vue'

const agentsStore = useAgentsStore()
const tasksStore = useTasksStore()
const appStore = useAppStore()
const socket = useSocket()

const showTaskQueue = ref(false)

// Connection status
const isConnected = computed(() => socket.isConnected)
const connectionStatusText = computed(() => isConnected.value ? 'Connected' : 'Disconnected')
const connectionDotClass = computed(() => isConnected.value ? 'bg-green-500' : 'bg-red-500')

// Agent status
const activeAgents = computed(() => agentsStore.activeAgent)
const agentStatusText = computed(() => {
  if (activeAgents.value.length === 0) {
    return 'All agents idle'
  } else if (activeAgents.value.length === 1) {
    const [agentId] = activeAgents.value[0]
    return `${agentId.charAt(0).toUpperCase() + agentId.slice(1)} active`
  } else {
    // Multiple active agents: show count or names if short
    const agentNames = activeAgents.value.map(([agentId]) => 
      agentId.charAt(0).toUpperCase() + agentId.slice(1)
    )
    // If total length is short, join with commas, else show count
    const joined = agentNames.join(', ')
    if (joined.length <= 30) {
      return `${joined} active`
    } else {
      return `Multiple (${activeAgents.value.length}) active`
    }
  }
})

// Task status
const currentTask = computed(() => {
  const inProgress = tasksStore.getSubtasksByStatus('in_progress')
  return inProgress.length > 0 ? inProgress[0] : null
})
const taskStatusText = computed(() => {
  if (!currentTask.value) {
    return 'No active task'
  }
  return `${currentTask.value.id}: ${currentTask.value.title}`
})

// Traffic light status based on agent activity
const trafficLightStatus = computed(() => {
  if (activeAgents.value.length > 0) {
    return 'active'
  }
  return 'idle'
})

// Last updated text
const lastUpdatedText = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<style scoped>
.status-bar {
  backdrop-filter: blur(8px);
  background-color: rgba(12, 15, 18, 0.85);
}
</style>
