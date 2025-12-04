<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <div class="logo-mark">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--accent-primary)" stroke-width="2" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="var(--accent-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="app-name">CodeMaestro</span>
    </div>
    <div class="top-bar-center">
      <span class="page-title">Dashboard</span>
    </div>
    <div class="top-bar-right">
      <ConnectivityChip />
      <button class="visual-toggle" @click="$emit('toggle-visual-mode')" :title="`Switch visual mode (current: ${visualLabel})`">
        {{ visualLabel }}
      </button>
      <!-- placeholder for theme switch and avatar -->
      <div class="placeholder-icon" title="Theme switch (future)">🌙</div>
      <div class="placeholder-avatar" title="User profile (future)">U</div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import ConnectivityChip from './ConnectivityChip.vue'

const props = defineProps({
  visualMode: { type: String, default: 'roboticGrid' }
})

const emit = defineEmits(['toggle-visual-mode'])

const visualLabel = computed(() => {
  if (props.visualMode === 'matrixAmbient') return 'Matrix'
  if (props.visualMode === 'roboticGrid') return 'Robotic'
  return 'Off'
})
</script>

<style lang="scss" scoped>
.top-bar {
  background-color: var(--bg-elevated);
  border-bottom: 1px solid var(--line-base);
  padding: 0 var(--space-6);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.top-bar-center {
  .page-title {
    font-size: 18px;
    color: var(--text-secondary);
    display: none;

    @media (min-width: 768px) {
      display: block;
    }
  }
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.placeholder-icon,
.placeholder-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--bg-layer);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: not-allowed;
  user-select: none;
}

.placeholder-avatar {
  background-color: color-mix(in oklab, var(--accent-primary) 15%, var(--bg-layer));
  color: var(--accent-primary);
  font-weight: 500;
}

.visual-toggle {
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  background-color: var(--bg-layer);
  color: var(--text-secondary);
  border: 1px solid var(--line-base);
  cursor: pointer;
  font-size: 14px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.visual-toggle:hover { box-shadow: var(--glow-cyan); border-color: var(--accent-primary); color: var(--text-primary); }
.visual-toggle:focus { outline: none; box-shadow: var(--focus-ring); }
</style>
