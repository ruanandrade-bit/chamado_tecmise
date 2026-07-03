import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'error', duration = 4000) => {
    const id = Date.now() + Math.random()
    set(s => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}))

export const toast = {
  error:   (msg) => useToastStore.getState().addToast(msg, 'error', 5000),
  success: (msg) => useToastStore.getState().addToast(msg, 'success', 3000),
  warning: (msg) => useToastStore.getState().addToast(msg, 'warning', 4000),
  info:    (msg) => useToastStore.getState().addToast(msg, 'info', 3500),
}
