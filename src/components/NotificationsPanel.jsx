import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

const HISTORY_PREFIX = 's4s_notification_history:'

function getHistoryKey(email) {
  return `${HISTORY_PREFIX}${email || 'guest'}`
}

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationHistory, setNotificationHistory] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user?.email) return
    const history = JSON.parse(localStorage.getItem(getHistoryKey(user.email)) || '[]')
    setNotificationHistory(history)
  }, [isOpen, user?.email])

  const clearHistory = () => {
    if (!user?.email) return
    setNotificationHistory([])
    localStorage.removeItem(getHistoryKey(user.email))
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-dark-700 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-dark-300" />
        {notificationHistory.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-light rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl max-w-md w-full border border-dark-700 animate-slideInUp">
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-dark-100">Notificações</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-dark-300" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {notificationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={40} className="text-dark-500 mb-3 opacity-50" />
                  <p className="text-dark-400 text-sm">Sem notificações no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationHistory.slice().reverse().map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        notification.type === 'success'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      {notification.type === 'success' ? (
                        <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-dark-100">{notification.title}</h3>
                        <p className="text-xs text-dark-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-dark-500 mt-2">
                          {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notificationHistory.length > 0 && (
              <div className="border-t border-dark-700 p-4">
                <button
                  onClick={clearHistory}
                  className="w-full px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm font-medium text-dark-300 transition-colors"
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
