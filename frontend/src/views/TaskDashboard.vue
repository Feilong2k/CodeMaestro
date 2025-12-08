<template>
  <div class="task-dashboard">
    <div class="header">
      <h1 class="title">Task Queue Dashboard</h1>
      <p class="subtitle">
        Monitor and manage background tasks in the CodeMaestro system.
      </p>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card" :class="`status-${stat.status}`" v-for="stat in stats" :key="stat.status">
        <div class="stat-value">{{ stat.count }}</div>
        <div class="stat-label">{{ formatStatus(stat.status) }}</div>
      </div>
      <div class="stat-card total">
        <div class="stat-value">{{ totalTasks }}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
    </div>

    <div class="controls">
      <div class="filters">
        <div class="filter-group">
          <label class="filter-label">Status:</label>
          <div class="filter-buttons">
            <button
              v-for="status in statusOptions"
              :key="status.value"
              :class="['filter-button', { active: selectedStatus === status.value }]"
              @click="toggleStatus(status.value)"
            >
              {{ status.label }}
            </button>
            <button
              class="filter-button"
              :class="{ active: selectedStatus === null }"
              @click="selectedStatus = null"
            >
              All
            </button>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="action-button refresh" @click="loadTasks">
          <span class="icon">↻</span> Refresh
        </button>
        <button class="action-button delete" @click="clearCompleted" :disabled="deleting">
          <span class="icon">🗑️</span> Clear Completed
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading tasks...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="retry-button" @click="loadTasks">Retry</button>
    </div>

    <div v-else-if="tasks.length === 0" class="empty">
      <div class="empty-icon">📋</div>
      <p>No tasks found.</p>
    </div>

    <div v-else class="tasks-table-container">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Started</th>
            <th>Completed</th>
            <th>Worker</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id" :class="`status-${task.status}`">
            <td class="id-cell">{{ task.id }}</td>
            <td class="type-cell">
              <span class="type-badge">{{ task.type }}</span>
            </td>
            <td class="status-cell">
              <span class="status-badge" :class="task.status">{{ formatStatus(task.status) }}</span>
            </td>
            <td class="date-cell">{{ formatDate(task.created_at) }}</td>
            <td class="date-cell">{{ formatDate(task.started_at) }}</td>
            <td class="date-cell">{{ formatDate(task.completed_at) }}</td>
            <td class="worker-cell">{{ task.worker_id || '-' }}</td>
            <td class="actions-cell">
              <button
                v-if="task.status === 'failed'"
                class="action-btn retry"
                @click="retryTask(task.id)"
                :disabled="retryingTask === task.id"
              >
                <span class="btn-icon">↻</span> Retry
              </button>
              <button
                v-if="task.status === 'completed' || task.status === 'failed'"
                class="action-btn delete"
                @click="deleteTask(task.id)"
                :disabled="deletingTask === task.id"
              >
                <span class="btn-icon">🗑️</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="prevPage">
          ← Previous
        </button>
        <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
        <button class="page-btn" :disabled="page >= totalPages" @click="nextPage">
          Next →
        </button>
      </div>
    </div>

    <!-- Confirmation Modal for Clear Completed -->
    <div v-if="showClearModal" class="modal-overlay" @click="showClearModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Clear Completed Tasks</h3>
          <button class="modal-close" @click="showClearModal = false">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete all completed tasks? This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showClearModal = false">Cancel</button>
          <button class="modal-btn confirm" @click="confirmClearCompleted">Delete All</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'TaskDashboard',
  setup() {
    const tasks = ref([]);
    const stats = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selectedStatus = ref(null);
    const page = ref(1);
    const limit = 10;
    const totalTasks = ref(0);
    const retryingTask = ref(null);
    const deletingTask = ref(null);
    const deleting = ref(false);
    const showClearModal = ref(false);

    const statusOptions = [
      { value: 'pending', label: 'Pending' },
      { value: 'running', label: 'Running' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' }
    ];

    const loadStats = async () => {
      try {
        const response = await fetch('/api/tasks/stats');
        if (!response.ok) throw new Error(`Failed to load stats: ${response.statusText}`);
        const data = await response.json();
        stats.value = data;
      } catch (err) {
        console.error('Error loading stats:', err);
        // Non-critical error, don't set error state
      }
    };

    const loadTasks = async () => {
      loading.value = true;
      error.value = null;
      try {
        const params = new URLSearchParams({
          page: page.value,
          limit: limit
        });
        if (selectedStatus.value) {
          params.append('status', selectedStatus.value);
        }
        const response = await fetch(`/api/tasks?${params}`);
        if (!response.ok) throw new Error(`Failed to load tasks: ${response.statusText}`);
        const data = await response.json();
        tasks.value = data;
        // Estimate total tasks from stats if available
        if (stats.value.length > 0) {
          totalTasks.value = stats.value.reduce((sum, stat) => sum + stat.count, 0);
        } else {
          totalTasks.value = data.length; // approximation
        }
      } catch (err) {
        console.error('Error loading tasks:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const retryTask = async (taskId) => {
      retryingTask.value = taskId;
      try {
        const response = await fetch(`/api/tasks/${taskId}/retry`, { method: 'POST' });
        if (!response.ok) throw new Error(`Failed to retry task: ${response.statusText}`);
        // Refresh both tasks and stats
        await Promise.all([loadTasks(), loadStats()]);
      } catch (err) {
        console.error('Error retrying task:', err);
        alert('Failed to retry task: ' + err.message);
      } finally {
        retryingTask.value = null;
      }
    };

    const deleteTask = async (taskId) => {
      deletingTask.value = taskId;
      try {
        const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete task: ${response.statusText}`);
        // Remove from local array
        tasks.value = tasks.value.filter(t => t.id !== taskId);
        // Refresh stats
        await loadStats();
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task: ' + err.message);
      } finally {
        deletingTask.value = null;
      }
    };

    const clearCompleted = () => {
      showClearModal.value = true;
    };

    const confirmClearCompleted = async () => {
      deleting.value = true;
      try {
        // Get all completed tasks
        const completedTasks = tasks.value.filter(t => t.status === 'completed');
        // Delete each (could be optimized with bulk delete endpoint)
        for (const task of completedTasks) {
          await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
        }
        // Refresh
        await Promise.all([loadTasks(), loadStats()]);
        showClearModal.value = false;
      } catch (err) {
        console.error('Error clearing completed tasks:', err);
        alert('Failed to clear completed tasks: ' + err.message);
      } finally {
        deleting.value = false;
      }
    };

    const toggleStatus = (status) => {
      if (selectedStatus.value === status) {
        selectedStatus.value = null;
      } else {
        selectedStatus.value = status;
        page.value = 1;
      }
    };

    const prevPage = () => {
      if (page.value > 1) {
        page.value--;
      }
    };

    const nextPage = () => {
      // Simple check - if we have fewer tasks than limit, probably last page
      if (tasks.value.length === limit) {
        page.value++;
      }
    };

    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(totalTasks.value / limit));
    });

    const formatStatus = (status) => {
      const map = {
        pending: 'Pending',
        running: 'Running',
        completed: 'Completed',
        failed: 'Failed'
      };
      return map[status] || status;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      loadStats();
      loadTasks();
    });

    // Watch page and selectedStatus changes
    const watchHandlers = {
      page: loadTasks,
      selectedStatus: () => {
        page.value = 1;
        loadTasks();
      }
    };

    return {
      tasks,
      stats,
      loading,
      error,
      selectedStatus,
      page,
      totalTasks,
      retryingTask,
      deletingTask,
      deleting,
      showClearModal,
      statusOptions,
      totalPages,
      loadTasks,
      retryTask,
      deleteTask,
      clearCompleted,
      confirmClearCompleted,
      toggleStatus,
      prevPage,
      nextPage,
      formatStatus,
      formatDate
    };
  }
};
</script>

<style scoped>
.task-dashboard {
  padding: 2rem;
  max-width: 1400px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-top: 4px solid var(--border);
}

.stat-card.status-pending {
  border-top-color: #f59e0b;
}

.stat-card.status-running {
  border-top-color: #3b82f6;
}

.stat-card.status-completed {
  border-top-color: #10b981;
}

.stat-card.status-failed {
  border-top-color: #ef4444;
}

.stat-card.total {
  border-top-color: #8b5cf6;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-card.status-pending .stat-value {
  color: #f59e0b;
}

.stat-card.status-running .stat-value {
  color: #3b82f6;
}

.stat-card.status-completed .stat-value {
  color: #10b981;
}

.stat-card.status-failed .stat-value {
  color: #ef4444;
}

.stat-card.total .stat-value {
  color: #8b5cf6;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  background: var(--surface);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters {
  flex: 1;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
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

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-button.refresh {
  background: var(--primary);
  color: white;
}

.action-button.delete {
  background: #ef4444;
  color: white;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button .icon {
  font-size: 1.1rem;
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

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.tasks-table-container {
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th {
  background: var(--background);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border);
}

.tasks-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
}

.tasks-table tbody tr:hover {
  background: var(--background);
}

.tasks-table .status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.running {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.type-badge {
  background: var(--background);
  color: var(--text-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn.retry {
  background: #f59e0b;
  color: white;
}

.action-btn.delete {
  background: #ef4444;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

.page-btn {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-weight: 500;
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
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
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

.modal-body p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn.cancel {
  background: var(--background);
  color: var(--text-primary);
}

.modal-btn.confirm {
  background: #ef4444;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .task-dashboard {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-buttons {
    justify-content: center;
  }

  .tasks-table {
    display: block;
    overflow-x: auto;
  }

  .actions-cell {
    flex-wrap: wrap;
  }
}
</style>
