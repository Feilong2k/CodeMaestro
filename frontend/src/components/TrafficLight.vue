<template>
  <div class="traffic-light flex items-center space-x-2" :class="activeColor">
    <div
      v-for="light in lights"
      :key="light.color"
      class="w-3 h-3 rounded-full shadow-matrix-glow transition-opacity duration-300"
      :class="[
        light.color === activeColor ? light.bgClass : light.bgClass + '/30',
        light.color
      ]"
      :title="light.label"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'idle', // 'active', 'idle', 'error'
    validator: (value) => ['active', 'idle', 'error'].includes(value)
  }
})

const lights = [
  { color: 'green', bgClass: 'bg-green-500', label: 'Agent active' },
  { color: 'yellow', bgClass: 'bg-yellow-500', label: 'Agent idle' },
  { color: 'red', bgClass: 'bg-red-500', label: 'Offline/Error' }
]

const activeColor = computed(() => {
  switch (props.status) {
    case 'active': return 'green'
    case 'error': return 'red'
    default: return 'yellow' // idle
  }
})
</script>
