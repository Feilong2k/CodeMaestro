<template>
  <header class="sticky top-0 z-50 h-14 bg-transparent px-6">
    <div class="h-full w-[95vw] mx-auto flex items-center justify-between">
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
            <span class="font-medium">{{ currentProject?.name || 'Select Project' }}</span>
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
            <div class="p-3 border-b border-line-base" v-if="currentProject">
              <p class="text-xs text-text-secondary uppercase tracking-wide font-matrix-mono">Current Project</p>
              <p class="font-medium text-text-primary text-sm mt-1 font-matrix-sans">{{ currentProject.name }}</p>
              <p class="text-xs text-text-muted mt-1 font-matrix-sans">{{ currentProject.description }}</p>
            </div>
            <div class="p-2 max-h-60 overflow-y-auto">
              <div v-if="loading" class="px-3 py-2 text-xs text-text-muted font-matrix-sans">
                Loading projects...
              </div>
              <template v-else>
                <button
                  v-for="project in projects"
                  :key="project.id"
                  @click="handleSwitchProject(project.id)"
                  class="w-full text-left px-3 py-2 rounded-sm text-xs hover:bg-bg-layer transition-colors duration-fast font-matrix-sans"
                  :class="project.id === currentProject?.id ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'"
                >
                  <div class="font-medium">{{ project.name }}</div>
                  <div v-if="project.description" class="text-xs text-text-muted truncate">{{ project.description }}</div>
                </button>
                <div class="border-t border-line-base my-2"></div>
                <button
                  class="w-full text-left px-3 py-2 rounded-sm text-xs text-accent-primary hover:bg-bg-layer transition-colors duration-fast font-matrix-sans"
                  @click="showNewProjectModal = true"
                >
                  Create New Project...
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Navigation -->
      <div class="flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
        <button
          @click="setView('dashboard')"
          class="px-3 py-1.5 text-xs font-matrix-sans rounded-md transition-colors duration-fast"
          :class="currentView === 'dashboard' ? 'text-bg-base bg-accent-primary font-bold' : 'text-text-muted hover:text-text-primary hover:bg-bg-layer'"
        >
          Dashboard
        </button>
        <button
          @click="setView('patterns')"
          class="px-3 py-1.5 text-xs font-matrix-sans rounded-md transition-colors duration-fast"
          :class="currentView === 'patterns' ? 'text-bg-base bg-accent-primary font-bold' : 'text-text-muted hover:text-text-primary hover:bg-bg-layer'"
        >
          Patterns
        </button>
        <button
          @click="setView('workflows')"
          class="px-3 py-1.5 text-xs font-matrix-sans rounded-md transition-colors duration-fast"
          :class="currentView === 'workflows' ? 'text-bg-base bg-accent-primary font-bold' : 'text-text-muted hover:text-text-primary hover:bg-bg-layer'"
        >
          Workflows
        </button>
        <button
          @click="setView('features')"
          class="px-3 py-1.5 text-xs font-matrix-sans rounded-md transition-colors duration-fast"
          :class="currentView === 'features' ? 'text-bg-base bg-accent-primary font-bold' : 'text-text-muted hover:text-text-primary hover:bg-bg-layer'"
        >
          Features
        </button>
      </div>

      <!-- Right: User Menu -->
      <div class="flex items-center space-x-4">
        <!-- User Avatar (placeholder) -->
        <div class="w-8 h-8 rounded-full bg-bg-layer/60 border border-line-base/60 shadow-matrix-glow"></div>
      </div>
    </div>

    <NewProjectModal
      v-if="showNewProjectModal"
      @close="showNewProjectModal = false"
      @created="showNewProjectModal = false"
    />
  </header>
</template>

<script setup>
import { useAppStore } from '../stores/appStore'
import { useProjectStore } from '../stores/project'
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import NewProjectModal from './NewProjectModal.vue'

const appStore = useAppStore()
const projectStore = useProjectStore()
const { currentView } = storeToRefs(appStore)
const { currentProject, projects, loading } = storeToRefs(projectStore)
const { setCurrentView } = appStore
const { fetchProjects, switchProject } = projectStore

const showProjectDropdown = ref(false)
const showNewProjectModal = ref(false)

const setView = (view) => {
  setCurrentView(view)
}

const handleSwitchProject = async (projectId) => {
  try {
    await switchProject(projectId)
    showProjectDropdown.value = false
  } catch (error) {
    console.error('Failed to switch project:', error)
    // TODO: Show error notification
  }
}

onMounted(() => {
  // Fetch projects on component mount if not already loaded
  if (projects.value.length === 0) {
    fetchProjects()
  }
})
</script>

<style scoped>
header {
  box-shadow: var(--shadow-sm);
}
</style>
