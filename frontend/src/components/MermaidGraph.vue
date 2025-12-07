<template>
  <div class="mermaid-graph">
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      <p class="mt-4 text-text-muted font-matrix-sans">Loading diagram...</p>
    </div>
    <div v-else-if="error" class="bg-bg-elevated border border-line-error rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-text-error mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span class="text-text-error font-matrix-sans">{{ error }}</span>
      </div>
      <div v-if="rawMermaidCode" class="mt-4">
        <p class="text-text-muted text-sm mb-2">Raw Mermaid code:</p>
        <pre class="bg-bg-base text-xs p-3 rounded overflow-auto max-h-64 font-matrix-code">{{ rawMermaidCode }}</pre>
      </div>
    </div>
    <div v-else ref="mermaidContainer" class="mermaid-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import mermaid from 'mermaid'

const props = defineProps({
  definition: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '300px'
  }
})

const mermaidContainer = ref(null)
const loading = ref(true)
const error = ref(null)
const rawMermaidCode = ref('')

// Initialize mermaid with a default configuration compatible with v11.x
const mermaidConfig = {
  startOnLoad: false,
  theme: 'dark',
  fontFamily: 'monospace',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  securityLevel: 'loose'
}

// Try to initialize, catch any configuration errors
try {
  mermaid.initialize(mermaidConfig)
} catch (err) {
  console.error('Mermaid initialization error:', err)
}

// Helper function to add timeout to a promise
function withTimeout(promise, timeoutMs, timeoutMessage) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise])
}

async function renderDiagram() {
  if (!mermaidContainer.value) return

  loading.value = true
  error.value = null
  rawMermaidCode.value = ''

  try {
    // Clear previous content
    mermaidContainer.value.innerHTML = ''

    // Generate the mermaid diagram string
    const { generateMermaid } = await import('../utils/mermaidGenerator.js')
    const diagramCode = generateMermaid(props.definition)
    rawMermaidCode.value = diagramCode
    
    // Log for debugging visibility as requested
    console.log('Generated Mermaid diagram code:', diagramCode)

    // Generate a unique ID for this diagram
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
    
    // Add timeout to prevent infinite loading (2 seconds as suggested)
    let renderResult
    try {
      renderResult = await withTimeout(
        mermaid.render(id, diagramCode),
        2000,
        'Mermaid rendering timed out after 2 seconds'
      )
    } catch (renderErr) {
      console.error('Mermaid render error:', renderErr)
      throw renderErr
    }
    
    const { svg } = renderResult

    // Insert the SVG into the container
    mermaidContainer.value.innerHTML = svg

    // Apply custom styles to match our theme
    const svgElement = mermaidContainer.value.querySelector('svg')
    if (svgElement) {
      svgElement.style.width = '100%'
      svgElement.style.height = props.height
      svgElement.style.maxWidth = '100%'
      
      // Style the text to match our font family
      const textElements = svgElement.querySelectorAll('text')
      textElements.forEach(text => {
        text.style.fontFamily = 'Matrix Code, monospace'
        text.style.fill = 'var(--text-primary)'
      })

      // Style the edges
      const edgePaths = svgElement.querySelectorAll('.edgePath path')
      edgePaths.forEach(path => {
        path.style.stroke = 'var(--accent-primary)'
      })

      // Style the nodes
      const nodes = svgElement.querySelectorAll('.node')
      nodes.forEach(node => {
        const rect = node.querySelector('rect')
        if (rect) {
          rect.style.fill = 'var(--bg-layer)'
          rect.style.stroke = 'var(--line-base)'
        }
      })
    }
  } catch (err) {
    console.error('Failed to render mermaid diagram:', err)
    error.value = err.message || 'Failed to render diagram'
    // Ensure loading is set to false even if error occurs before finally block
    loading.value = false
    return // Exit early since we have error state
  } finally {
    // Always set loading to false, even if there was an error
    loading.value = false
  }
}

// Watch for changes in the definition
watch(() => props.definition, () => {
  renderDiagram()
}, { deep: true })

// Render on mount
onMounted(() => {
  nextTick(() => {
    renderDiagram()
  })
})

// Clean up
onUnmounted(() => {
  if (mermaidContainer.value) {
    mermaidContainer.value.innerHTML = ''
  }
})
</script>

<style scoped>
.mermaid-graph {
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
}

.mermaid-container {
  width: 100%;
  background-color: var(--bg-base);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow: auto;
}

/* Custom mermaid styling */
:deep(.mermaid) .label {
  font-family: 'Matrix Code', monospace;
  color: var(--text-primary);
}

:deep(.mermaid) .node rect {
  fill: var(--bg-layer);
  stroke: var(--line-base);
  stroke-width: 2px;
}

:deep(.mermaid) .edgePath path {
  stroke: var(--accent-primary);
  stroke-width: 2px;
}

:deep(.mermaid) .arrowheadPath {
  fill: var(--accent-primary);
}

:deep(.mermaid) .cluster rect {
  fill: var(--bg-elevated);
  stroke: var(--line-base);
}

:deep(.mermaid) text {
  fill: var(--text-primary);
  font-family: 'Matrix Code', monospace;
}
</style>
