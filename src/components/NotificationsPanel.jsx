import { Bell, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'

const HISTORY_PREFIX = 's4s_notification_history:'
const LAST_READ_PREFIX = 's4s_notification_read:'

function getHistoryKey(email) {
  return `${HISTORY_PREFIX}${email || 'guest'}`
}

function getLastReadKey(email) {
  return `${LAST_READ_PREFIX}${email || 'guest'}`
}

function timeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin < 60) return `${diffMin}min atrás`
  if (diffHour < 24) return `${diffHour}h atrás`
  return `${diffDay}d atrás`
}

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState([])
  const [hasUnread, setHasUnread] = useState(false)
  const { user } = useAuthStore()

  // Check for unread notifications
  const checkUnread = useCallback(() => {
    if (!user?.email) return
    const history = JSON.parse(localStorage.getItem(getHistoryKey(user.email)) || '[]')
    const lastRead = localStorage.getItem(getLastReadKey(user.email)) || '0'
    const unread = history.some((n) => new Date(n.timestamp).getTime() > Number(lastRead))
    setHasUnread(unread)
  }, [user?.email])

  useEffect(() => {
    if (!user?.email) return
    const history = JSON.parse(localStorage.getItem(getHistoryKey(user.email)) || '[]')
    setNotificationHistory(history)
    checkUnread()
  }, [isOpen, user?.email, checkUnread])

  // Poll for new notifications to update the badge
  useEffect(() => {
    if (!user?.email) return
    const interval = setInterval(checkUnread, 2000)
    return () => clearInterval(interval)
  }, [user?.email, checkUnread])

  // Mark as read when opening the panel
  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && user?.email) {
      localStorage.setItem(getLastReadKey(user.email), String(Date.now()))
      setHasUnread(false)
    }
  }

  const clearHistory = () => {
    if (!user?.email) return
    setNotificationHistory([])
    localStorage.removeItem(getHistoryKey(user.email))
    setHasUnread(false)
  }

  return (
    <>
      {/* Bell button with badge */}
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors"
        style={{ position: 'relative' }}
      >
        <Bell size={20} className="text-dark-300" />
        {hasUnread && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399, #10b981)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            }}
          />
        )}
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            className="animate-slideInUp"
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={18} style={{ color: '#34d399' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    Notificações
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    {notificationHistory.length === 0
                      ? 'Nenhuma notificação'
                      : `${notificationHistory.length} ${notificationHistory.length === 1 ? 'notificação' : 'notificações'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)'
                  e.currentTarget.style.color = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '12px 16px', maxHeight: '400px', overflowY: 'auto' }}>
              {notificationHistory.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'rgba(148, 163, 184, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Bell size={28} style={{ color: '#334155', opacity: 0.6 }} />
                  </div>
                  <p style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                    Sem notificações
                  </p>
                  <p style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                    As notificações aparecerão aqui
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notificationHistory
                    .slice()
                    .reverse()
                    .map((notification) => {
                      const isSuccess = notification.type === 'success'
                      return (
                        <div
                          key={notification.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '14px 16px',
                            borderRadius: '14px',
                            background: isSuccess
                              ? 'rgba(16, 185, 129, 0.06)'
                              : 'rgba(239, 68, 68, 0.06)',
                            border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}`,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isSuccess
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isSuccess
                              ? 'rgba(16, 185, 129, 0.06)'
                              : 'rgba(239, 68, 68, 0.06)'
                          }}
                        >
                          {/* Icon */}
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background: isSuccess
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            }}
                          >
                            {isSuccess ? (
                              <CheckCircle size={16} style={{ color: '#34d399' }} />
                            ) : (
                              <AlertCircle size={16} style={{ color: '#f87171' }} />
                            )}
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#e2e8f0',
                                margin: 0,
                                lineHeight: 1.3,
                              }}
                            >
                              {notification.title}
                            </h3>
                            <p
                              style={{
                                fontSize: '12px',
                                color: '#94a3b8',
                                margin: '3px 0 0 0',
                                lineHeight: 1.4,
                              }}
                            >
                              {notification.message}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '6px',
                              }}
                            >
                              <Clock size={10} style={{ color: '#475569' }} />
                              <span style={{ fontSize: '11px', color: '#475569' }}>
                                {timeAgo(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificationHistory.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                  padding: '12px 16px',
                }}
              >
                <button
                  onClick={clearHistory}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.08)',
                    background: 'rgba(148, 163, 184, 0.04)',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'
                    e.currentTarget.style.color = '#94a3b8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.04)'
                    e.currentTarget.style.color = '#64748b'
                  }}
                >
                  Limpar histórico
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
