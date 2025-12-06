import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentView: 'dashboard' // 'dashboard' or 'patterns'
  }),

  actions: {
    setCurrentView(view) {
      this.currentView = view
    }
  }
})
