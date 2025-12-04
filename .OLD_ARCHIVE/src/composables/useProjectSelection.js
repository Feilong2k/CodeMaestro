// useProjectSelection composable for managing project selection
// Subtask 2-2-4: Frontend Project Selection & Context

import { ref, computed } from 'vue'

const PROJECTS_API = '/api/projects'

export default function useProjectSelection() {
  // State
  const projects = ref([])
  const selectedProjectId = ref(null)
  const wizardMode = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const selectedProject = computed(() => 
    projects.value.find(p => p.id === selectedProjectId.value) || null
  )

  // Fetch projects from backend
  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(PROJECTS_API)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      projects.value = data.projects || []
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch projects:', err)
    } finally {
      loading.value = false
    }
  }

  // Select a project by ID
  const selectProject = (projectId) => {
    selectedProjectId.value = projectId
    // Persist to localStorage for session continuity
    if (projectId) {
      localStorage.setItem('selectedProjectId', projectId)
    } else {
      localStorage.removeItem('selectedProjectId')
    }
  }

  // Clear selection
  const clearSelection = () => {
    selectProject(null)
  }

  // Initialize from localStorage
  const initFromStorage = () => {
    const stored = localStorage.getItem('selectedProjectId')
    if (stored) {
      selectedProjectId.value = stored
    }
  }

  // Create a new project via wizard (trigger wizard mode)
  const startNewProjectWizard = () => {
    clearSelection()
    wizardMode.value = true
  }

  // Clear wizard mode (call after wizard is done)
  const clearWizardMode = () => {
    wizardMode.value = false
  }

  // Build context object for chat API
  const buildChatContext = () => {
    const context = {}
    if (selectedProjectId.value) {
      context.projectId = selectedProjectId.value
    }
    if (wizardMode.value) {
      context.wizardMode = true
    }
    return context
  }

  return {
    // State
    projects,
    selectedProjectId,
    selectedProject,
    loading,
    error,
    // Methods
    fetchProjects,
    selectProject,
    clearSelection,
    initFromStorage,
    startNewProjectWizard,
    clearWizardMode,
    buildChatContext,
    wizardMode,
  }
}
