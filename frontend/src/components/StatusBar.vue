<template>
  <div class="status-bar fixed bottom-0 left-0 right-0 bg-bg-layer border-t border-line-base px-4 py-2 z-40">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Traffic light indicator -->
        <TrafficLight status="idle" />

        <!-- Current state text -->
        <div class="state-text text-sm text-text-secondary font-matrix-sans">
          <span class="text-text-primary font-medium">System Idle</span>
          <span class="mx-2">•</span>
          <span>All agents operational</span>
        </div>
      </div>

      <div class="hidden md:flex items-center space-x-4 text-xs text-text-muted font-matrix-mono">
        <span>Last updated: <span class="text-text-secondary">Just now</span></span>
        <span>•</span>
        <span>Version: <span class="text-text-secondary">0.1.0</span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import TrafficLight from './TrafficLight.vue'
</script>

<style scoped>
.status-bar {
  backdrop-filter: blur(8px);
  background-color: rgba(12, 15, 18, 0.85);
}
</style>
