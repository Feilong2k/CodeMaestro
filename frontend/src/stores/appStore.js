import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentView: 'plan', // 'plan' or 'act'
    currentProject: {
      id: 'project-1',
      name: 'Demo Project',
      description: 'A sample project for demonstration'
    }
  }),

  actions: {
    setCurrentView(view) {
      if (view === 'plan' || view === 'act') {
        this.currentView = view
      }
    },

    setCurrentProject(project) {
      this.currentProject = project
    }
  }
})
