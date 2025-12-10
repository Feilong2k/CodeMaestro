<template>
  <div class="main-layout">
    <!-- Desktop: 2-column grid (left, right), Mobile: single column -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-[95vw] mx-auto px-4 lg:px-6 pt-4 lg:pt-6 pb-0 h-full">
      <!-- Left slot (Chat) as aside -->
      <aside
        class="lg:col-span-6 order-1 flex flex-col h-full min-h-0"
        :class="[!showLeftOnMobile ? 'hidden' : '', 'lg:block']"
      >
        <slot name="left">
          <!-- Default left slot content (placeholder) -->
          <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
            <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">Left Panel (Chat)</h2>
            <p class="text-text-secondary font-matrix-sans">
              This is the left panel for chat.
            </p>
          </div>
        </slot>
      </aside>

      <!-- Right slot (Combined Log Panel) as aside -->
      <aside
        class="lg:col-span-6 order-2 lg:order-2 flex flex-col h-full min-h-0"
        :class="[!showRightOnMobile ? 'hidden' : '', 'lg:block']"
      >
        <slot name="right">
          <!-- Default right slot content (placeholder) -->
          <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
            <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">Right Panel (Logs)</h2>
            <p class="text-text-secondary font-matrix-sans">
              This is the right panel for combined logs.
            </p>
          </div>
        </slot>
      </aside>
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
