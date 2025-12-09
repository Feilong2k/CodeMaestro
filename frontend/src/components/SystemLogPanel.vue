<template>
  <div class="system-log-panel h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-text-primary font-matrix-sans">System Log</h2>
      <div class="flex items-center space-x-2">
        <span class="text-xs text-text-tertiary font-matrix-mono">WebSocket Status:</span>
        <span :class="['w-2 h-2 rounded-full', wsConnected ? 'bg-green-500' : 'bg-red-500']"></span>
        <span class="text-xs text-text-tertiary font-matrix-mono">{{ wsConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto bg-bg-layer border border-line-base rounded-lg p-4">
      <ul class="space-y-2">
        <li v-for="(msg, index) in messages" :key="index" class="text-sm font-matrix-mono" :class="getMessageClass(msg.level)">
          <span class="text-text-tertiary">[{{ msg.timestamp }}]</span>
          <span class="ml-2">{{ msg.text }}</span>
        </li>
      </ul>
      <p v-if="messages.length === 0" class="text-text-tertiary text-sm font-matrix-mono">No system messages yet.</p>
    </div>
    <div class="mt-4 flex items-center justify-between text-xs text-text-tertiary font-matrix-mono">
      <div>Total messages: {{ messages.length }}</div>
      <button @click="clearMessages" class="px-2 py-1 border border-line-base rounded hover:bg-bg-layer transition">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const wsConnected = ref(true) // placeholder, will be replaced with real WebSocket status

const messages = ref([
  { timestamp: '10:33:45', level: 'info', text: 'System initialized' },
  { timestamp: '10:33:50', level: 'info', text: 'WebSocket connected' },
  { timestamp: '10:34:00', level: 'warn', text: 'Agent Orion started a new subtask' },
  { timestamp: '10:34:10', level: 'info', text: 'Tool execution: FileSystemTool' },
])

function getMessageClass(level) {
  return {
    'text-text-primary': level === 'info',
    'text-yellow-500': level === 'warn',
    'text-red-500': level === 'error',
  }
}

function clearMessages() {
  messages.value = []
}
</script>

<style scoped>
.system-log-panel {
  /* Ensure the panel takes full height and scrolls internally */
  min-height: 0;
}
</style>
