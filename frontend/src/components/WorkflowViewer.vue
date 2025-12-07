<template>
  <div v-if="loading" class="text-center py-12">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
    <p class="mt-4 text-text-muted font-matrix-sans">Loading workflow details...</p>
  </div>

  <div v-else-if="error" class="bg-bg-elevated border border-line-error rounded-lg p-6">
    <div class="flex items-center">
      <div class="w-10 h-10 rounded-full bg-bg-error/20 flex items-center justify-center mr-4">
        <svg class="w-5 h-5 text-text-error" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-text-error font-matrix-sans">Failed to load workflow</h3>
        <p class="text-text-secondary mt-1 font-matrix-sans">{{ error }}</p>
        <button @click="fetchWorkflow" class="mt-4 px-4 py-2 bg-accent-primary text-bg-base rounded-md font-medium font-matrix-sans hover:opacity-90 transition-opacity">
          Try Again
        </button>
      </div>
    </div>
  </div>

  <div v-else-if="workflow" class="space-y-8">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-text-primary font-matrix-sans">{{ workflow.name }}</h2>
      <div class="flex items-center mt-2 space-x-4">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              :class="workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
          {{ workflow.status || 'active' }}
        </span>
        <span class="text-sm text-text-muted font-matrix-mono">ID: {{ workflow.id }}</span>
      </div>
      <p v-if="workflow.description" class="mt-4 text-text-secondary font-matrix-sans">{{ workflow.description }}</p>
    </div>

    <!-- Definition & Metadata -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Definition -->
      <div class="bg-bg-layer rounded-xl border border-line-base p-6">
        <h3 class="text-lg font-semibold text-text-primary mb-4 font-matrix-sans">Definition</h3>
        <div class="space-y-6">
          <div v-if="workflow.definition?.initial">
            <h4 class="text-sm font-medium text-text-secondary mb-2 font-matrix-sans">Initial State</h4>
            <div class="px-4 py-2 bg-bg-elevated rounded-md font-matrix-mono text-sm">
              {{ workflow.definition.initial }}
            </div>
          </div>
          <div v-if="workflow.definition?.states && Object.keys(workflow.definition.states).length > 0">
            <h4 class="text-sm font-medium text-text-secondary mb-2 font-matrix-sans">States</h4>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(state, key) in workflow.definition.states" :key="key"
                   class="px-3 py-2 bg-bg-elevated rounded-md text-sm">
                <div class="font-medium text-text-primary font-matrix-mono">{{ key }}</div>
                <div v-if="state.on" class="text-xs text-text-muted mt-1 font-matrix-sans">
                  Transitions: {{ Object.keys(state.on).join(', ') }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="workflow.definition?.transitions && workflow.definition.transitions.length > 0">
            <h4 class="text-sm font-medium text-text-secondary mb-2 font-matrix-sans">Transitions</h4>
            <div class="space-y-2">
              <div v-for="(transition, idx) in workflow.definition.transitions" :key="idx"
                   class="px-3 py-2 bg-bg-elevated rounded-md text-sm">
                <div class="flex items-center">
                  <span class="font-medium text-text-primary font-matrix-mono">{{ transition.from }}</span>
                  <svg class="w-4 h-4 mx-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                  <span class="font-medium text-text-primary font-matrix-mono">{{ transition.to }}</span>
                  <span class="ml-auto text-xs text-accent-primary font-matrix-sans">{{ transition.event }}</span>
                </div>
                <div v-if="transition.condition" class="text-xs text-text-muted mt-1 font-matrix-mono">
                  Condition: {{ transition.condition }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="bg-bg-layer rounded-xl border border-line-base p-6">
        <h3 class="text-lg font-semibold text-text-primary mb-4 font-matrix-sans">Metadata</h3>
        <div class="space-y-6">
          <div v-if="workflow.metadata">
            <h4 class="text-sm font-medium text-text-secondary mb-2 font-matrix-sans">Properties</h4>
            <div class="space-y-2">
              <div v-for="(value, key) in workflow.metadata" :key="key" class="flex">
                <div class="w-1/3 text-sm text-text-secondary font-matrix-sans">{{ key }}</div>
                <div class="w-2/3">
                  <pre class="text-sm bg-bg-elevated p-2 rounded-md overflow-x-auto font-matrix-mono">{{ JSON.stringify(value, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-text-muted font-matrix-sans">
            No metadata available.
          </div>
        </div>
      </div>
    </div>

    <!-- Raw JSON View (Collapsible) -->
    <div class="bg-bg-layer rounded-xl border border-line-base overflow-hidden">
      <button @click="showRawJson = !showRawJson"
              class="w-full flex items-center justify-between p-6 text-left hover:bg-bg-elevated transition-colors">
        <h3 class="text-lg font-semibold text-text-primary font-matrix-sans">Raw JSON</h3>
        <svg class="w-5 h-5 text-text-secondary transition-transform" :class="{ 'rotate-180': showRawJson }"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <div v-if="showRawJson" class="p-6 border-t border-line-base">
        <pre class="text-sm bg-bg-base p-4 rounded-md overflow-x-auto font-matrix-mono">{{ JSON.stringify(workflow, null, 2) }}</pre>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-4 pt-6 border-t border-line-base">
      <button @click="emit('close')"
              class="px-4 py-2 border border-line-base text-text-primary rounded-md font-medium font-matrix-sans hover:bg-bg-layer transition-colors">
        Close
      </button>
      <button @click="handleEdit" v-if="workflow.status === 'active'"
              class="px-4 py-2 bg-accent-primary text-bg-base rounded-md font-medium font-matrix-sans hover:opacity-90 transition-opacity">
        Edit Workflow
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getWorkflow } from '../api/workflows'

const props = defineProps({
  workflowId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const workflow = ref(null)
const loading = ref(true)
const error = ref(null)
const showRawJson = ref(false)

async function fetchWorkflow() {
  loading.value = true
  error.value = null
  try {
    workflow.value = await getWorkflow(props.workflowId)
  } catch (err) {
    error.value = err.message
    console.error('Error fetching workflow:', err)
  } finally {
    loading.value = false
  }
}

function handleEdit() {
  // For now, just log and close. In a future iteration, this could open an editor.
  console.log('Edit workflow:', workflow.value.id)
  emit('close')
}

// Fetch when component mounts or workflowId changes
watch(() => props.workflowId, () => {
  fetchWorkflow()
}, { immediate: true })
</script>

<style scoped>
</style>
