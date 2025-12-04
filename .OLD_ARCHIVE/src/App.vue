<template>
  <div class="app-shell">
    <MatrixBackground :mode="visualMode" :key="visualMode" />
    <TopBar :visualMode="visualMode" @toggle-visual-mode="toggleVisualMode" />
    <div class="layout-body">
      <aside class="sidebar">
        <ProjectPicker @select-project="handleProjectSelect" />
      </aside>
      <main class="main-content">
        <div class="chat-container">
          <ChatTranscript />
          <ChatInputBar />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import TopBar from './components/TopBar.vue'
import ChatTranscript from './components/ChatTranscript.vue'
import ChatInputBar from './components/ChatInputBar.vue'
import MatrixBackground from './components/MatrixBackground.vue'
import ProjectPicker from './components/ProjectPicker.vue'

const visualMode = ref('roboticGrid') // 'matrixAmbient' | 'roboticGrid' | 'none'
const currentProject = ref(null)

function handleProjectSelect(project) {
  console.log('Project selected:', project)
  currentProject.value = project
  // TODO: Propagate project context to chat/queue components
}

function applyBodyAttr() {
  document.body.setAttribute('data-visual-mode', visualMode.value)
}

function toggleVisualMode() {
  visualMode.value = visualMode.value === 'roboticGrid' ? 'matrixAmbient' : (visualMode.value === 'matrixAmbient' ? 'none' : 'roboticGrid')
  console.log('[VisualMode] toggled to', visualMode.value)
}

watch(visualMode, applyBodyAttr, { immediate: true })

onMounted(() => {
  applyBodyAttr()
})
</script>

<style lang="scss">
:root {
  --bg-base: #0C0F12;
  --bg-layer: #12161C;
  --bg-elevated: #151A21;
  --bg-subtle: #0F1318;
  --text-primary: #E6F1FF;
  --text-secondary: #A3B3C5;
  --text-muted: #7A8898;
  --accent-primary: #00E5FF;
  --accent-secondary: #7C4DFF;
  --line-base: #1E2630;
  --line-circuit: rgba(0,229,255,0.12);
  --glow-cyan: 0 0 0 1px rgba(0,229,255,0.15), 0 0 12px rgba(0,229,255,0.1);
  --focus-ring: 0 0 0 2px #00E5FF;
  --radius-md: 8px;
  --space-6: 24px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: Inter, 'SF Pro Text', Segoe UI, Roboto, Arial, sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-body {
  display: flex;
  flex: 1;
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  border-right: 1px solid var(--line-base);
  background: var(--bg-layer);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: var(--space-6);
  width: 100%;
  position: relative;
  overflow-y: auto;
}

.chat-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  position: relative;
  z-index: 3; /* ensure chat content stays on top */
}

.chat-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
