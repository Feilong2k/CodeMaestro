<template>
  <div class="activity-log bg-bg-layer border border-line-base rounded-xl p-4 shadow-matrix-glow">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-text-primary font-matrix-sans">Activity Log</h3>
      <span class="text-xs text-text-muted font-matrix-mono">Real-time</span>
    </div>

    <div class="activity-list space-y-2">
      <ActivityRow
        agent="Orion"
        avatar-bg="bg-accent-primary"
        avatar-text="O"
        description="Planning Phase 1 tasks"
        status="Planning"
        time-ago="2m ago"
      />
      <ActivityRow
        agent="Tara"
        avatar-bg="bg-accent-secondary"
        avatar-text="T"
        description="Reviewing test suite"
        status="Pending"
        time-ago="5m ago"
      />
      <ActivityRow
        agent="Devon"
        avatar-bg="bg-accent-tertiary"
        avatar-text="D"
        description="Implementing components"
        status="Coding"
        time-ago="10m ago"
      />
    </div>
  </div>
</template>

<script setup>
import ActivityRow from './ActivityRow.vue'
</script>

<style scoped>
.activity-log {
  min-height: 200px;
}
</style>
