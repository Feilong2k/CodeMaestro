<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
    <div class="bg-gray-900 border border-matrix-base rounded-lg w-[400px] shadow-2xl shadow-matrix-base/20 p-6">
      <h2 class="text-lg font-bold text-matrix-base mb-4">Create New Project</h2>
      
      <form @submit.prevent="createProject">
        <div class="mb-4">
          <label class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Project Name</label>
          <input 
            v-model="form.name"
            type="text" 
            placeholder="e.g. CodeMaestro"
            class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-gray-300 focus:border-matrix-base focus:outline-none focus:ring-1 focus:ring-matrix-base transition-colors"
            required
          />
        </div>

        <div class="mb-4">
          <label class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Local Path</label>
          <input 
            v-model="form.path"
            type="text" 
            placeholder="e.g. C:/Coding/ProjectName"
            class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-gray-300 focus:border-matrix-base focus:outline-none focus:ring-1 focus:ring-matrix-base transition-colors"
            required
          />
          <p class="text-[10px] text-gray-500 mt-1">Absolute path to the project directory.</p>
        </div>

        <div class="mb-6">
          <label class="block text-xs uppercase tracking-wider text-gray-500 mb-1">Description</label>
          <textarea 
            v-model="form.description"
            rows="3"
            placeholder="Optional project description..."
            class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-gray-300 focus:border-matrix-base focus:outline-none focus:ring-1 focus:ring-matrix-base transition-colors resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button 
            type="button" 
            @click="$emit('close')"
            class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="loading"
            class="px-4 py-2 bg-matrix-dim bg-opacity-20 text-matrix-base border border-matrix-base rounded hover:bg-opacity-30 transition-all text-sm font-medium flex items-center"
          >
            <span v-if="loading" class="mr-2 animate-spin">⟳</span>
            {{ loading ? 'Creating...' : 'Create Project' }}
          </button>
        </div>
        
        <p v-if="error" class="mt-3 text-xs text-red-500 text-center">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useProjectStore } from '../stores/project';

const emit = defineEmits(['close', 'created']);
const projectsStore = useProjectStore();

const form = reactive({
  name: '',
  path: '',
  description: ''
});

const loading = ref(false);
const error = ref(null);

async function createProject() {
  loading.value = true;
  error.value = null;
  
  try {
    await projectsStore.createProject({ ...form });
    emit('created');
  } catch (err) {
    error.value = err.message || 'Failed to create project';
  } finally {
    loading.value = false;
  }
}
</script>

