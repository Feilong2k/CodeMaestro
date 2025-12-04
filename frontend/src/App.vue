<script setup>
import { ref, onMounted } from 'vue'
import TheHeader from './components/TheHeader.vue'
import MatrixBackground from './components/MatrixBackground.vue'
import MainLayout from './components/MainLayout.vue'
import ChatPanel from './components/ChatPanel.vue'
import ActivityLog from './components/ActivityLog.vue'
import StatusBar from './components/StatusBar.vue'

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
      <MainLayout>
        <!-- Default slot (main content) -->
        <template #default>
          <ChatPanel />
        </template>

        <!-- Right slot (for activity log) -->
        <template #right>
          <ActivityLog />
        </template>
      </MainLayout>
      <!-- StatusBar fixed at bottom, outside MainLayout -->
      <StatusBar />
    </div>
  </div>
</template>
