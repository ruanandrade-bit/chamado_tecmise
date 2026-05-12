import { useState } from 'react'
import { Archive, Trash2, CalendarDays, Filter, Loader2, ShieldAlert } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import TicketDetailsModal from './TicketDetailsModal'

/* ─── Confirm‑Delete Modal (premium glassmorphism) ─────────────────── */
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, ticket }) {
  if (!isOpen || !ticket) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isDeleting) onClose()
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
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239, 68, 68, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top red accent bar */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent)',
          }}
        />

        {/* Red glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 65%)',
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
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.08) 100%)',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 0 30px rgba(239,68,68,0.08)',
            }}
          >
            <ShieldAlert size={32} style={{ color: '#f87171' }} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
              Excluir Chamado?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja excluir este chamado? Essa ação <strong style={{ color: '#f87171' }}>não poderá ser desfeita</strong>.
            </p>
          </div>

          {/* Preview of ticket being deleted */}
          <div
            className="w-full rounded-xl p-3 text-left"
            style={{
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Chamado a ser excluído:</p>
            <p className="text-sm font-semibold mb-0.5" style={{ color: '#f87171' }}>
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
              disabled={isDeleting}
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
              disabled={isDeleting}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: isDeleting
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.75) 0%, rgba(185,28,28,0.85) 100%)',
                color: '#fff',
                border: '1px solid rgba(239,68,68,0.35)',
                boxShadow: isDeleting ? 'none' : '0 4px 20px rgba(239,68,68,0.2)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isDeleting) {
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(239,68,68,0.35)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Sim, excluir
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
export default function ArchivedTickets() {
  const { getArchivedTickets, deleteTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketToDelete, setTicketToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Date filters ──
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [filterYear, setFilterYear] = useState(String(currentYear))
  const [filterMonth, setFilterMonth] = useState(String(currentMonth))

  const archivedTickets = getArchivedTickets()
  const canDeleteTicket = user?.canDragDrop === true

  // Build available years from ticket data
  const availableYears = [...new Set(archivedTickets.map(t => {
    const d = new Date(t.resolvedAt || t.archivedAt || t.createdAt)
    return d.getFullYear()
  }))].sort((a, b) => b - a)

  // If current year has no tickets, add it anyway
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear)

  const months = [
    { value: '0', label: 'Todos os meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  // Filter by year and month
  const filteredTickets = archivedTickets.filter(ticket => {
    const d = new Date(ticket.resolvedAt || ticket.archivedAt || ticket.createdAt)
    const ticketYear = d.getFullYear()
    const ticketMonth = d.getMonth() + 1

    if (String(ticketYear) !== filterYear) return false
    if (filterMonth !== '0' && ticketMonth !== Number(filterMonth)) return false
    return true
  })

  const selectedTicket = filteredTickets.find((ticket) => ticket.id === selectedTicketId) || null

  const handleDeleteRequest = (ticket) => {
    setTicketToDelete(ticket)
  }

  const handleConfirmDelete = async () => {
    if (!ticketToDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteTicket(ticketToDelete.id)
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null)
      }
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o chamado.')
    } finally {
      setIsDeleting(false)
      setTicketToDelete(null)
    }
  }

  return (
    <div className="arc-container">
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={ticketToDelete !== null}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        ticket={ticketToDelete}
      />

      {/* Header */}
      <div className="arc-page-header">
        <div className="arc-header-icon">
          <Archive size={22} style={{ color: '#86efac' }} />
        </div>
        <div>
          <h1 className="arc-page-title">Chamados Resolvidos</h1>
          <p className="arc-page-subtitle">Chamados arquivados após resolução</p>
        </div>
      </div>

      {/* ── Year/Month filter bar ── */}
      <div className="arc-filter-bar">
        <div className="arc-filter-group">
          <CalendarDays size={16} style={{ color: '#86efac', flexShrink: 0 }} />
          <select
            className="arc-filter-select"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            {availableYears.map(year => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
          <select
            className="arc-filter-select"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="arc-filter-count">
          <Filter size={13} style={{ color: '#6b7280' }} />
          <span>{filteredTickets.length} chamado{filteredTickets.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="arc-empty">
          <div className="arc-empty-icon">
            <Archive size={28} style={{ color: '#4b5563' }} />
          </div>
          <p className="arc-empty-text">Nenhum chamado encontrado para o período selecionado.</p>
        </div>
      ) : (
        <div className="arc-grid">
          {filteredTickets.map((ticket, index) => (
            <div key={ticket.id} className="arc-card-wrap" style={{ animationDelay: `${index * 0.06}s` }}>
              <TicketCard
                ticket={ticket}
                onClick={() => setSelectedTicketId(ticket.id)}
                draggable={false}
                showDeleteAction={canDeleteTicket}
                onDelete={handleDeleteRequest}
              />
            </div>
          ))}
        </div>
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      <style>{`
        .arc-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: arcFadeIn 0.5s ease-out;
        }

        @keyframes arcFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Page Header ── */
        .arc-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .arc-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08));
          border: 1px solid rgba(34,197,94,0.2);
          box-shadow: 0 0 20px rgba(34,197,94,0.06);
        }

        .arc-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .arc-page-subtitle {
          font-size: 0.9375rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* ── Filter Bar ── */
        .arc-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 20px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          flex-wrap: wrap;
        }

        .arc-filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .arc-filter-select {
          padding: 8px 32px 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #e5e7eb;
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .arc-filter-select:focus {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
        }

        .arc-filter-select option {
          background: #1a1a2e;
          color: #e5e7eb;
        }

        .arc-filter-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* ── Empty State ── */
        .arc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 20px;
          background: rgba(15, 15, 30, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          text-align: center;
        }

        .arc-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 16px;
        }

        .arc-empty-text {
          color: #6b7280;
          font-size: 0.9375rem;
        }

        /* ── Grid ── */
        .arc-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        @media (min-width: 768px) {
          .arc-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 1280px) {
          .arc-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .arc-card-wrap {
          animation: arcCardIn 0.4s ease-out both;
        }

        @keyframes arcCardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
