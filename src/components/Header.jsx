import { useState } from 'react'
import { Menu, LogOut, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import NotificationsPanel from './NotificationsPanel'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    logout()
    setShowLogoutModal(false)
  }

  return (
    <>
      <header className="bg-dark-800 border-b border-dark-700 h-16 flex items-center px-6 sticky top-0 z-40">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-dark-300" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-lg flex items-center justify-center font-bold text-xs text-dark-950">
                S4S
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
                  S4S Chamados
                </h1>
                <p className="text-xs text-dark-400">Gestão de Atendimento</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsPanel />
            
            <div className="flex items-center gap-3 pl-4 border-l border-dark-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-dark-100">{user?.name}</p>
                <p className="text-xs text-dark-400">{user?.role}</p>
              </div>
              
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-red-400"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-800 rounded-2xl max-w-sm w-full border border-dark-700 animate-slideInUp overflow-hidden">
            {/* Icon */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-dark-100 mb-2">Sair da conta?</h3>
              <p className="text-sm text-dark-400 text-center">
                Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="btn-base flex-1 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 hover:text-red-200"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
