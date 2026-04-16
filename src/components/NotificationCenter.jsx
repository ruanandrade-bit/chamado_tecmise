import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'

const HISTORY_PREFIX = 's4s_notification_history:'

function getHistoryKey(email) {
  return `${HISTORY_PREFIX}${email || 'guest'}`
}

function appendHistory(email, notifications) {
  if (!email || notifications.length === 0) return
  const history = JSON.parse(localStorage.getItem(getHistoryKey(email)) || '[]')
  const updated = [...history, ...notifications].slice(-50)
  localStorage.setItem(getHistoryKey(email), JSON.stringify(updated))
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !user?.email) return

    const checkNotifications = async () => {
      try {
        const { notifications: notes } = await api.get('/notifications')
        if (Array.isArray(notes) && notes.length > 0) {
          setNotifications((prev) => [...prev, ...notes].slice(-5))
          appendHistory(user.email, notes)
        }
      } catch {
        // Keep UI running even if backend is unavailable momentarily.
      }
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 1500)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.email])

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border animate-slideInRight ${
            notification.type === 'success'
              ? 'bg-green-500/20 border-green-500/50 text-green-300'
              : 'bg-red-500/20 border-red-500/50 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{notification.title}</h3>
            <p className="text-xs opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
