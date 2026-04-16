import { create } from 'zustand'
import { api } from '../services/api'

const AUTH_TOKEN_KEY = 's4s_auth_token'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  initAuth: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
      return
    }

    try {
      const { user } = await api.get('/auth/me')
      set({ user, isAuthenticated: true, isAuthLoading: false })
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
    }
  },

  login: async (email, password) => {
    try {
      const { token, user } = await api.post('/auth/login', { email, password })
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      set({ user, isAuthenticated: true, isAuthLoading: false })
      return true
    } catch {
      set({ user: null, isAuthenticated: false, isAuthLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    set({ user: null, isAuthenticated: false, isAuthLoading: false })
  }
}))
