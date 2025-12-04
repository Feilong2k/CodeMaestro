<template>
  <div class="main-layout">
    <!-- Desktop: 3-column grid, Mobile: single column -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
      <!-- Left sidebar slot - hidden on mobile, visible on large screens -->
      <aside
        class="lg:col-span-3 xl:col-span-2 order-2 lg:order-1"
        :class="[!showLeftOnMobile ? 'hidden' : '', 'lg:block']"
      >
        <div class="sticky top-20">
          <slot name="left">
            <!-- Default left slot content (placeholder) -->
            <div class="bg-bg-layer border border-line-base rounded-lg p-4 text-text-secondary text-sm">
              <h3 class="font-matrix-sans font-semibold text-text-primary mb-2">Left Sidebar</h3>
              <p class="font-matrix-mono text-xs">Placeholder for activity log, agents, etc.</p>
            </div>
          </slot>
        </div>
      </aside>

      <!-- Main content slot -->
      <main class="lg:col-span-6 xl:col-span-8 order-1 lg:order-2">
        <div class="w-full max-w-4xl mx-auto">
          <slot>
            <!-- Default slot content (placeholder) -->
            <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow">
              <h2 class="text-2xl font-bold text-text-primary font-matrix-sans mb-4">Main Content Area</h2>
              <p class="text-text-secondary font-matrix-sans">
                This is the main chat area. The layout provides a centered column with a maximum width of 960px.
              </p>
            </div>
          </slot>
        </div>
      </main>

      <!-- Right sidebar slot - hidden on mobile, visible on large screens -->
      <aside
        class="lg:col-span-3 xl:col-span-2 order-3"
        :class="[!showRightOnMobile ? 'hidden' : '', 'lg:block']"
      >
        <div class="sticky top-20">
          <slot name="right">
            <!-- Default right slot content (placeholder) -->
            <div class="bg-bg-layer border border-line-base rounded-lg p-4 text-text-secondary text-sm">
              <h3 class="font-matrix-sans font-semibold text-text-primary mb-2">Right Sidebar</h3>
              <p class="font-matrix-mono text-xs">Placeholder for status, tools, etc.</p>
            </div>
          </slot>
        </div>
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
  min-height: calc(100vh - 3.5rem); /* Subtract header height */
}
</style>
