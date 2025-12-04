<template>
  <header class="sticky top-0 z-50 h-14 bg-transparent px-6">
    <div class="h-full max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left: Logo, App Name, and Project Switcher -->
      <div class="flex items-center space-x-4">
        <!-- Logo and App Name -->
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center shadow-matrix-glow">
            <span class="text-bg-base font-bold text-sm">CM</span>
          </div>
          <span class="text-lg font-semibold text-text-primary font-matrix-sans">CodeMaestro</span>
        </div>

        <!-- Project Switcher (smaller) -->
        <div class="relative">
          <button
            @click="showProjectDropdown = !showProjectDropdown"
            class="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-bg-layer/60 hover:bg-bg-layer text-accent-primary border border-line-base transition-colors duration-fast text-xs font-matrix-sans hover:shadow-matrix-glow focus:shadow-matrix-glow focus:outline-none"
          >
            <span class="font-medium">{{ currentProject.name }}</span>
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown -->
          <div
            v-if="showProjectDropdown"
            class="absolute top-full left-0 mt-1 w-56 rounded-md bg-bg-elevated border border-line-base shadow-md z-50 overflow-hidden shadow-matrix-glow"
          >
            <div class="p-3 border-b border-line-base">
              <p class="text-xs text-text-secondary uppercase tracking-wide font-matrix-mono">Current Project</p>
              <p class="font-medium text-text-primary text-sm mt-1 font-matrix-sans">{{ currentProject.name }}</p>
              <p class="text-xs text-text-muted mt-1 font-matrix-sans">{{ currentProject.description }}</p>
            </div>
            <div class="p-2">
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-xs text-text-secondary hover:bg-bg-layer hover:text-text-primary transition-colors duration-fast font-matrix-sans"
              >
                Switch to Project B
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-xs text-text-secondary hover:bg-bg-layer hover:text-text-primary transition-colors duration-fast font-matrix-sans"
              >
                Switch to Project C
              </button>
              <div class="border-t border-line-base my-2"></div>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-xs text-accent-primary hover:bg-bg-layer transition-colors duration-fast font-matrix-sans"
              >
                Create New Project...
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Plan/Act Toggle and User Menu -->
      <div class="flex items-center space-x-4">
        <!-- Plan/Act Toggle -->
        <div class="flex items-center bg-bg-layer/60 rounded-md p-1 border border-line-base/60">
          <button
            @click="setView('plan')"
            :class="[
              'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast font-matrix-sans',
              currentView === 'plan'
                ? 'bg-accent-primary text-bg-base shadow-matrix-glow'
                : 'text-text-secondary hover:text-text-primary hover:shadow-matrix-glow'
            ]"
          >
            Plan
          </button>
          <button
            @click="setView('act')"
            :class="[
              'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast font-matrix-sans',
              currentView === 'act'
                ? 'bg-accent-primary text-bg-base shadow-matrix-glow'
                : 'text-text-secondary hover:text-text-primary hover:shadow-matrix-glow'
            ]"
          >
            Act
          </button>
        </div>

        <!-- User Avatar (placeholder) -->
        <div class="w-8 h-8 rounded-full bg-bg-layer/60 border border-line-base/60 shadow-matrix-glow"></div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAppStore } from '../stores/appStore'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const appStore = useAppStore()
const { currentView, currentProject } = storeToRefs(appStore)
const { setCurrentView } = appStore

const showProjectDropdown = ref(false)

const setView = (view) => {
  setCurrentView(view)
}
</script>

<style scoped>
header {
  box-shadow: var(--shadow-sm);
}
</style>
