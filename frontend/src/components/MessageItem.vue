<template>
  <div class="message bg-bg-elevated border border-line-base rounded-lg p-4">
    <div class="flex items-start space-x-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center shadow-matrix-glow"
        :class="avatarBg"
      >
        <span class="text-bg-base font-bold text-sm">{{ avatarText }}</span>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold text-text-primary font-matrix-sans">{{ sender }}</span>
          <span class="text-xs text-text-muted font-matrix-mono">{{ time }}</span>
        </div>
        <p class="message-content text-text-secondary font-matrix-sans whitespace-pre-wrap">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  avatarBg: {
    type: String,
    default: 'bg-accent-primary'
  },
  avatarText: {
    type: String,
    default: 'O'
  },
  sender: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})
</script>
