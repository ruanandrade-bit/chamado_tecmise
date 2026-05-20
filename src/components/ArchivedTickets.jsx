import { useState, useMemo, useEffect, useRef } from 'react'
import { Archive, Trash2, CalendarDays, Filter, Loader2, ShieldAlert, ChevronDown, Check } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import TicketDetailsModal from './TicketDetailsModal'

function ArcPrettySelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  selectKey,
  openSelectKey,
  setOpenSelectKey,
  compact = false
}) {
  const containerRef = useRef(null)
  const isOpen = openSelectKey === selectKey

  const normalizedOptions = useMemo(
    () => (options || []).map((item) => (
      typeof item === 'string'
        ? { value: item, label: item }
        : { value: item.value, label: item.label ?? item.value }
    )),
    [options]
  )

  const selectedOption = normalizedOptions.find((item) => item.value === value)

  useEffect(() => {
    const handleOutside = (event) => {
      if (event.target?.closest?.('.arc-pretty-select')) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenSelectKey(null)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [setOpenSelectKey])

  return (
    <div
      className={`arc-pretty-select ${isOpen ? 'arc-pretty-select-open' : ''} ${compact ? 'arc-pretty-select-compact' : ''}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="arc-pretty-trigger"
        onClick={() => setOpenSelectKey(isOpen ? null : selectKey)}
        aria-expanded={isOpen}
      >
        <span className={`arc-pretty-label ${value ? 'arc-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`arc-pretty-chevron ${isOpen ? 'arc-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="arc-pretty-options">
          {normalizedOptions.map((item, index) => (
            <button
              key={`${selectKey}-${item.value}`}
              type="button"
              className={`arc-pretty-option ${value === item.value ? 'arc-pretty-option-active' : ''}`}
              onClick={() => {
                onChange(item.value)
                setOpenSelectKey(null)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ '--arc-option-index': index }}
            >
              {value === item.value && <Check size={12} className="arc-pretty-option-check" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [openSelectKey, setOpenSelectKey] = useState(null)

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
  const yearOptions = availableYears.map((year) => ({ value: String(year), label: String(year) }))

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
          <ArcPrettySelect
            value={filterYear}
            onChange={setFilterYear}
            options={yearOptions}
            placeholder="Ano"
            selectKey="arc-filter-year"
            openSelectKey={openSelectKey}
            setOpenSelectKey={setOpenSelectKey}
            compact
          />
          <ArcPrettySelect
            value={filterMonth}
            onChange={setFilterMonth}
            options={months}
            placeholder="Mês"
            selectKey="arc-filter-month"
            openSelectKey={openSelectKey}
            setOpenSelectKey={setOpenSelectKey}
            compact
          />
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

        .arc-pretty-select {
          position: relative;
          min-width: 130px;
        }

        .arc-pretty-trigger {
          width: 100%;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .arc-pretty-trigger:hover {
          border-color: rgba(34, 197, 94, 0.24);
          background: rgba(255, 255, 255, 0.06);
        }

        .arc-pretty-select-open .arc-pretty-trigger {
          border-color: rgba(34, 197, 94, 0.42);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.06);
          background: rgba(255, 255, 255, 0.06);
        }

        .arc-pretty-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #d1d5db;
          text-align: left;
          font-size: 0.8rem;
          line-height: 1.15;
          font-weight: 500;
          white-space: nowrap;
        }

        .arc-pretty-label-filled {
          color: #e5e7eb;
        }

        .arc-pretty-chevron {
          color: #64748b;
          transition: transform 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }

        .arc-pretty-chevron-open {
          transform: rotate(180deg);
          color: #86efac;
        }

        .arc-pretty-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 240px;
          overflow-y: auto;
          padding: 8px;
          border-radius: 12px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: linear-gradient(170deg, rgba(17, 22, 36, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55), 0 0 25px rgba(34, 197, 94, 0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: arcSelectPanelIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .arc-pretty-options::-webkit-scrollbar {
          width: 4px;
        }

        .arc-pretty-options::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 99px;
        }

        .arc-pretty-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #cbd5e1;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          opacity: 1;
          transform: none;
          animation: none;
        }

        .arc-pretty-option:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #dcfce7;
        }

        .arc-pretty-option-active {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(22, 163, 74, 0.14));
          color: #ecfdf5;
          border: 1px solid rgba(134, 239, 172, 0.35);
        }

        .arc-pretty-option-check {
          color: #86efac;
          flex-shrink: 0;
        }

        @keyframes arcSelectPanelIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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
