import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentView: 'dashboard' // 'dashboard', 'patterns', or 'workflows'
  }),

  actions: {
    setCurrentView(view) {
      this.currentView = view
    }
  }
})
