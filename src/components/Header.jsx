import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import NotificationsPanel from './NotificationsPanel'

/* ─── Confirm‑Logout Modal (premium glassmorphism) ─────────────────── */
function ConfirmLogoutModal({ isOpen, onClose, onConfirm, userName }) {
  if (!isOpen) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(99, 102, 241, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top indigo accent bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(99,102,241,0.8), rgba(99,102,241,0.6), transparent)',
          }}
        />

        {/* Indigo glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative p-6 flex flex-col items-center text-center space-y-5">
          {/* Icon */}
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.08) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
              boxShadow: '0 0 30px rgba(99,102,241,0.08)',
            }}
          >
            <LogOut size={32} style={{ color: '#818cf8' }} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              Sair da conta?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja sair da sua conta? Você precisará <strong style={{ color: '#818cf8' }}>fazer login novamente</strong>.
            </p>
          </div>

          {/* User info preview */}
          {userName && (
            <div
              className="w-full rounded-xl p-3 text-left"
              style={{
                background: 'rgba(99, 102, 241, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Conectado como:</p>
              <p className="text-sm font-semibold" style={{ color: '#a5b4fc' }}>
                {userName}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(100, 116, 139, 0.1)',
                color: '#94a3b8',
                border: '1px solid rgba(100, 116, 139, 0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.18)'
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.15)'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.75) 0%, rgba(79,70,229,0.85) 100%)',
                color: '#fff',
                border: '1px solid rgba(99,102,241,0.35)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(99,102,241,0.35)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <LogOut size={15} />
              Sim, sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────── */
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
              <img src="/logo.png" alt="Logo S4S" className="w-8 h-8 object-contain drop-shadow-sm" />
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
      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        userName={user?.name}
      />
    </>
  )
}

