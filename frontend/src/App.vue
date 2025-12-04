<script setup>
import { ref, onMounted } from 'vue'

const healthStatus = ref('Checking backend...')
const error = ref(null)

async function checkHealth() {
  try {
    error.value = null
    healthStatus.value = 'Checking backend...'

    const response = await fetch('http://localhost:4000/api/health')
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const data = await response.json()
    healthStatus.value = `Backend says: ${data.status} – ${data.message}`
  } catch (e) {
    error.value = e.message || String(e)
    healthStatus.value = 'Backend check failed'
  }
}

onMounted(checkHealth)
</script>

<template>
  <div class="min-h-screen bg-bg-base text-text-primary flex items-center justify-center">
    <div
      class="w-full max-w-xl px-6 py-8 bg-bg-elevated border border-line-base rounded-lg shadow-md"
    >
      <h1 class="text-2xl font-semibold mb-4">
        CodeMaestro Dev Shell
      </h1>

      <p class="text-text-secondary mb-6">
        This page proves the Vue frontend can talk to the Node backend.
      </p>

      <div class="mb-4">
        <p class="font-mono text-sm">
          {{ healthStatus }}
        </p>
        <p v-if="error" class="mt-2 text-danger text-sm">
          {{ error }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center px-4 py-2 rounded-md bg-accent-primary text-text-inverse text-sm font-medium hover:bg-accent-secondary transition-colors"
        @click="checkHealth"
      >
        Check backend again
      </button>
    </div>
  </div>
</template>
