import { create } from 'zustand'
import { api } from '../services/api'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  initAuth: async () => {
    try {
      const { user } = await api.get('/auth/me')
      set({ user, isAuthenticated: true, isAuthLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
    }
  },

  login: async (email, password) => {
    try {
      const { user } = await api.post('/auth/login', { email, password })
      set({ user, isAuthenticated: true, isAuthLoading: false })
      return true
    } catch {
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
      return false
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout', {}) } catch { /* ignora erro de rede */ }
    set({ user: null, isAuthenticated: false, isAuthLoading: false })
  }
}))
