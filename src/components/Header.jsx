import { Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import NotificationsPanel from './NotificationsPanel'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuthStore()

  return (
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
            <div className="w-8 h-8 bg-gradient-to-br from-primary-light to-primary rounded-lg flex items-center justify-center font-bold text-dark-950">
              S4
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
              onClick={logout}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-dark-300 hover:text-red-400"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
