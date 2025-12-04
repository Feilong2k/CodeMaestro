<script setup>
import { ref, onMounted } from 'vue'
import TheHeader from './components/TheHeader.vue'
import MatrixBackground from './components/MatrixBackground.vue'

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
  <div class="min-h-screen text-white relative">
    <MatrixBackground mode="matrixAmbient" :enabled="true" :density="0.5" :speed="0.6" />
    <div class="relative z-10">
      <TheHeader />
      <main class="pt-24 pb-12 px-6">
        <div class="max-w-4xl mx-auto">
          <div class="bg-bg-elevated border border-line-base rounded-xl p-8 shadow-matrix-glow">
            <h1 class="text-3xl font-bold mb-6 text-center text-text-primary">
              CodeMaestro Dashboard
            </h1>

            <p class="text-text-secondary mb-8 text-center">
              This is the main dashboard area. The header above provides project switching, new project creation, and Plan/Act mode toggling.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div class="bg-bg-layer border border-line-base rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4 text-accent-primary">Backend Health</h2>
                <p class="font-matrix-mono text-sm mb-4">
                  {{ healthStatus }}
                </p>
                <p v-if="error" class="mt-2 text-danger text-sm">
                  {{ error }}
                </p>
                <button
                  type="button"
                  class="mt-4 px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-bg-base rounded-md transition-colors"
                  @click="checkHealth"
                >
                  Check Backend Again
                </button>
              </div>

              <div class="bg-bg-layer border border-line-base rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-4 text-accent-primary">Current Mode</h2>
                <p class="text-text-secondary mb-2">
                  The header toggle allows you to switch between <strong>Plan</strong> and <strong>Act</strong> modes.
                </p>
                <p class="text-sm text-text-muted">
                  This is a visual toggle for now. The state is managed in the Pinia store.
                </p>
              </div>
            </div>

            <div class="bg-bg-layer border border-line-base rounded-lg p-6">
              <h2 class="text-xl font-semibold mb-4 text-accent-primary">Next Steps</h2>
              <ul class="list-disc list-inside text-text-secondary space-y-2">
                <li>Implement the chat interface for the dashboard</li>
                <li>Add project management functionality</li>
                <li>Connect to backend APIs for real data</li>
                <li>Implement the activity and status panels</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
