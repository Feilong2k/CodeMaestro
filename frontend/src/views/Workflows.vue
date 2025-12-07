<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-text-primary font-matrix-sans">Workflows</h1>
      <p class="text-text-secondary font-matrix-sans">
        View and manage active workflows in the system. Workflows define the state machines that orchestrate agent behavior.
      </p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      <p class="mt-4 text-text-muted font-matrix-sans">Loading workflows...</p>
    </div>

    <div v-else-if="error" class="bg-bg-elevated border border-line-error rounded-lg p-6">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full bg-bg-error/20 flex items-center justify-center mr-4">
          <svg class="w-5 h-5 text-text-error" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-error font-matrix-sans">Failed to load workflows</h3>
          <p class="text-text-secondary mt-1 font-matrix-sans">{{ error }}</p>
          <button @click="fetchWorkflows" class="mt-4 px-4 py-2 bg-accent-primary text-bg-base rounded-md font-medium font-matrix-sans hover:opacity-90 transition-opacity">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Workflow List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="workflow in workflows"
          :key="workflow.id"
          class="bg-bg-layer rounded-xl border border-line-base p-6 hover:border-accent-primary transition-colors cursor-pointer"
          @click="selectWorkflow(workflow.id)"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-text-primary font-matrix-sans">{{ workflow.name }}</h3>
              <div class="flex items-center mt-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ workflow.status }}
                </span>
                <span class="ml-2 text-xs text-text-muted font-matrix-mono">ID: {{ workflow.id }}</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>
          <p class="text-sm text-text-secondary mb-4 font-matrix-sans">
            Click to view details and inspect the workflow definition.
          </p>
          <div class="flex justify-between items-center text-xs text-text-muted font-matrix-sans">
            <span>State machine</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="workflows.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto rounded-full bg-bg-layer flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-text-primary font-matrix-sans">No workflows found</h3>
        <p class="text-text-secondary mt-2 font-matrix-sans">There are no active workflows in the system.</p>
        <button @click="fetchWorkflows" class="mt-6 px-4 py-2 bg-accent-primary text-bg-base rounded-md font-medium font-matrix-sans hover:opacity-90 transition-opacity">
          Refresh
        </button>
      </div>
    </div>

    <!-- Workflow Viewer Modal -->
    <div v-if="selectedWorkflowId" class="fixed inset-0 z-50 overflow-hidden">
      <div class="absolute inset-0 bg-black/70" @click="selectedWorkflowId = null"></div>
      <div class="absolute inset-y-0 right-0 max-w-2xl w-full bg-bg-base shadow-xl flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-line-base">
          <h2 class="text-xl font-bold text-text-primary font-matrix-sans">Workflow Details</h2>
          <button @click="selectedWorkflowId = null" class="p-2 hover:bg-bg-layer rounded-md">
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <WorkflowViewer :workflow-id="selectedWorkflowId" @close="selectedWorkflowId = null" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WorkflowViewer from '../components/WorkflowViewer.vue'
import { listWorkflows, mockWorkflows } from '../api/workflows'

const workflows = ref([])
const loading = ref(true)
const error = ref(null)
const selectedWorkflowId = ref(null)

async function fetchWorkflows() {
  loading.value = true
  error.value = null
  try {
    workflows.value = await listWorkflows()
  } catch (err) {
    error.value = err.message
    console.error('Error fetching workflows:', err)
    // Fallback to mock data for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock workflows due to error:', err)
      workflows.value = mockWorkflows
      error.value = null
    }
  } finally {
    loading.value = false
  }
}

function selectWorkflow(id) {
  selectedWorkflowId.value = id
}

onMounted(() => {
  fetchWorkflows()
})
</script>

<style scoped>
</style>
