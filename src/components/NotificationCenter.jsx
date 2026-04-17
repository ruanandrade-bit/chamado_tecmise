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

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (notifications.length === 0) return
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1))
    }, 6000)
    return () => clearTimeout(timer)
  }, [notifications])

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3" style={{ maxWidth: '380px', width: '100%' }}>
      {notifications.map((notification) => {
        const isSuccess = notification.type === 'success'
        return (
          <div
            key={notification.id}
            className="animate-slideInRight"
            style={{
              position: 'relative',
              background: isSuccess
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: isSuccess 
                ? '0 8px 32px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.05)'
                : '0 8px 32px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.05)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            {/* Icon with glow */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: isSuccess
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
                boxShadow: isSuccess
                  ? '0 0 12px rgba(16, 185, 129, 0.3)'
                  : '0 0 12px rgba(239, 68, 68, 0.3)',
              }}
            >
              {isSuccess ? (
                <CheckCircle size={20} style={{ color: '#34d399' }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#f87171' }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#f1f5f9',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {notification.title}
              </h3>
              <p
                style={{
                  fontSize: '12.5px',
                  color: isSuccess ? '#a7f3d0' : '#fca5a5',
                  margin: '4px 0 0 0',
                  lineHeight: 1.4,
                  opacity: 0.9,
                }}
              >
                {notification.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => removeNotification(notification.id)}
              style={{
                flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.color = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <X size={14} />
            </button>

            {/* Progress bar for auto-dismiss */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '16px',
                right: '16px',
                height: '2px',
                borderRadius: '1px',
                background: isSuccess
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '1px',
                  background: isSuccess ? '#34d399' : '#f87171',
                  animation: 'notifProgress 6s linear forwards',
                }}
              />
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes notifProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
