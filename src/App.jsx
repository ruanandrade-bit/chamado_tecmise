import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuthStore } from './stores/authStore'
import { useTicketsStore } from './stores/ticketsStore'
import { useKanbanStore } from './stores/kanbanStore'
import Login from './components/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import NotificationCenter from './components/NotificationCenter'

const Dashboard        = lazy(() => import('./components/Dashboard'))
const Kanban           = lazy(() => import('./components/Kanban'))
const ArchivedTickets  = lazy(() => import('./components/ArchivedTickets'))
const MonthlyReport    = lazy(() => import('./components/MonthlyReport'))
const DevicesOnline    = lazy(() => import('./components/DevicesOnline'))
const Inventory        = lazy(() => import('./components/Inventory'))
const SchoolConfig     = lazy(() => import('./components/SchoolConfig'))
const CameraObstruction = lazy(() => import('./components/CameraObstruction'))
const Notes            = lazy(() => import('./components/Notes'))
const Deadlines        = lazy(() => import('./components/Deadlines'))
const PedagogicalKanban = lazy(() => import('./components/PedagogicalKanban'))
const ResolvedKanban   = lazy(() => import('./components/ResolvedKanban'))
const Children         = lazy(() => import('./components/Children'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
      Carregando...
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isAuthLoading, initAuth } = useAuthStore()
  const { bootstrap, loadTickets } = useTicketsStore()
  const { loadTasks } = useKanbanStore()
  const [currentPage, setCurrentPage] = useState('kanban')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const isKanbanPage = currentPage === 'kanban'
  const isWidePage = (
    isKanbanPage
    || currentPage === 'camera-obstruction'
    || currentPage === 'archived'
    || currentPage === 'monthly-report'
    || currentPage === 'school-config'
    || currentPage === 'inventory'
    || currentPage === 'devices-online'
    || currentPage === 'notes'
    || currentPage === 'deadlines'
    || currentPage === 'pedagogical-kanban'
    || currentPage === 'resolved-kanban'
    || currentPage === 'children'
  )

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (isAuthenticated) {
      bootstrap()
      loadTasks()
    }
  }, [isAuthenticated, bootstrap, loadTasks])

  // Polling: sync tickets every 5 seconds, pauses when tab is hidden
  useEffect(() => {
    if (!isAuthenticated) return

    let interval = setInterval(() => {
      if (!document.hidden) {
        loadTickets()
        loadTasks()
      }
    }, 5000)

    const handleVisibility = () => {
      if (!document.hidden) {
        loadTickets()
        loadTasks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isAuthenticated, loadTickets, loadTasks])

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
          <div className={isWidePage ? 'p-4 sm:p-6 lg:p-8 w-full max-w-none' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'}>
            <Suspense fallback={<PageLoader />}>
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'kanban' && <Kanban />}
              {currentPage === 'archived' && <ArchivedTickets />}
              {currentPage === 'monthly-report' && <MonthlyReport />}
              {currentPage === 'devices-online' && <DevicesOnline />}
              {currentPage === 'inventory' && <Inventory />}
              {currentPage === 'school-config' && <SchoolConfig />}
              {currentPage === 'camera-obstruction' && <CameraObstruction />}
              {currentPage === 'notes' && <Notes />}
              {currentPage === 'deadlines' && <Deadlines />}
              {currentPage === 'pedagogical-kanban' && <PedagogicalKanban />}
              {currentPage === 'resolved-kanban' && <ResolvedKanban />}
              {currentPage === 'children' && <Children />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
