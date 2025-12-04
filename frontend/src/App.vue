<script setup>
import { ref, onMounted } from 'vue'
import TheHeader from './components/TheHeader.vue'

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
  <div class="min-h-screen bg-slate-900 text-white">
    <TheHeader />
    <main class="pt-24 pb-12 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg">
          <h1 class="text-3xl font-bold mb-6 text-center">
            CodeMaestro Dashboard
          </h1>

          <p class="text-slate-300 mb-8 text-center">
            This is the main dashboard area. The header above provides project switching, new project creation, and Plan/Act mode toggling.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 class="text-xl font-semibold mb-4 text-cyan-400">Backend Health</h2>
              <p class="font-mono text-sm mb-4">
                {{ healthStatus }}
              </p>
              <p v-if="error" class="mt-2 text-red-400 text-sm">
                {{ error }}
              </p>
              <button
                type="button"
                class="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors"
                @click="checkHealth"
              >
                Check Backend Again
              </button>
            </div>

            <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 class="text-xl font-semibold mb-4 text-cyan-400">Current Mode</h2>
              <p class="text-slate-300 mb-2">
                The header toggle allows you to switch between <strong>Plan</strong> and <strong>Act</strong> modes.
              </p>
              <p class="text-sm text-slate-400">
                This is a visual toggle for now. The state is managed in the Pinia store.
              </p>
            </div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4 text-cyan-400">Next Steps</h2>
            <ul class="list-disc list-inside text-slate-300 space-y-2">
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
</template>
