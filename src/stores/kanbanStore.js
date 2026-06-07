import { create } from 'zustand'
import { api } from '../services/api'

export const useKanbanStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: '',

  loadTasks: async () => {
    set({ isLoading: true, error: '' })
    try {
      const data = await api.get('/kanban')
      set({ tasks: data || [] })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  setTasks: (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      set((state) => ({ tasks: updaterOrValue(state.tasks) }))
    } else {
      set({ tasks: updaterOrValue })
    }
  }
}))
