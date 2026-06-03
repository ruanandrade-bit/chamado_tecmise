import { LayoutDashboard, Kanban, Archive, FileText, Wifi, Package, Settings, X, EyeOff, StickyNote, Calendar, Trello } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'

export default function Sidebar({ currentPage, onPageChange, isMobileOpen, onMobileClose }) {
  const { getStatistics } = useTicketsStore()
  const { user } = useAuthStore()
  const stats = getStatistics()
  const uniqueResponsibles = Object.keys(stats.byResponsible).length
  const isAdmin = user?.canDragDrop === true

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Chamados', icon: Kanban },
    { id: 'archived', label: 'Chamados Resolvidos', icon: Archive },
    { id: 'monthly-report', label: 'Relatório Mensal', icon: FileText },
    { id: 'camera-obstruction', label: 'Obstrução de Câmeras', icon: EyeOff },
    { id: 'pedagogical-kanban', label: 'Kanban', icon: Trello },
    { id: 'notes', label: 'Anotações', icon: StickyNote },
    { id: 'deadlines', label: 'Datas & Prazos', icon: Calendar },
    ...(isAdmin ? [{ id: 'devices-online', label: 'Devices Online', icon: Wifi }] : []),
    ...(isAdmin ? [{ id: 'inventory', label: 'Estoque', icon: Package }] : []),
    ...(isAdmin ? [{ id: 'school-config', label: 'Configurações', icon: Settings }] : []),
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static left-0 top-16 h-[calc(100vh-4rem)] lg:h-screen
          w-64 bg-dark-800 border-r border-dark-700
          transition-transform duration-300 lg:translate-x-0 z-40
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id)
                    onMobileClose()
                  }}
                  className={`
                    w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${currentPage === item.id
                      ? 'bg-primary-light/20 text-primary-light border border-primary-light/30'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                    }
                  `}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="font-medium whitespace-nowrap leading-none">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-dark-700 space-y-2">
          <div className="px-3 py-2 text-xs text-dark-400">
            <p className="font-semibold text-dark-300 mb-3">INFORMAÇÕES</p>
            <div className="space-y-2 text-dark-500 text-xs">
              <p>📋 <strong>Total:</strong> {stats.total} chamado{stats.total !== 1 ? 's' : ''}</p>
              <p>✅ <strong>Concluídos:</strong> {stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Close button mobile */}
        <button
          onClick={onMobileClose}
          className="lg:hidden absolute top-4 right-4 p-2 hover:bg-dark-700 rounded-lg"
        >
          <X size={20} className="text-dark-300" />
        </button>
      </aside>
    </>
  )
}
