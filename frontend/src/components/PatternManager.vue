<template>
  <div class="pattern-manager bg-bg-layer border border-line-base rounded-xl p-6 shadow-matrix-glow h-full flex flex-col">
    <!-- Header with Search and Create -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-text-primary font-matrix-wide">Pattern Library</h2>
      <button 
        class="btn-create px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-bg-base rounded-lg font-medium transition-colors duration-fast shadow-matrix-glow"
        @click="showCreateForm = true"
      >
        New Pattern
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-6 relative">
      <input
        type="search"
        v-model="searchQuery"
        @input="handleSearch"
        placeholder="Search patterns..."
        class="w-full bg-bg-base border border-line-base rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary placeholder-text-muted"
      />
      <div v-if="loading" class="absolute right-3 top-3">
        <div class="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Pattern List -->
    <div class="flex-1 overflow-y-auto space-y-4 pr-2">
      <div 
        v-for="pattern in patterns" 
        :key="pattern.id" 
        class="pattern-item bg-bg-base/50 border border-line-base rounded-lg p-4 hover:border-accent-primary/50 transition-colors"
      >
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-medium text-text-primary">{{ pattern.title }}</h3>
          <div class="flex space-x-2">
             <!-- Tags -->
            <span 
              v-for="tag in pattern.tags" 
              :key="tag"
              class="px-2 py-0.5 rounded text-xs bg-bg-layer border border-line-base text-text-secondary"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <p class="text-text-secondary text-sm mb-3 line-clamp-2">{{ pattern.solution }}</p>
        
        <div class="flex justify-end space-x-2">
            <button 
              @click="deletePattern(pattern.id)"
              class="text-xs text-status-error hover:text-status-error/80"
            >
              Delete
            </button>
        </div>
      </div>

      <div v-if="patterns.length === 0 && !loading" class="text-center text-text-muted py-8">
        No patterns found.
      </div>
    </div>

    <!-- Create Modal/Form -->
    <div v-if="showCreateForm" class="pattern-form fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-bg-layer border border-line-base rounded-xl p-6 w-full max-w-lg shadow-matrix-glow-lg">
        <h3 class="text-xl font-bold text-text-primary mb-4">Create New Pattern</h3>
        
        <form @submit.prevent="createPattern">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-1">Title</label>
              <input 
                v-model="newPattern.title" 
                required
                class="w-full bg-bg-base border border-line-base rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text-secondary mb-1">Problem</label>
              <textarea 
                v-model="newPattern.problem" 
                rows="2"
                class="w-full bg-bg-base border border-line-base rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-text-secondary mb-1">Solution</label>
              <textarea 
                v-model="newPattern.solution" 
                required
                rows="4"
                class="w-full bg-bg-base border border-line-base rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-text-secondary mb-1">Tags (comma separated)</label>
              <input 
                v-model="newPattern.tagsInput" 
                placeholder="frontend, vue, bug"
                class="w-full bg-bg-base border border-line-base rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              @click="showCreateForm = false"
              class="px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-bg-base rounded-lg font-medium shadow-matrix-glow"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Pattern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePatternsStore } from '../stores/patterns'

const store = usePatternsStore()
const patterns = computed(() => store.patterns)
const loading = computed(() => store.loading)

const searchQuery = ref('')
const showCreateForm = ref(false)
const newPattern = ref({
  title: '',
  problem: '',
  solution: '',
  tagsInput: ''
})

onMounted(() => {
  store.fetchPatterns()
})

const handleSearch = () => {
  // Simple debounce could be added here
  store.searchPatterns(searchQuery.value)
}

const createPattern = async () => {
  const tags = newPattern.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  try {
    await store.createPattern({
      title: newPattern.value.title,
      problem: newPattern.value.problem,
      solution: newPattern.value.solution,
      tags
    })
    
    // Reset and close
    showCreateForm.value = false
    newPattern.value = { title: '', problem: '', solution: '', tagsInput: '' }
  } catch (err) {
    // Error is handled in store
  }
}

const deletePattern = async (id) => {
  if (confirm('Are you sure you want to delete this pattern?')) {
    await store.deletePattern(id)
  }
}
</script>

<style scoped>
.pattern-manager {
  /* Inherit height from container */
}
</style>
