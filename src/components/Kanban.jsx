import { useState } from 'react'
import { Plus, Archive, Loader2 } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import CreateTicketModal from './CreateTicketModal'
import TicketDetailsModal from './TicketDetailsModal'

/* ─── Confirm‑Archive Modal (premium glassmorphism) ────────────────── */
function ConfirmArchiveModal({ isOpen, onClose, onConfirm, isArchiving, ticket }) {
  if (!isOpen || !ticket) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isArchiving) onClose()
  }

  const previewText = ticket.title || ticket.description || ''

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
        onClick={!isArchiving ? onClose : undefined}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245, 158, 11, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top amber accent bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), rgba(245,158,11,0.8), rgba(245,158,11,0.6), transparent)',
          }}
        />

        {/* Amber glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative p-6 flex flex-col items-center text-center space-y-5">
          {/* Animated icon */}
          <div
            className="w-18 h-18 rounded-2xl flex items-center justify-center"
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 0 30px rgba(245,158,11,0.08)',
            }}
          >
            <Archive size={32} style={{ color: '#fbbf24' }} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              Arquivar Chamado?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja arquivar este chamado? Essa ação <strong style={{ color: '#fbbf24' }}>não poderá ser revertida</strong>.
            </p>
          </div>

          {/* Preview of ticket being archived */}
          <div
            className="w-full rounded-xl p-3 text-left"
            style={{
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.1)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Chamado a ser arquivado:</p>
            <p className="text-sm font-semibold mb-0.5" style={{ color: '#fbbf24' }}>
              #{ticket.id}
            </p>
            {previewText && (
              <p className="text-sm line-clamp-3" style={{ color: '#cbd5e1' }}>
                {previewText.length > 120 ? previewText.slice(0, 120) + '…' : previewText}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onClose}
              disabled={isArchiving}
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
              disabled={isArchiving}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: isArchiving
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.75) 0%, rgba(217,119,6,0.85) 100%)',
                color: '#fff',
                border: '1px solid rgba(245,158,11,0.35)',
                boxShadow: isArchiving ? 'none' : '0 4px 20px rgba(245,158,11,0.2)',
                cursor: isArchiving ? 'not-allowed' : 'pointer',
                opacity: isArchiving ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isArchiving) {
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(245,158,11,0.35)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isArchiving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Arquivando...
                </>
              ) : (
                <>
                  <Archive size={15} />
                  Sim, arquivar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function Kanban() {
  const { tickets, getTicketsByStatus, moveTicket, archiveTicket, STATUSES } = useTicketsStore()
  const { user } = useAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketToArchive, setTicketToArchive] = useState(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const isViewOnly = user?.viewOnly === true

  const ticketsByStatus = getTicketsByStatus()
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null
  const canDragDrop = user?.canDragDrop

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, statusValue) => {
    if (!canDragDrop) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const ticketId = e.dataTransfer.getData('ticketId')
    if (ticketId) {
      moveTicket(ticketId, statusValue).catch((error) => {
        alert(error.message || 'Não foi possível mover o chamado.')
      })
    }
  }

  const handleTicketClick = (ticket) => {
    setSelectedTicketId(ticket.id)
  }

  const handleArchiveRequest = (ticket) => {
    setTicketToArchive(ticket)
  }

  const handleConfirmArchive = async () => {
    if (!ticketToArchive || isArchiving) return
    setIsArchiving(true)
    try {
      await archiveTicket(ticketToArchive.id)
    } catch (error) {
      alert(error.message || 'Não foi possível arquivar o chamado.')
    } finally {
      setIsArchiving(false)
      setTicketToArchive(null)
    }
  }

  return (
    <div className="space-y-6 animate-slideInUp">
      {/* Confirm Archive Modal */}
      <ConfirmArchiveModal
        isOpen={ticketToArchive !== null}
        onClose={() => setTicketToArchive(null)}
        onConfirm={handleConfirmArchive}
        isArchiving={isArchiving}
        ticket={ticketToArchive}
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-100 mb-1">Kanban Board</h1>
        </div>
        
        {!isViewOnly && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} /> Novo Chamado
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 h-[calc(100vh-200px)]">
        <div className="flex gap-6 min-w-min h-full">
          {STATUSES.map(status => (
            <div
              key={status.value}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.value)}
              className={`flex-shrink-0 w-72 bg-dark-800 border border-dark-700 rounded-2xl p-4 flex flex-col transition-colors duration-300 ${
                canDragDrop ? 'hover:border-primary-light/30' : ''
              }`}
            >
              {/* Column header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-dark-100 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                    {status.label}
                  </h2>
                  <span className="px-2 py-1 bg-dark-700 rounded text-xs font-semibold text-primary-light">
                    {ticketsByStatus[status.value].length}
                  </span>
                </div>
                <div className="h-1 bg-gradient-to-r from-dark-600 to-transparent rounded-full"></div>
              </div>

              {/* Cards container */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {ticketsByStatus[status.value].length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-dark-500 text-sm">Nenhum chamado neste status</p>
                  </div>
                ) : (
                  ticketsByStatus[status.value].map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      draggable={canDragDrop}
                    >
                      <TicketCard
                        ticket={ticket}
                        onClick={() => handleTicketClick(ticket)}
                        draggable={true}
                        showArchiveAction={status.value === 'resolvido' && canDragDrop}
                        onArchive={handleArchiveRequest}
                      />
                    </div>
                  ))
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  )
}
