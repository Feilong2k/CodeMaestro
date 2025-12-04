<template>
  <header class="sticky top-0 z-50 h-14 bg-bg-elevated border-b border-line-base px-6">
    <div class="h-full max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left: Logo and App Name -->
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center">
            <span class="text-bg-base font-bold text-sm">CM</span>
          </div>
          <span class="text-lg font-semibold text-text-primary">CodeMaestro</span>
        </div>
      </div>

      <!-- Center: Project Switcher and New Project -->
      <div class="flex items-center space-x-4">
        <div class="relative">
          <button
            @click="showProjectDropdown = !showProjectDropdown"
            class="flex items-center space-x-2 px-4 py-2 rounded-md bg-bg-layer hover:bg-bg-subtle text-text-primary border border-line-base transition-colors duration-fast text-sm"
          >
            <span class="font-medium">{{ currentProject.name }}</span>
            <svg
              class="w-4 h-4"
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
            class="absolute top-full left-0 mt-1 w-64 rounded-md bg-bg-elevated border border-line-base shadow-md z-50 overflow-hidden"
          >
            <div class="p-4 border-b border-line-base">
              <p class="text-xs text-text-secondary uppercase tracking-wide">Current Project</p>
              <p class="font-medium text-text-primary text-sm mt-1">{{ currentProject.name }}</p>
              <p class="text-xs text-text-muted mt-1">{{ currentProject.description }}</p>
            </div>
            <div class="p-2">
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm text-text-secondary hover:bg-bg-layer hover:text-text-primary transition-colors duration-fast"
              >
                Switch to Project B
              </button>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm text-text-secondary hover:bg-bg-layer hover:text-text-primary transition-colors duration-fast"
              >
                Switch to Project C
              </button>
              <div class="border-t border-line-base my-2"></div>
              <button
                class="w-full text-left px-3 py-2 rounded-sm text-sm text-accent-primary hover:bg-bg-layer transition-colors duration-fast"
              >
                Create New Project...
              </button>
            </div>
          </div>
        </div>

        <!-- New Project Button -->
        <button
          class="px-4 py-2 rounded-md bg-bg-layer hover:bg-bg-subtle text-text-primary border border-line-base transition-colors duration-fast flex items-center space-x-2 text-sm"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      <!-- Right: Plan/Act Toggle and User Menu -->
      <div class="flex items-center space-x-4">
        <!-- Plan/Act Toggle -->
        <div class="flex items-center bg-bg-layer rounded-md p-1">
          <button
            @click="setView('plan')"
            :class="[
              'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast',
              currentView === 'plan'
                ? 'bg-accent-primary text-bg-base'
                : 'text-text-secondary hover:text-text-primary'
            ]"
          >
            Plan
          </button>
          <button
            @click="setView('act')"
            :class="[
              'px-4 py-1.5 rounded-sm text-sm font-medium transition-colors duration-fast',
              currentView === 'act'
                ? 'bg-accent-primary text-bg-base'
                : 'text-text-secondary hover:text-text-primary'
            ]"
          >
            Act
          </button>
        </div>

        <!-- User Avatar (placeholder) -->
        <div class="w-8 h-8 rounded-full bg-bg-layer border border-line-base"></div>
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
