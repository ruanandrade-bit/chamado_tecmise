import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Plus, Trash2, Send, CalendarDays, ClipboardList, Loader2, Ticket, Pencil, X, Check, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useTicketsStore } from '../stores/ticketsStore'
import { api } from '../services/api'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

/* ─── Confirm‑Delete Modal ────────────────────────────────────────── */
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isDeleting, observationText }) {
  if (!isOpen) return null

  // Close on Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isDeleting) onClose()
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
              Excluir Observação?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja excluir esta observação? Essa ação <strong style={{ color: '#f87171' }}>não poderá ser desfeita</strong>.
            </p>
          </div>

          {/* Preview of observation being deleted */}
          {observationText && (
            <div
              className="w-full rounded-xl p-3 text-left"
              style={{
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
              }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Observação a ser excluída:</p>
              <p className="text-sm line-clamp-3" style={{ color: '#cbd5e1' }}>
                {observationText.length > 120 ? observationText.slice(0, 120) + '…' : observationText}
              </p>
            </div>
          )}

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
export default function MonthlyReport() {
  const { user } = useAuthStore()
  const isAdmin = user?.canDragDrop === true
  const { tickets } = useTicketsStore()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = MONTH_NAMES[currentMonth - 1]

  // Count tickets opened in the current month
  const ticketsThisMonth = tickets.filter((t) => {
    if (!t.createdAt) return false
    const d = new Date(t.createdAt)
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
  }).length

  const [observations, setObservations] = useState([])
  const [newObservation, setNewObservation] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const editTextareaRef = useRef(null)

  // Get the text of the observation to delete (for preview in modal)
  const deleteTargetText = confirmDeleteId
    ? observations.find((o) => o.id === confirmDeleteId)?.text || ''
    : ''

  const loadReport = useCallback(async () => {
    try {
      const data = await api.get(`/reports/monthly?month=${currentMonth}&year=${currentYear}`)
      setObservations(data.observations || [])
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // Polling every 10s
  useEffect(() => {
    const interval = setInterval(loadReport, 10000)
    return () => clearInterval(interval)
  }, [loadReport])

  const handleAddObservation = async () => {
    if (!newObservation.trim() || isSending) return
    setIsSending(true)
    try {
      const data = await api.post('/reports/monthly', {
        month: currentMonth,
        year: currentYear,
        observation: newObservation
      })
      setObservations(data.observations || [])
      setNewObservation('')
    } catch (err) {
      alert(err.message || 'Erro ao adicionar observação.')
    } finally {
      setIsSending(false)
    }
  }

  // Triggered by confirm modal
  const handleDeleteObservation = async () => {
    const observationId = confirmDeleteId
    if (!observationId || deletingId) return
    setDeletingId(observationId)
    try {
      const data = await api.delete(`/reports/monthly/${currentMonth}/${currentYear}/${observationId}`)
      setObservations(data.observations || [])
      setConfirmDeleteId(null)
    } catch (err) {
      alert(err.message || 'Erro ao remover observação.')
    } finally {
      setDeletingId(null)
    }
  }

  // Start editing
  const startEditing = (obs) => {
    setEditingId(obs.id)
    setEditText(obs.text)
    setTimeout(() => editTextareaRef.current?.focus(), 50)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleSaveEdit = async () => {
    if (!editText.trim() || isSavingEdit) return
    setIsSavingEdit(true)
    try {
      const data = await api.put(
        `/reports/monthly/${currentMonth}/${currentYear}/${editingId}`,
        { text: editText }
      )
      setObservations(data.observations || [])
      setEditingId(null)
      setEditText('')
    } catch (err) {
      alert(err.message || 'Erro ao editar observação.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="mr-container">
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteObservation}
        isDeleting={!!deletingId}
        observationText={deleteTargetText}
      />

      {/* Header */}
      <div className="mr-page-header">
        <div className="mr-header-icon">
          <FileText size={22} style={{ color: '#86efac' }} />
        </div>
        <div>
          <h1 className="mr-page-title">Relatório Mensal</h1>
          <p className="mr-page-subtitle">Observações e acompanhamento mensal</p>
        </div>
      </div>

      {/* Month Banner */}
      <div className="mr-month-banner">
        {/* Decorative glows */}
        <div className="mr-banner-glow mr-banner-glow-1" />
        <div className="mr-banner-glow mr-banner-glow-2" />

        <div className="mr-banner-content">
          <div className="mr-banner-icon">
            <CalendarDays size={26} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h2 className="mr-banner-title">
              Relatório de Devices do Mês de {monthName}
            </h2>
            <p className="mr-banner-sub">
              {currentYear} • {observations.length} observação{observations.length !== 1 ? 'ões' : ''} registrada{observations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tickets opened this month */}
      <div className="mr-tickets-card">
        <div className="mr-tickets-icon">
          <Ticket size={22} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <p className="mr-tickets-text">
            Neste mês, <span className="mr-tickets-count">{ticketsThisMonth}</span> chamado{ticketsThisMonth !== 1 ? 's foram abertos' : ' foi aberto'}.
          </p>
          <p className="mr-tickets-sub">
            Atualizado automaticamente a cada novo chamado
          </p>
        </div>
      </div>

      {/* Admin: Add observation */}
      {isAdmin && (
        <div className="mr-add-section">
          <div className="mr-add-header">
            <div className="mr-add-header-icon">
              <Plus size={16} style={{ color: '#86efac' }} />
            </div>
            <span className="mr-add-header-text">Nova Observação</span>
          </div>
          <textarea
            value={newObservation}
            onChange={(e) => setNewObservation(e.target.value)}
            placeholder="Descreva a observação do mês..."
            rows={3}
            className="mr-textarea"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAddObservation()
              }
            }}
          />
          <div className="mr-add-footer">
            <span className="mr-add-hint">Ctrl + Enter para enviar</span>
            <button
              onClick={handleAddObservation}
              disabled={!newObservation.trim() || isSending}
              className="mr-add-btn"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Salvando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Adicionar
                </>
              )}
              <span className="mr-add-btn-glow" />
            </button>
          </div>
        </div>
      )}

      {/* Observations list */}
      {isLoading ? (
        <div className="mr-loading">
          <Loader2 size={24} style={{ color: '#86efac', animation: 'spin 1s linear infinite' }} />
          <span>Carregando relatório...</span>
        </div>
      ) : observations.length === 0 ? (
        <div className="mr-empty">
          <div className="mr-empty-icon">
            <ClipboardList size={28} style={{ color: '#4b5563' }} />
          </div>
          <p className="mr-empty-title">Nenhuma observação registrada</p>
          <p className="mr-empty-sub">
            {isAdmin
              ? 'Adicione a primeira observação do mês acima.'
              : 'As observações do mês aparecerão aqui quando forem registradas.'}
          </p>
        </div>
      ) : (
        <div className="mr-obs-list">
          {observations.map((obs, index) => {
            const isEditing = editingId === obs.id

            return (
              <div
                key={obs.id}
                className="mr-obs-card"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  borderColor: isEditing ? 'rgba(251, 191, 36, 0.25)' : undefined,
                  boxShadow: isEditing ? '0 0 24px rgba(251, 191, 36, 0.06)' : undefined,
                }}
              >
                <div className="mr-obs-inner">
                  <div className="mr-obs-content">
                    {/* Observation number badge + meta */}
                    <div className="mr-obs-meta">
                      <span className="mr-obs-badge">{index + 1}</span>
                      <span className="mr-obs-meta-text">
                        por <strong style={{ color: '#d1d5db' }}>{obs.author}</strong> • {formatDate(obs.createdAt)}
                        {obs.editedAt && (
                          <span className="mr-obs-edited">
                            <Pencil size={8} />
                            editado
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Observation text or edit textarea */}
                    {isEditing ? (
                      <div className="mr-obs-edit-area">
                        <textarea
                          ref={editTextareaRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="mr-textarea mr-textarea-edit"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSaveEdit()
                            }
                            if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                        />
                        <div className="mr-edit-actions">
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editText.trim() || isSavingEdit}
                            className="mr-edit-save"
                          >
                            {isSavingEdit ? (
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Check size={12} />
                            )}
                            Salvar alteração
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSavingEdit}
                            className="mr-edit-cancel"
                          >
                            <X size={12} />
                            Cancelar
                          </button>
                          <span className="mr-edit-hint">
                            Ctrl+Enter salvar · Esc cancelar
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mr-obs-text">{obs.text}</p>
                    )}
                  </div>

                  {/* Action buttons — admin only */}
                  {isAdmin && !isEditing && (
                    <div className="mr-obs-actions">
                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(obs)}
                        className="mr-obs-action-btn"
                        title="Editar observação"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#fbbf24'
                          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDeleteId(obs.id)}
                        className="mr-obs-action-btn"
                        title="Remover observação"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#f87171'
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748b'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Non-admin info */}
      {!isAdmin && (
        <div className="mr-info-banner">
          <div className="mr-info-icon">
            <FileText size={16} style={{ color: '#818cf8' }} />
          </div>
          <p className="mr-info-text">
            Apenas administradores podem adicionar observações ao relatório mensal.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .mr-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: mrFadeIn 0.5s ease-out;
        }

        @keyframes mrFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Page Header ── */
        .mr-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mr-header-icon {
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

        .mr-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .mr-page-subtitle {
          font-size: 0.9375rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* ── Month Banner ── */
        .mr-month-banner {
          position: relative;
          overflow: hidden;
          padding: 24px 28px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .mr-banner-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.12;
        }

        .mr-banner-glow-1 {
          width: 160px;
          height: 160px;
          top: -60px;
          right: -40px;
          background: radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%);
        }

        .mr-banner-glow-2 {
          width: 120px;
          height: 120px;
          bottom: -50px;
          left: -30px;
          background: radial-gradient(circle, rgba(6,182,212,0.6) 0%, transparent 70%);
        }

        .mr-banner-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .mr-banner-icon {
          flex-shrink: 0;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
          border: 1px solid rgba(34,197,94,0.25);
          box-shadow: 0 0 16px rgba(34,197,94,0.08);
        }

        .mr-banner-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f3f4f6;
        }

        .mr-banner-sub {
          font-size: 0.8125rem;
          color: #9ca3af;
          margin-top: 4px;
        }

        /* ── Tickets This Month ── */
        .mr-tickets-card {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        .mr-tickets-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1));
          border: 1px solid rgba(59,130,246,0.25);
        }

        .mr-tickets-text {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #e5e7eb;
        }

        .mr-tickets-count {
          color: #60a5fa;
          font-size: 1.125rem;
        }

        .mr-tickets-sub {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 4px;
        }

        /* ── Add Observation Section ── */
        .mr-add-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 24px;
          background: rgba(15, 15, 30, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .mr-add-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mr-add-header-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.15);
        }

        .mr-add-header-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #d1d5db;
        }

        .mr-textarea {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #e5e7eb;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          resize: none;
          transition: all 0.25s ease;
        }

        .mr-textarea::placeholder {
          color: #4b5563;
        }

        .mr-textarea:focus {
          border-color: rgba(34, 197, 94, 0.35);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
          background: rgba(255, 255, 255, 0.06);
        }

        .mr-textarea-edit {
          border-color: rgba(251, 191, 36, 0.2);
        }

        .mr-textarea-edit:focus {
          border-color: rgba(251, 191, 36, 0.35);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.08);
        }

        .mr-add-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mr-add-hint {
          font-size: 0.75rem;
          color: #4b5563;
        }

        .mr-add-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
        }

        .mr-add-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
        }

        .mr-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mr-add-btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: mrBtnGlow 3s ease-in-out infinite;
        }

        @keyframes mrBtnGlow {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }

        /* ── Loading ── */
        .mr-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 64px 20px;
          background: rgba(15, 15, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          color: #6b7280;
          font-size: 0.9375rem;
        }

        /* ── Empty ── */
        .mr-empty {
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

        .mr-empty-icon {
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

        .mr-empty-title {
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.9375rem;
          margin-bottom: 6px;
        }

        .mr-empty-sub {
          color: #6b7280;
          font-size: 0.8125rem;
        }

        /* ── Observations List ── */
        .mr-obs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mr-obs-card {
          padding: 20px 24px;
          background: rgba(15, 15, 30, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          transition: all 0.3s ease;
          animation: mrObsIn 0.4s ease-out both;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .mr-obs-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        @keyframes mrObsIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mr-obs-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .mr-obs-content {
          flex: 1;
          min-width: 0;
        }

        .mr-obs-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .mr-obs-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
          color: #86efac;
          border: 1px solid rgba(34,197,94,0.2);
        }

        .mr-obs-meta-text {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .mr-obs-edited {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-left: 6px;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 10px;
          background: rgba(251, 191, 36, 0.08);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.12);
        }

        .mr-obs-text {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #e5e7eb;
          white-space: pre-wrap;
          padding-left: 36px;
        }

        .mr-obs-edit-area {
          padding-left: 36px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mr-edit-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mr-edit-save {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(34,197,94,0.25);
          background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
          color: #86efac;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(34,197,94,0.08);
        }

        .mr-edit-save:hover:not(:disabled) {
          box-shadow: 0 4px 14px rgba(34,197,94,0.2);
        }

        .mr-edit-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mr-edit-cancel {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid rgba(100, 116, 139, 0.12);
          background: rgba(100, 116, 139, 0.06);
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mr-edit-cancel:hover:not(:disabled) {
          background: rgba(100, 116, 139, 0.12);
        }

        .mr-edit-hint {
          font-size: 0.6875rem;
          color: #4b5563;
          margin-left: auto;
        }

        @media (max-width: 640px) {
          .mr-edit-hint { display: none; }
        }

        /* ── Action buttons ── */
        .mr-obs-actions {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 2px;
          border-radius: 10px;
          background: rgba(100, 116, 139, 0.04);
          border: 1px solid transparent;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .mr-obs-card:hover .mr-obs-actions {
          opacity: 1;
        }

        .mr-obs-action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        /* ── Info Banner ── */
        .mr-info-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
        }

        .mr-info-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .mr-info-text {
          font-size: 0.875rem;
          color: #a5b4fc;
        }
      `}</style>
    </div>
  )
}
