<template>
  <div class="combined-log-panel h-full flex flex-col bg-bg-elevated border border-line-base rounded-xl shadow-matrix-glow">
    <!-- Tabs -->
    <div class="flex border-b border-line-base">
      <button
        class="flex-1 py-3 px-4 text-sm font-matrix-sans font-medium transition-colors duration-fast"
        :class="activeTab === 'activity' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-layer'"
        @click="activeTab = 'activity'"
      >
        Activity Log
      </button>
      <button
        class="flex-1 py-3 px-4 text-sm font-matrix-sans font-medium transition-colors duration-fast"
        :class="activeTab === 'system' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-layer'"
        @click="activeTab = 'system'"
      >
        System Log
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Activity Log -->
      <div v-if="activeTab === 'activity'" class="h-full">
        <ActivityLog />
      </div>

      <!-- System Log -->
      <div v-else class="h-full">
        <SystemLogPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ActivityLog from './ActivityLog.vue'
import SystemLogPanel from './SystemLogPanel.vue'

const activeTab = ref('activity')
</script>

<style scoped>
.combined-log-panel {
  /* Ensure the panel takes full height of its parent */
  min-height: 0;
}
</style>
