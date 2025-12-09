<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores/appStore'
import { storeToRefs } from 'pinia'
import TheHeader from './components/TheHeader.vue'
import MatrixBackground from './components/MatrixBackground.vue'
import MainLayout from './components/MainLayout.vue'
import ChatPanel from './components/ChatPanel.vue'
import SystemLogPanel from './components/SystemLogPanel.vue'
import ActivityLog from './components/ActivityLog.vue'
import StatusBar from './components/StatusBar.vue'
import PatternManager from './components/PatternManager.vue'
import Workflows from './views/Workflows.vue'
import TaskDashboard from './views/TaskDashboard.vue'
import FeaturesView from './views/FeaturesView.vue'

const appStore = useAppStore()
const { currentView, showTaskDashboard } = storeToRefs(appStore)

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
        <!-- Left slot (Chat/Views) -->
        <template #left>
          <ChatPanel v-if="currentView === 'dashboard'" />
          <PatternManager v-else-if="currentView === 'patterns'" />
          <Workflows v-else-if="currentView === 'workflows'" />
          <FeaturesView v-else-if="currentView === 'features'" />
          <ChatPanel v-else-if="currentView === 'chat'" />
          <!-- Fallback: if currentView is something else, show chat -->
          <ChatPanel v-else />
        </template>

        <!-- Center slot (System Log) -->
        <template #center>
          <SystemLogPanel />
        </template>

        <!-- Right slot (Activity) -->
        <template #right>
          <ActivityLog />
        </template>
      </MainLayout>
      <!-- StatusBar fixed at bottom, outside MainLayout -->
      <StatusBar />
      
      <!-- Task Dashboard Modal -->
      <TaskDashboard 
        v-if="showTaskDashboard" 
        @close="appStore.closeTaskDashboard()" 
      />
    </div>
  </div>
</template>
