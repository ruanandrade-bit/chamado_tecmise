import { useState, useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useTicketsStore } from './stores/ticketsStore'
import Login from './components/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Kanban from './components/Kanban'
import ArchivedTickets from './components/ArchivedTickets'
import MonthlyReport from './components/MonthlyReport'
import NotificationCenter from './components/NotificationCenter'

export default function App() {
  const { isAuthenticated, isAuthLoading, initAuth } = useAuthStore()
  const { bootstrap, loadTickets } = useTicketsStore()
  const [currentPage, setCurrentPage] = useState('kanban')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (isAuthenticated) {
      bootstrap()
    }
  }, [isAuthenticated, bootstrap])

  // Polling: sync tickets every 5 seconds across tabs/users
  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      loadTickets()
    }, 5000)
    return () => clearInterval(interval)
  }, [isAuthenticated, loadTickets])

  useEffect(() => {
    // Close sidebar when page changes
    setIsMobileSidebarOpen(false)
  }, [currentPage])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-dark-300">
        Carregando...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div className="flex h-screen bg-dark-950 text-dark-100">
      {/* Notifications */}
      <NotificationCenter />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'kanban' && <Kanban />}
            {currentPage === 'archived' && <ArchivedTickets />}
            {currentPage === 'monthly-report' && <MonthlyReport />}
          </div>
        </main>
      </div>
    </div>
  )
}
