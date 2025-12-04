<template>
  <div class="project-picker">
    <div class="picker-header">
      <h3 class="title">Project</h3>
      <button
        class="new-project-btn"
        @click="handleNewProject"
        :disabled="loading"
        title="Create a new project"
      >
        <span class="icon">+</span>
        New
      </button>
    </div>

    <div class="picker-body">
      <div v-if="loading" class="loading">Loading projects...</div>
      <div v-else-if="error" class="error">
        Failed to load projects: {{ error }}
        <button @click="fetchProjects">Retry</button>
      </div>
      <div v-else-if="projects.length === 0" class="empty">
        No projects yet. Create one to get started.
      </div>
      <ul v-else class="project-list">
        <li
          v-for="project in projects"
          :key="project.id"
          :class="{ selected: selectedProjectId === project.id }"
          @click="selectProject(project.id)"
          class="project-item"
        >
          <div class="project-name">{{ project.name }}</div>
          <div class="project-slug">{{ project.slug }}</div>
          <div class="project-date">{{ formatDate(project.createdAt) }}</div>
        </li>
      </ul>
    </div>

    <div v-if="selectedProject" class="selected-info">
      Selected: <strong>{{ selectedProject.name }}</strong>
      <button class="clear-btn" @click="clearSelection">×</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import useProjectSelection from '../composables/useProjectSelection'

const {
  projects,
  selectedProjectId,
  selectedProject,
  loading,
  error,
  fetchProjects,
  selectProject,
  clearSelection,
  startNewProjectWizard,
} = useProjectSelection()

// Emit events for parent
const emit = defineEmits(['select', 'new-project'])

const handleNewProject = () => {
  const context = startNewProjectWizard()
  emit('new-project', context)
}

const handleSelectProject = (projectId) => {
  selectProject(projectId)
  emit('select', projectId)
}

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Fetch projects on mount
fetchProjects()
</script>

<style scoped>
.project-picker {
  background: var(--bg-elevated);
  border: 1px solid var(--line-base);
  border-radius: var(--radius-md);
  padding: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.new-project-btn {
  background: transparent;
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.new-project-btn:hover:not(:disabled) {
  background: rgba(0, 229, 255, 0.1);
}

.new-project-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  font-weight: bold;
}

.picker-body {
  min-height: 100px;
}

.loading,
.error,
.empty {
  padding: 12px;
  text-align: center;
  border-radius: 4px;
  background: var(--bg-subtle);
}

.error {
  color: #ff6b6b;
}

.error button {
  margin-left: 8px;
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
}

.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

.project-item {
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  margin-bottom: 6px;
}

.project-item:hover {
  background: var(--bg-subtle);
  border-color: var(--line-circuit);
}

.project-item.selected {
  background: rgba(0, 229, 255, 0.08);
  border-color: var(--accent-primary);
}

.project-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.project-slug {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.project-date {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.selected-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.clear-btn:hover {
  color: var(--text-primary);
}
</style>
