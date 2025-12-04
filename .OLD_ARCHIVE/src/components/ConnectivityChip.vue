<template>
  <div class="connectivity-chip" :class="status">
    <span class="dot"></span>
    <span class="label">{{ label }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const status = ref('unknown')
const label = ref('Checking...')

const checkHealth = async () => {
  try {
    const response = await axios.get('/api/health', { timeout: 3000 })
    if (response.status === 200 && response.data.status === 'ok') {
      status.value = 'online'
      label.value = 'Online'
    } else {
      status.value = 'offline'
      label.value = 'Offline'
    }
  } catch (err) {
    status.value = 'offline'
    label.value = 'Offline'
  }
}

let intervalId
onMounted(() => {
  checkHealth()
  intervalId = setInterval(checkHealth, 10000) // poll every 10s
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style lang="scss" scoped>
.connectivity-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
  transition: all 0.2s ease;

  &.online {
    background-color: rgba(34, 211, 160, 0.12);
    color: #22D3A0;
    border: 1px solid rgba(34, 211, 160, 0.3);
  }

  &.offline {
    background-color: rgba(255, 90, 110, 0.12);
    color: #FF5A6E;
    border: 1px solid rgba(255, 90, 110, 0.3);
  }

  &.unknown {
    background-color: rgba(90, 200, 250, 0.12);
    color: #5AC8FA;
    border: 1px solid rgba(90, 200, 250, 0.3);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;

    .online & {
      background-color: #22D3A0;
      box-shadow: 0 0 6px #22D3A0;
    }

    .offline & {
      background-color: #FF5A6E;
    }

    .unknown & {
      background-color: #5AC8FA;
      animation: pulse 1.5s infinite;
    }
  }

  .label {
    line-height: 1;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
