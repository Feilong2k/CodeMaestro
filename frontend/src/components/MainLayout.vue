<template>
  <div class="main-layout">
    <!-- Desktop: 2-column grid (no left bar), Mobile: single column -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full max-w-7xl mx-auto px-4 lg:px-6 pt-4 lg:pt-6 pb-0">
      <!-- Main content slot - now takes more space because left bar is removed -->
      <main class="lg:col-span-7 xl:col-span-8 order-1 lg:order-1 flex flex-col">
        <div class="w-full max-w-4xl mx-auto flex-1">
          <slot>
            <!-- Default slot content (placeholder) -->
            <div class="bg-bg-elevated border border-line-base rounded-xl p-6 shadow-matrix-glow h-full">
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
        class="lg:col-span-5 xl:col-span-4 order-2"
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
  /* Fixed height: viewport minus header (3.5rem) and status bar (2.5rem) */
  height: calc(100vh - 3.5rem - 2.5rem);
}
</style>
