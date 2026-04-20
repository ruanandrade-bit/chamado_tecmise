import { AlertCircle, CheckCircle, MessageCircle, X } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'

const HISTORY_PREFIX = 's4s_notification_history:'
const BASE_TITLE = 'S4S Chamados'

function getHistoryKey(email) {
  return `${HISTORY_PREFIX}${email || 'guest'}`
}

function appendHistory(email, notifications) {
  if (!email || notifications.length === 0) return
  const history = JSON.parse(localStorage.getItem(getHistoryKey(email)) || '[]')
  const updated = [...history, ...notifications].slice(-50)
  localStorage.setItem(getHistoryKey(email), JSON.stringify(updated))
}

/**
 * Request browser notification permission on first interaction.
 */
function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

/**
 * Show a native browser notification.
 */
function showBrowserNotification(title, body) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `s4s-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    })

    // Auto-close after 6 seconds
    setTimeout(() => notification.close(), 6000)

    // Focus the tab when clicked
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // Service worker may be required on some browsers for Notification constructor
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const { user, isAuthenticated } = useAuthStore()
  const unreadCountRef = useRef(0)
  const hasRequestedPermission = useRef(false)

  // Request notification permission once the user interacts
  useEffect(() => {
    if (!isAuthenticated || hasRequestedPermission.current) return

    const requestOnInteraction = () => {
      requestNotificationPermission()
      hasRequestedPermission.current = true
      // Clean up listeners
      document.removeEventListener('click', requestOnInteraction)
      document.removeEventListener('keydown', requestOnInteraction)
    }

    document.addEventListener('click', requestOnInteraction, { once: true })
    document.addEventListener('keydown', requestOnInteraction, { once: true })

    return () => {
      document.removeEventListener('click', requestOnInteraction)
      document.removeEventListener('keydown', requestOnInteraction)
    }
  }, [isAuthenticated])

  // Update tab title with unread count (like WhatsApp)
  const updateTabTitle = useCallback((count) => {
    unreadCountRef.current = count
    if (count > 0) {
      document.title = `(${count}) ${BASE_TITLE}`
    } else {
      document.title = BASE_TITLE
    }
  }, [])

  // Keep tab title in sync with notification count
  useEffect(() => {
    updateTabTitle(notifications.length)
  }, [notifications.length, updateTabTitle])

  // Reset title on unmount
  useEffect(() => {
    return () => {
      document.title = BASE_TITLE
    }
  }, [])

  // Poll for new notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return

    const checkNotifications = async () => {
      try {
        const { notifications: notes } = await api.get('/notifications')
        if (Array.isArray(notes) && notes.length > 0) {
          setNotifications((prev) => [...prev, ...notes].slice(-5))
          appendHistory(user.email, notes)

          // Show browser native notification for each new one
          notes.forEach((note) => {
            showBrowserNotification(
              note.title?.replace(/^[\p{Emoji}\s]+/u, '') || 'S4S Chamados',
              note.message
            )
          })
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

  const getNotifStyle = (type) => {
    if (type === 'success') {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)',
        border: 'rgba(16, 185, 129, 0.35)',
        shadow: '0 8px 32px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.05)',
        iconBg: 'rgba(16, 185, 129, 0.2)',
        iconGlow: '0 0 12px rgba(16, 185, 129, 0.3)',
        iconColor: '#34d399',
        textColor: '#a7f3d0',
        barColor: '#34d399',
        barBg: 'rgba(16, 185, 129, 0.15)',
      }
    }
    if (type === 'info') {
      return {
        bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 58, 138, 0.25) 100%)',
        border: 'rgba(59, 130, 246, 0.35)',
        shadow: '0 8px 32px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.05)',
        iconBg: 'rgba(59, 130, 246, 0.2)',
        iconGlow: '0 0 12px rgba(59, 130, 246, 0.3)',
        iconColor: '#60a5fa',
        textColor: '#bfdbfe',
        barColor: '#60a5fa',
        barBg: 'rgba(59, 130, 246, 0.15)',
      }
    }
    // error / default
    return {
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.25) 100%)',
      border: 'rgba(239, 68, 68, 0.35)',
      shadow: '0 8px 32px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.05)',
      iconBg: 'rgba(239, 68, 68, 0.2)',
      iconGlow: '0 0 12px rgba(239, 68, 68, 0.3)',
      iconColor: '#f87171',
      textColor: '#fca5a5',
      barColor: '#f87171',
      barBg: 'rgba(239, 68, 68, 0.15)',
    }
  }

  const getIcon = (type) => {
    if (type === 'success') return <CheckCircle size={20} />
    if (type === 'info') return <MessageCircle size={20} />
    return <AlertCircle size={20} />
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3" style={{ maxWidth: '380px', width: '100%' }}>
      {notifications.map((notification) => {
        const s = getNotifStyle(notification.type)
        return (
          <div
            key={notification.id}
            className="animate-slideInRight"
            style={{
              position: 'relative',
              background: s.bg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${s.border}`,
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: s.shadow,
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
                background: s.iconBg,
                boxShadow: s.iconGlow,
                color: s.iconColor,
              }}
            >
              {getIcon(notification.type)}
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
                  color: s.textColor,
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
                background: s.barBg,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '1px',
                  background: s.barColor,
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
