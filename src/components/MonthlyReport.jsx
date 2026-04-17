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
    <div className="space-y-6 animate-slideInUp">
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteObservation}
        isDeleting={!!deletingId}
        observationText={deleteTargetText}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-light/20 flex items-center justify-center">
          <FileText size={20} className="text-primary-light" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-dark-100">Relatório Mensal</h1>
          <p className="text-dark-400">Observações e acompanhamento mensal</p>
        </div>
      </div>

      {/* Month Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(6, 182, 212, 0.06) 100%)',
          borderColor: 'rgba(34, 197, 94, 0.2)',
        }}
      >
        {/* Decorative background circles */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
              border: '1px solid rgba(34,197,94,0.3)'
            }}
          >
            <CalendarDays size={26} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-100">
              Relatório de Devices do Mês de {monthName}
            </h2>
            <p className="text-sm text-dark-400 mt-0.5">
              {currentYear} • {observations.length} observação{observations.length !== 1 ? 'ões' : ''} registrada{observations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tickets opened this month */}
      <div
        className="flex items-center gap-4 rounded-2xl border p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
        }}
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.15) 100%)',
            border: '1px solid rgba(59,130,246,0.3)'
          }}
        >
          <Ticket size={22} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <p className="text-lg font-bold text-dark-100">
            Neste mês, <span style={{ color: '#60a5fa' }}>{ticketsThisMonth}</span> chamado{ticketsThisMonth !== 1 ? 's foram abertos' : ' foi aberto'}.
          </p>
          <p className="text-xs text-dark-500 mt-0.5">
            Atualizado automaticamente a cada novo chamado
          </p>
        </div>
      </div>

      {/* Admin: Add observation */}
      {isAdmin && (
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2 text-dark-300">
            <Plus size={16} className="text-primary-light" />
            <span className="text-sm font-medium">Nova Observação</span>
          </div>
          <div className="flex gap-3">
            <textarea
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Descreva a observação do mês..."
              rows={3}
              className="input-base flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddObservation()
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-500">Ctrl + Enter para enviar</span>
            <button
              onClick={handleAddObservation}
              disabled={!newObservation.trim() || isSending}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Observations list */}
      {isLoading ? (
        <div className="card-base flex items-center justify-center py-16">
          <Loader2 size={24} className="text-primary-light animate-spin" />
          <span className="ml-3 text-dark-400">Carregando relatório...</span>
        </div>
      ) : observations.length === 0 ? (
        <div className="card-base text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-dark-700/50 flex items-center justify-center">
            <ClipboardList size={28} className="text-dark-500" />
          </div>
          <p className="text-dark-400 font-medium">Nenhuma observação registrada</p>
          <p className="text-dark-500 text-sm">
            {isAdmin
              ? 'Adicione a primeira observação do mês acima.'
              : 'As observações do mês aparecerão aqui quando forem registradas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map((obs, index) => {
            const isEditing = editingId === obs.id

            return (
              <div
                key={obs.id}
                className="card-base group"
                style={{
                  animationDelay: `${index * 50}ms`,
                  borderColor: isEditing ? 'rgba(251, 191, 36, 0.3)' : undefined,
                  boxShadow: isEditing ? '0 0 20px rgba(251, 191, 36, 0.06), inset 0 1px 0 rgba(251,191,36,0.05)' : undefined,
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Observation number badge + meta */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
                          color: '#86efac',
                          border: '1px solid rgba(34,197,94,0.25)'
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-xs text-dark-500">
                        por <strong className="text-dark-400">{obs.author}</strong> • {formatDate(obs.createdAt)}
                        {obs.editedAt && (
                          <span
                            className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                            style={{
                              background: 'rgba(251, 191, 36, 0.08)',
                              color: '#fbbf24',
                              fontSize: '10px',
                              border: '1px solid rgba(251, 191, 36, 0.15)',
                            }}
                          >
                            <Pencil size={8} />
                            editado
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Observation text or edit textarea */}
                    {isEditing ? (
                      <div className="pl-8 space-y-3">
                        <textarea
                          ref={editTextareaRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="input-base w-full resize-none text-sm"
                          style={{
                            borderColor: 'rgba(251, 191, 36, 0.25)',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSaveEdit()
                            }
                            if (e.key === 'Escape') {
                              cancelEditing()
                            }
                          }}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editText.trim() || isSavingEdit}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            style={{
                              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
                              color: '#86efac',
                              border: '1px solid rgba(34,197,94,0.3)',
                              boxShadow: '0 2px 8px rgba(34,197,94,0.1)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.2)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.1)'
                            }}
                          >
                            {isSavingEdit ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Salvar alteração
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={isSavingEdit}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: 'rgba(100, 116, 139, 0.08)',
                              color: '#94a3b8',
                              border: '1px solid rgba(100, 116, 139, 0.15)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 116, 139, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(100, 116, 139, 0.08)'
                            }}
                          >
                            <X size={12} />
                            Cancelar
                          </button>
                          <span className="text-xs text-dark-500 ml-auto hidden sm:block">
                            Ctrl+Enter salvar · Esc cancelar
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap pl-8">
                        {obs.text}
                      </p>
                    )}
                  </div>

                  {/* Action buttons — admin only */}
                  {isAdmin && !isEditing && (
                    <div
                      className="flex-shrink-0 flex items-center gap-0.5 rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      style={{
                        background: 'rgba(100, 116, 139, 0.06)',
                        border: '1px solid transparent',
                      }}
                    >
                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(obs)}
                        className="p-2 rounded-md transition-all duration-200"
                        style={{ color: '#64748b' }}
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
                        className="p-2 rounded-md transition-all duration-200"
                        style={{ color: '#64748b' }}
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
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.15)',
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99, 102, 241, 0.12)' }}
          >
            <FileText size={16} style={{ color: '#818cf8' }} />
          </div>
          <p className="text-sm" style={{ color: '#a5b4fc' }}>
            Apenas administradores podem adicionar observações ao relatório mensal.
          </p>
        </div>
      )}
    </div>
  )
}
