<template>
  <div
    v-if="enabled"
    class="matrix-bg-layer"
    :data-mode="effectiveMode"
    aria-hidden="true"
  >
    <!-- Canvas for animated rendering (Matrix Ambient and Robotic Grid base) -->
    <canvas ref="canvasRef" class="matrix-bg-canvas"></canvas>

    <!-- Optional CSS sweep overlay for Robotic Grid (very subtle) -->
    <div v-if="effectiveMode === 'roboticGrid' && allowMotion" class="sweep-overlay"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'none' }, // 'matrixAmbient' | 'roboticGrid' | 'none'
  enabled: { type: Boolean, default: true },
  respectsReducedMotion: { type: Boolean, default: true },
  density: { type: Number, default: 0.35 }, // 0..1
  speed: { type: Number, default: 0.4 }, // 0..1
  quality: { type: String, default: 'medium' }, // 'low' | 'medium' | 'high'
})

const canvasRef = ref(null)
let ctx = null
let animId = null
let offscreen = null
let offctx = null

const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
const reduced = ref(mql.matches)
const allowMotion = computed(() => !props.respectsReducedMotion || !reduced.value)
const effectiveMode = computed(() => (props.mode === 'none' ? 'none' : props.mode))

const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

// Glyph set for matrix ambient (tiny set; no readable words)
const glyphs = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

// State for matrix ambient
let columns = [] // { x, y, speed }

// Resize handler
function resize() {
  const c = canvasRef.value
  if (!c) return
  c.width = Math.floor(window.innerWidth * dpr)
  c.height = Math.floor(window.innerHeight * dpr)
  c.style.width = `${window.innerWidth}px`
  c.style.height = `${window.innerHeight}px`

  // Rebuild columns for matrix mode
  const colWidth = 18 * dpr
  const count = Math.floor((window.innerWidth * props.density) / (colWidth * 0.6))
  columns = []
  for (let i = 0; i < count; i++) {
    const x = Math.floor((i * window.innerWidth) / count) * dpr
    columns.push({ x, y: Math.random() * c.height, speed: (0.4 + Math.random() * 0.2) })
  }

  // Rebuild offscreen grid for robotic mode
  if (!offscreen) offscreen = document.createElement('canvas')
  offscreen.width = c.width
  offscreen.height = c.height
  offctx = offscreen.getContext('2d')
  drawStaticRoboticGrid()
}

function drawStaticRoboticGrid() {
  if (!offctx) return
  const w = offscreen.width
  const h = offscreen.height
  offctx.clearRect(0, 0, w, h)

  // Background fill (transparent; the main bg shows through)

  // Subtle grid using line.circuit color
  const gridSpacing = 28 * dpr
  offctx.strokeStyle = 'rgba(0,229,255,0.12)'
  offctx.lineWidth = 1 * dpr
  offctx.beginPath()
  for (let x = 0; x < w; x += gridSpacing) {
    offctx.moveTo(x, 0)
    offctx.lineTo(x, h)
  }
  for (let y = 0; y < h; y += gridSpacing) {
    offctx.moveTo(0, y)
    offctx.lineTo(w, y)
  }
  offctx.stroke()

  // Sparse circuit traces
  offctx.strokeStyle = 'rgba(0,229,255,0.08)'
  offctx.lineWidth = 1 * dpr
  for (let i = 0; i < 6; i++) {
    const x1 = Math.random() * w
    const y1 = Math.random() * h
    const x2 = Math.random() * w
    const y2 = Math.random() * h
    offctx.beginPath()
    offctx.moveTo(x1, y1)
    offctx.lineTo(x2, y2)
    offctx.stroke()

    // Nodes
    offctx.fillStyle = 'rgba(0,229,255,0.18)'
    offctx.beginPath()
    offctx.arc(x1, y1, 1.5 * dpr, 0, Math.PI * 2)
    offctx.fill()
  }
}

function drawMatrixAmbient(dt) {
  if (!ctx) return
  const c = canvasRef.value
  const w = c.width
  const h = c.height

  // Slight translucent clear to keep low persistence
  ctx.fillStyle = 'rgba(12,15,18,0.08)'
  ctx.fillRect(0, 0, w, h)

  const fontSize = 14 * dpr
  ctx.font = `${fontSize}px JetBrains Mono, Roboto Mono, Consolas, monospace`
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(0,229,255,0.06)'

  const speedScale = 20 + props.speed * 40 // px per second in device space
  const step = (speedScale * dpr) * (dt / 1000)


  for (let i = 0; i < columns.length; i++) {
    const col = columns[i]


    // Draw a short stack of glyphs per column
    for (let k = 0; k < 6; k++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0]
      ctx.fillText(ch, col.x, (col.y + k * (fontSize + 4)) % h)
    }
    col.y = (col.y + step * col.speed) % h
  }
}

function drawRoboticGrid(dt) {
  if (!ctx) return
  const c = canvasRef.value
  const w = c.width
  const h = c.height
  ctx.clearRect(0, 0, w, h)
  if (offscreen) {
    ctx.globalAlpha = 1
    ctx.drawImage(offscreen, 0, 0)

  }
  // All motion handled by CSS sweep overlay; canvas is static
}

let lastTs = 0
function loop(ts) {
  if (!ctx) return
  const dt = Math.min(50, ts - lastTs || 16)
  lastTs = ts

  if (effectiveMode.value === 'matrixAmbient' && allowMotion.value) {
    drawMatrixAmbient(dt)
  } else if (effectiveMode.value === 'matrixAmbient' && !allowMotion.value) {
    // Static faint pattern
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    drawMatrixAmbient(0) // draws a single faint frame
  } else if (effectiveMode.value === 'roboticGrid') {
    drawRoboticGrid(dt)
  } else {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }

  animId = requestAnimationFrame(loop)
}

function start() {
  const c = canvasRef.value
  if (!c) return
  ctx = c.getContext('2d')
  resize()
  cancel()
  animId = requestAnimationFrame(loop)
}

function cancel() {
  if (animId) cancelAnimationFrame(animId)
  animId = null
}

onMounted(() => {
  // Reduced motion listener
  const handler = (e) => (reduced.value = e.matches)
  try { mql.addEventListener('change', handler) } catch (e) { mql.addListener(handler) }

  window.addEventListener('resize', resize)
  start()
})

onUnmounted(() => {
  cancel()
  window.removeEventListener('resize', resize)
  try { mql.removeEventListener('change', () => {}) } catch (e) { mql.removeListener(() => {}) }
})

watch(() => [props.mode, props.density, props.speed, props.quality], () => {
  resize()
})
</script>

<style scoped>
.matrix-bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0; /* background visible; chat will sit above with higher z-index */
  pointer-events: none;
}
.matrix-bg-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
/* Subtle sweep overlay for robotic grid */
.sweep-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(0,229,255,0) 0%, rgba(0,229,255,0.06) 50%, rgba(0,229,255,0) 100%);
  animation: sweep 18s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .sweep-overlay { display: none; }
}
@keyframes sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
