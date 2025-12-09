<template>
  <div class="main-layout">
    <!-- Desktop: 3-column grid (left, center, right), Mobile: single column -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full max-w-7xl mx-auto px-4 lg:px-6 pt-4 lg:pt-6 pb-0 h-full">
      <!-- Left slot (Chat) -->
      <div class="lg:col-span-6 order-1 flex flex-col h-full min-h-0">
        <slot name="left">
          <!-- Default left slot content (placeholder) -->
          <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
            <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">Left Panel (Chat)</h2>
            <p class="text-text-secondary font-matrix-sans">
              This is the left panel for chat.
            </p>
          </div>
        </slot>
      </div>

      <!-- Center slot (System Log) -->
      <div class="lg:col-span-3 order-2 lg:order-2 flex flex-col h-full min-h-0">
        <slot name="center">
          <!-- Default center slot content (placeholder) -->
          <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
            <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">System Log</h2>
            <p class="text-text-secondary font-matrix-sans">
              This is the system log panel.
            </p>
          </div>
        </slot>
      </div>

      <!-- Right slot (Activity) -->
      <div class="lg:col-span-3 order-3 lg:order-3 flex flex-col h-full min-h-0">
        <slot name="right">
          <!-- Default right slot content (placeholder) -->
          <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
            <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">Activity Panel</h2>
            <p class="text-text-secondary font-matrix-sans">
              This is the activity panel.
            </p>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // Show sidebars on mobile (by default they're hidden on mobile)
  showLeftOnMobile: {
    type: Boolean,
    default: false
  },
  showRightOnMobile: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.main-layout {
  /* Fixed height: viewport minus header (3.5rem) and status bar (2.5rem) */
  height: calc(100vh - 3.5rem - 2.5rem);
}
</style>
