import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentView: 'dashboard', // 'dashboard', 'patterns', or 'workflows'
    showTaskDashboard: false  // Modal state for task dashboard
  }),

  actions: {
    setCurrentView(view) {
      this.currentView = view
    },
    toggleTaskDashboard() {
      this.showTaskDashboard = !this.showTaskDashboard
    },
    closeTaskDashboard() {
      this.showTaskDashboard = false
    }
  }
})
