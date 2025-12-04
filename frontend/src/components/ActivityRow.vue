<template>
  <div
    class="activity-row flex items-center justify-between p-3 rounded-lg bg-bg-elevated border border-line-base/50 hover:bg-bg-elevated/80 transition-colors duration-fast"
    :data-agent="agent"
  >
    <div class="flex items-center space-x-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center shadow-matrix-glow"
        :class="avatarBg"
      >
        <span class="text-bg-base font-bold text-sm">{{ avatarText }}</span>
      </div>
      <div>
        <div class="font-medium text-text-primary font-matrix-sans">{{ agent }}</div>
        <div class="text-sm text-text-secondary font-matrix-sans">{{ description }}</div>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <span
        class="px-2 py-1 text-xs rounded-full font-matrix-mono"
        :class="statusClasses"
      >
        {{ status }}
      </span>
      <span class="text-xs text-text-muted font-matrix-mono">{{ timeAgo }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  agent: {
    type: String,
    required: true
  },
  avatarBg: {
    type: String,
    default: 'bg-accent-primary'
  },
  avatarText: {
    type: String,
    default: 'O'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  timeAgo: {
    type: String,
    required: true
  }
})

const statusClasses = computed(() => {
  const base = 'bg-accent-primary/10 text-accent-primary'
  if (props.agent === 'Tara') {
    return 'bg-accent-secondary/10 text-accent-secondary'
  } else if (props.agent === 'Devon') {
    return 'bg-accent-tertiary/10 text-accent-tertiary'
  }
  return base
})
</script>
