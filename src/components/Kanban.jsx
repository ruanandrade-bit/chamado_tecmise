import { useEffect, useRef, useState } from 'react'
import { Plus, Archive, Loader2 } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import CreateTicketModal from './CreateTicketModal'
import TicketDetailsModal from './TicketDetailsModal'
import './Kanban.css'

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

/* ─── Column status dot colors ─────────────────────────────────────── */
const STATUS_DOT_STYLES = {
  'sem-status': { bg: '#6b7280', glow: 'rgba(107,114,128,0.3)' },
  recebido: { bg: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
  'em-analise': { bg: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  'aguardando-escola': { bg: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  reprocessando: { bg: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  resolvido: { bg: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function Kanban() {
  const { tickets, getTicketsByStatus, moveTicket, archiveTicket, STATUSES } = useTicketsStore()
  const { user } = useAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketToArchive, setTicketToArchive] = useState(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [isDraggingTicket, setIsDraggingTicket] = useState(false)
  const boardScrollRef = useRef(null)
  const autoScrollRafRef = useRef(null)
  const dragPointerXRef = useRef(null)

  const isViewOnly = user?.viewOnly === true

  const ticketsByStatus = getTicketsByStatus()
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null
  const canDragDrop = user?.canDragDrop

  const handleDragOver = (e, statusValue) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(statusValue)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = (e, statusValue) => {
    setDragOverCol(null)
    setIsDraggingTicket(false)
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

  const handleTicketDragStart = () => {
    if (!canDragDrop) return
    setIsDraggingTicket(true)
  }

  const handleTicketDragEnd = () => {
    setIsDraggingTicket(false)
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

  useEffect(() => {
    if (!isDraggingTicket) {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current)
        autoScrollRafRef.current = null
      }
      dragPointerXRef.current = null
      return
    }

    const EDGE_ZONE = 130
    const MAX_SPEED = 20

    const tickAutoScroll = () => {
      const container = boardScrollRef.current
      if (!container || !isDraggingTicket) {
        autoScrollRafRef.current = null
        return
      }

      const pointerX = dragPointerXRef.current
      if (typeof pointerX === 'number') {
        const rect = container.getBoundingClientRect()
        const leftTrigger = rect.left + EDGE_ZONE
        const rightTrigger = rect.right - EDGE_ZONE
        let delta = 0

        if (pointerX < leftTrigger) {
          const strength = Math.min(1, (leftTrigger - pointerX) / EDGE_ZONE)
          delta = -Math.ceil(strength * MAX_SPEED)
        } else if (pointerX > rightTrigger) {
          const strength = Math.min(1, (pointerX - rightTrigger) / EDGE_ZONE)
          delta = Math.ceil(strength * MAX_SPEED)
        }

        if (delta !== 0) {
          container.scrollLeft += delta
        }
      }

      autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll)
    }

    const handleDragOverWindow = (event) => {
      dragPointerXRef.current = event.clientX
    }

    const stopDragging = () => {
      setIsDraggingTicket(false)
    }

    window.addEventListener('dragover', handleDragOverWindow)
    window.addEventListener('drop', stopDragging)
    window.addEventListener('dragend', stopDragging)
    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll)

    return () => {
      window.removeEventListener('dragover', handleDragOverWindow)
      window.removeEventListener('drop', stopDragging)
      window.removeEventListener('dragend', stopDragging)
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current)
        autoScrollRafRef.current = null
      }
      dragPointerXRef.current = null
    }
  }, [isDraggingTicket])

  return (
    <div className="kb-container">
      {/* Confirm Archive Modal */}
      <ConfirmArchiveModal
        isOpen={ticketToArchive !== null}
        onClose={() => setTicketToArchive(null)}
        onConfirm={handleConfirmArchive}
        isArchiving={isArchiving}
        ticket={ticketToArchive}
      />

      {/* Header with title on left and button on right */}
      <div className="kb-header-wrapper">
        <h1 className="kb-title">Chamados</h1>
        
        {!isViewOnly && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="kb-new-btn"
          >
            <Plus size={20} />
            <span>Novo Chamado</span>
            <span className="kb-new-btn-glow" />
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="kb-board-scroll" ref={boardScrollRef}>
        <div className="kb-board">
          {STATUSES.map((status, colIndex) => {
            const dotStyle = STATUS_DOT_STYLES[status.value] || STATUS_DOT_STYLES['sem-status']
            const isDragOver = dragOverCol === status.value
            const count = ticketsByStatus[status.value].length

            return (
              <div
                key={status.value}
                onDragOver={(e) => handleDragOver(e, status.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.value)}
                className={`kb-column ${isDragOver ? 'kb-column-dragover' : ''}`}
                style={{ animationDelay: `${colIndex * 0.08}s` }}
              >
                {/* Column header */}
                <div className="kb-col-header">
                  <div className="kb-col-title-row">
                    <h2 className="kb-col-title">
                      <span
                        className="kb-col-dot"
                        style={{
                          background: dotStyle.bg,
                          boxShadow: `0 0 8px ${dotStyle.glow}`,
                        }}
                      />
                      {status.label}
                    </h2>
                    <span className="kb-col-count">{count}</span>
                  </div>
                  <div
                    className="kb-col-line"
                    style={{
                      background: `linear-gradient(90deg, ${dotStyle.bg}40, transparent)`,
                    }}
                  />
                </div>

                {/* Cards container */}
                <div className="kb-cards-container">
                  {count === 0 ? (
                    <div className="kb-empty">
                      <p>Nenhum chamado neste status</p>
                    </div>
                  ) : (
                    ticketsByStatus[status.value].map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket)}
                        draggable={canDragDrop}
                        onDragStart={handleTicketDragStart}
                        onDragEnd={handleTicketDragEnd}
                      >
                        <TicketCard
                          ticket={ticket}
                          onClick={() => handleTicketClick(ticket)}
                          draggable={canDragDrop}
                          showArchiveAction={status.value === 'resolvido' && canDragDrop}
                          onArchive={handleArchiveRequest}
                        />
                      </div>
                    ))
                  )}
                </div>

              </div>
            )
          })}
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
