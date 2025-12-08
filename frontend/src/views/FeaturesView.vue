<template>
  <div class="features-view">
    <div class="header">
      <h1 class="title">Feature Backlog</h1>
      <p class="subtitle">
        Future features and enhancements for CodeMaestro, migrated from markdown to database.
      </p>
    </div>

    <div class="controls">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search features by title or description..."
          class="search-input"
          @input="onSearchInput"
        />
        <div class="search-icon">🔍</div>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label class="filter-label">Priority:</label>
          <div class="filter-buttons">
            <button
              v-for="priority in priorityOptions"
              :key="priority.value"
              :class="['filter-button', { active: selectedPriority === priority.value }]"
              @click="togglePriority(priority.value)"
            >
              {{ priority.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Phase:</label>
          <div class="filter-buttons">
            <button
              v-for="phase in phaseOptions"
              :key="phase.value"
              :class="['filter-button', { active: selectedPhase === phase.value }]"
              @click="togglePhase(phase.value)"
            >
              {{ phase.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading features...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="retry-button" @click="loadFeatures">Retry</button>
    </div>

    <div v-else-if="filteredFeatures.length === 0" class="empty">
      <div class="empty-icon">📋</div>
      <p>No features found.</p>
      <button class="reset-button" @click="resetFilters">Reset Filters</button>
    </div>

    <div v-else class="features-grid">
      <div
        v-for="feature in filteredFeatures"
        :key="feature.id"
        class="feature-card"
        :class="`priority-${feature.priority}`"
      >
        <div class="feature-header">
          <div class="feature-title-row">
            <h3 class="feature-title">{{ feature.title }}</h3>
            <div class="feature-badges">
              <span class="badge priority" :class="feature.priority">
                {{ feature.priority }}
              </span>
              <span class="badge phase">
                {{ formatPhase(feature.phase) }}
              </span>
            </div>
          </div>
          <p class="feature-description">{{ truncateDescription(feature.description) }}</p>
        </div>

        <div class="feature-footer">
          <div class="feature-tags">
            <span
              v-for="tag in feature.tags?.slice(0, 3)"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
            <span v-if="feature.tags?.length > 3" class="tag more">
              +{{ feature.tags.length - 3 }}
            </span>
          </div>
          <div class="feature-actions">
            <button class="action-button" @click="viewFeature(feature)">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Detail Modal -->
    <div v-if="selectedFeature" class="modal-overlay" @click="selectedFeature = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedFeature.title }}</h2>
          <button class="modal-close" @click="selectedFeature = null">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>Description</h4>
            <p class="detail-description">{{ selectedFeature.description }}</p>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Priority:</span>
              <span class="detail-value" :class="selectedFeature.priority">
                {{ selectedFeature.priority }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phase:</span>
              <span class="detail-value">{{ formatPhase(selectedFeature.phase) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(selectedFeature.created_at) }}</span>
            </div>
          </div>
          <div class="detail-section">
            <h4>Tags</h4>
            <div class="detail-tags">
              <span
                v-for="tag in selectedFeature.tags"
                :key="tag"
                class="detail-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-button close" @click="selectedFeature = null">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../stores/appStore';

export default {
  name: 'FeaturesView',
  setup() {
    const store = useStore();
    const features = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const selectedPriority = ref(null);
    const selectedPhase = ref(null);
    const selectedFeature = ref(null);

    const priorityOptions = [
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ];

    const phaseOptions = [
      { value: 'phase-a', label: 'Phase A' },
      { value: 'phase-b', label: 'Phase B' },
      { value: 'phase-c', label: 'Phase C' },
      { value: 'phase-d', label: 'Phase D' },
      { value: 'planning', label: 'Planning' }
    ];

    const loadFeatures = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await fetch('/api/features');
        if (!response.ok) {
          throw new Error(`Failed to load features: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          features.value = data.data;
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error loading features:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const filteredFeatures = computed(() => {
      let filtered = features.value;

      // Apply search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(feature =>
          feature.title.toLowerCase().includes(query) ||
          feature.description.toLowerCase().includes(query)
        );
      }

      // Apply priority filter
      if (selectedPriority.value) {
        filtered = filtered.filter(feature => feature.priority === selectedPriority.value);
      }

      // Apply phase filter
      if (selectedPhase.value) {
        filtered = filtered.filter(feature => feature.phase === selectedPhase.value);
      }

      // Sort by priority (high > medium > low) then by creation date
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return filtered.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    });

    const onSearchInput = () => {
      // Debounce would be nice but for simplicity we'll just use immediate filtering
    };

    const togglePriority = (priority) => {
      selectedPriority.value = selectedPriority.value === priority ? null : priority;
    };

    const togglePhase = (phase) => {
      selectedPhase.value = selectedPhase.value === phase ? null : phase;
    };

    const resetFilters = () => {
      searchQuery.value = '';
      selectedPriority.value = null;
      selectedPhase.value = null;
    };

    const truncateDescription = (text) => {
      const maxLength = 150;
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const formatPhase = (phase) => {
      const phaseMap = {
        'phase-a': 'Phase A',
        'phase-b': 'Phase B',
        'phase-c': 'Phase C',
        'phase-d': 'Phase D',
        'planning': 'Planning'
      };
      return phaseMap[phase] || phase;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const viewFeature = (feature) => {
      selectedFeature.value = feature;
    };

    onMounted(() => {
      loadFeatures();
    });

    return {
      features,
      loading,
      error,
      searchQuery,
      selectedPriority,
      selectedPhase,
      selectedFeature,
      priorityOptions,
      phaseOptions,
      filteredFeatures,
      loadFeatures,
      onSearchInput,
      togglePriority,
      togglePhase,
      resetFilters,
      truncateDescription,
      formatPhase,
      formatDate,
      viewFeature
    };
  }
};
</script>

<style scoped>
.features-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.controls {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--background);
  color: var(--text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-button {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border);
  border-radius: 6px;
  background: var(--background);
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-button:hover {
  border-color: var(--primary);
}

.filter-button.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-button,
.reset-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.retry-button:hover,
.reset-button:hover {
  opacity: 0.9;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid var(--border);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.feature-card.priority-high {
  border-left-color: #ef4444;
}

.feature-card.priority-medium {
  border-left-color: #f59e0b;
}

.feature-card.priority-low {
  border-left-color: #10b981;
}

.feature-header {
  margin-bottom: 1rem;
  flex: 1;
}

.feature-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.feature-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.priority {
  color: white;
}

.badge.priority.high {
  background: #ef4444;
}

.badge.priority.medium {
  background: #f59e0b;
}

.badge.priority.low {
  background: #10b981;
}

.badge.phase {
  background: var(--accent);
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.feature-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.feature-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: var(--background);
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 0.75rem;
}

.tag.more {
  background: transparent;
  color: var(--text-secondary);
}

.action-button {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.action-button:hover {
  opacity: 0.9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--surface);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.detail-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 600;
  color: var(--text-primary);
}

.detail-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-tag {
  padding: 0.375rem 0.75rem;
  background: var(--background);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.modal-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.modal-button.close {
  background: var(--background);
  color: var(--text-primary);
}

.modal-button.close:hover {
  background: var(--border);
}

/* Responsive */
@media (max-width: 768px) {
  .features-view {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }
}
</style>
