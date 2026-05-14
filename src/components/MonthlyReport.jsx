import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Plus, Trash2, Send, CalendarDays, ClipboardList, Loader2, Ticket, Pencil, X, Check, AlertTriangle, ShieldAlert, School, UserRound, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function PrettySelect({ value, onChange, options, placeholder, icon: Icon, selectKey, openSelectKey, setOpenSelectKey }) {
  const containerRef = useRef(null)
  const isOpen = openSelectKey === selectKey
  const [didSelect, setDidSelect] = useState(false)

  useEffect(() => {
    const handleOutside = (event) => {
      if (event.target?.closest?.('.mr-pretty-select')) {
        return
      }
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenSelectKey(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [setOpenSelectKey])

  const handlePick = (nextValue) => {
    onChange(nextValue)
    setDidSelect(true)
    setOpenSelectKey(null)
  }

  useEffect(() => {
    if (!didSelect) return
    const timer = setTimeout(() => setDidSelect(false), 420)
    return () => clearTimeout(timer)
  }, [didSelect])

  return (
    <div className={`mr-pretty-select ${isOpen ? 'mr-pretty-select-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`mr-pretty-trigger ${didSelect ? 'mr-pretty-trigger-picked' : ''}`}
        onClick={() => setOpenSelectKey(isOpen ? null : selectKey)}
        aria-expanded={isOpen}
      >
        <span className={`mr-pretty-label ${value ? 'mr-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {value || placeholder}
        </span>
        <ChevronDown size={15} className={`mr-pretty-chevron ${isOpen ? 'mr-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="mr-pretty-options">
          <button
            type="button"
            className={`mr-pretty-option ${!value ? 'mr-pretty-option-active' : ''}`}
            onClick={() => handlePick('')}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {placeholder}
          </button>
          {options.map((item) => (
            <button
              key={item}
              type="button"
              className={`mr-pretty-option ${value === item ? 'mr-pretty-option-active' : ''}`}
              onClick={() => handlePick(item)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {value === item && <Check size={12} className="mr-pretty-option-check" />}
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod)
  const [selectedYearRaw, selectedMonthRaw] = selectedPeriod.split('-')
  const selectedMonth = Number(selectedMonthRaw) || currentMonth
  const selectedYear = Number(selectedYearRaw) || currentYear
  const monthName = MONTH_NAMES[selectedMonth - 1] || MONTH_NAMES[currentMonth - 1]

  const [ticketsThisMonth, setTicketsThisMonth] = useState(0)

  const [observations, setObservations] = useState([])
  const [newObservation, setNewObservation] = useState('')
  const [newSchool, setNewSchool] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [schoolOptions, setSchoolOptions] = useState([])
  const [professionalOptions, setProfessionalOptions] = useState([])
  const [openSelectKey, setOpenSelectKey] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editSchool, setEditSchool] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const editTextareaRef = useRef(null)

  // Get the text of the observation to delete (for preview in modal)
  const deleteTargetText = confirmDeleteId
    ? observations.find((o) => o.id === confirmDeleteId)?.text || ''
    : ''

  const loadReport = useCallback(async () => {
    try {
      const data = await api.get(`/reports/monthly?month=${selectedMonth}&year=${selectedYear}`)
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    setIsLoading(true)
    loadReport()
  }, [loadReport])

  // Polling every 10s
  useEffect(() => {
    const interval = setInterval(loadReport, 10000)
    return () => clearInterval(interval)
  }, [loadReport])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [schoolsData, professionalsData] = await Promise.all([
          api.get('/schools'),
          api.get('/professionals')
        ])
        const schools = Object.keys(schoolsData || {}).sort((a, b) => a.localeCompare(b, 'pt-BR'))
        const professionals = (professionalsData?.professionals || [])
          .map((item) => String(item.name || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'pt-BR'))

        setSchoolOptions(schools)
        setProfessionalOptions(professionals)
      } catch (err) {
        console.error('Erro ao carregar opções de colégio/profissional:', err)
      }
    }

    loadOptions()
  }, [])

  const handleAddObservation = async () => {
    if (!newObservation.trim() || isSending) return
    setIsSending(true)
    try {
      const data = await api.post('/reports/monthly', {
        month: selectedMonth,
        year: selectedYear,
        observation: newObservation,
        school: newSchool,
        assignee: newAssignee
      })
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
      setOpenSelectKey(null)
      setNewObservation('')
      setNewSchool('')
      setNewAssignee('')
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
      const data = await api.delete(`/reports/monthly/${selectedMonth}/${selectedYear}/${observationId}`)
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
      setConfirmDeleteId(null)
    } catch (err) {
      alert(err.message || 'Erro ao remover observação.')
    } finally {
      setDeletingId(null)
    }
  }

  // Start editing
  const startEditing = (obs) => {
    setOpenSelectKey(null)
    setEditingId(obs.id)
    setEditText(obs.text)
    setEditSchool(obs.school || '')
    setEditAssignee(obs.assignee || '')
    setTimeout(() => editTextareaRef.current?.focus(), 50)
  }

  const cancelEditing = () => {
    setOpenSelectKey(null)
    setEditingId(null)
    setEditText('')
    setEditSchool('')
    setEditAssignee('')
  }

  const handleSaveEdit = async () => {
    if (!editText.trim() || isSavingEdit) return
    setIsSavingEdit(true)
    try {
      const data = await api.put(
        `/reports/monthly/${selectedMonth}/${selectedYear}/${editingId}`,
        {
          text: editText,
          school: editSchool,
          assignee: editAssignee
        }
      )
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
      setOpenSelectKey(null)
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
      month: 'short'
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

      <div className="mr-filter-row">
        <div className="mr-filter-label">
          <CalendarDays size={15} />
          Mês do relatório
        </div>
        <div className="mr-filter-controls">
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="mr-month-input"
          />
          <button
            onClick={() => setSelectedPeriod(currentPeriod)}
            className="mr-current-month-btn"
            disabled={selectedPeriod === currentPeriod}
            title="Voltar para o mês atual"
          >
            Mês atual
          </button>
        </div>
      </div>

      {/* Combined Month Banner */}
      <div className="mr-month-banner">
        {/* Decorative glows */}
        <div className="mr-banner-glow mr-banner-glow-1" />
        <div className="mr-banner-glow mr-banner-glow-2" />

        <div className="mr-banner-content">
          <div className="mr-banner-icon">
            <CalendarDays size={26} style={{ color: '#22c55e' }} />
          </div>
          <div className="mr-banner-info">
            <h2 className="mr-banner-title">
              Relatório de Devices de {monthName} de {selectedYear}
            </h2>
            <p className="mr-banner-sub">
              {observations.length} observação{observations.length !== 1 ? 'ões' : ''} registrada{observations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="mr-banner-divider" />
          <div className="mr-banner-tickets">
            <div className="mr-banner-tickets-icon">
              <Ticket size={18} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p className="mr-banner-tickets-count">{ticketsThisMonth}</p>
              <p className="mr-banner-tickets-label">chamado{ticketsThisMonth !== 1 ? 's' : ''} aberto{ticketsThisMonth !== 1 ? 's' : ''} no mês</p>
            </div>
          </div>
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
            placeholder={`Descreva a observação de ${monthName} de ${selectedYear}...`}
            rows={5}
            className="mr-textarea"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAddObservation()
              }
            }}
          />
          <div className="mr-optional-row">
            <PrettySelect
              value={newSchool}
              onChange={setNewSchool}
              options={schoolOptions}
              placeholder="Colégio (opcional)"
              icon={School}
              selectKey="new-school"
              openSelectKey={openSelectKey}
              setOpenSelectKey={setOpenSelectKey}
            />
            <PrettySelect
              value={newAssignee}
              onChange={setNewAssignee}
              options={professionalOptions}
              placeholder="Pessoa responsável (opcional)"
              icon={UserRound}
              selectKey="new-assignee"
              openSelectKey={openSelectKey}
              setOpenSelectKey={setOpenSelectKey}
            />
          </div>
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
              ? 'Adicione a primeira observação para o mês selecionado.'
              : 'As observações do mês selecionado aparecerão aqui quando forem registradas.'}
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
                      <span className="mr-obs-meta-text">{formatDate(obs.createdAt)}</span>
                      {obs.school && (
                        <span className="mr-obs-chip mr-obs-chip-school">
                          <School size={11} />
                          {obs.school}
                        </span>
                      )}
                      {obs.assignee && (
                        <span className="mr-obs-chip mr-obs-chip-person">
                          <UserRound size={11} />
                          {obs.assignee}
                        </span>
                      )}
                      {obs.editedAt && (
                        <span className="mr-obs-edited">
                          <Pencil size={8} />
                          editado
                        </span>
                      )}
                    </div>

                    {/* Observation text or edit textarea */}
                    {isEditing ? (
                      <div className="mr-obs-edit-area">
                        <div className="mr-optional-row">
                          <PrettySelect
                            value={editSchool}
                            onChange={setEditSchool}
                            options={editSchool && !schoolOptions.includes(editSchool)
                              ? [editSchool, ...schoolOptions]
                              : schoolOptions}
                            placeholder="Colégio (opcional)"
                            icon={School}
                            selectKey={`edit-school-${obs.id}`}
                            openSelectKey={openSelectKey}
                            setOpenSelectKey={setOpenSelectKey}
                          />
                          <PrettySelect
                            value={editAssignee}
                            onChange={setEditAssignee}
                            options={editAssignee && !professionalOptions.includes(editAssignee)
                              ? [editAssignee, ...professionalOptions]
                              : professionalOptions}
                            placeholder="Pessoa responsável (opcional)"
                            icon={UserRound}
                            selectKey={`edit-assignee-${obs.id}`}
                            openSelectKey={openSelectKey}
                            setOpenSelectKey={setOpenSelectKey}
                          />
                        </div>
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

        /* ── Month Filter ── */
        .mr-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(15, 15, 30, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
        }

        .mr-filter-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #9ca3af;
        }

        .mr-filter-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mr-month-input {
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: #e5e7eb;
          padding: 0 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
        }

        .mr-month-input::-webkit-calendar-picker-indicator {
          filter: invert(0.9);
          cursor: pointer;
        }

        .mr-month-input:focus {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
        }

        .mr-current-month-btn {
          height: 38px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid rgba(99, 102, 241, 0.22);
          background: rgba(99, 102, 241, 0.08);
          color: #a5b4fc;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .mr-current-month-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.16);
          border-color: rgba(99, 102, 241, 0.35);
        }

        .mr-current-month-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
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
          flex-wrap: wrap;
        }

        .mr-banner-info {
          flex: 1;
          min-width: 180px;
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

        .mr-banner-divider {
          width: 1px;
          height: 48px;
          background: rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .mr-banner-divider { display: none; }
        }

        .mr-banner-tickets {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .mr-banner-tickets-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1));
          border: 1px solid rgba(59,130,246,0.25);
        }

        .mr-banner-tickets-count {
          font-size: 1.5rem;
          font-weight: 800;
          color: #60a5fa;
          line-height: 1;
        }

        .mr-banner-tickets-label {
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: 2px;
        }

        /* ── Add Observation Section ── */
        .mr-add-section {
          position: relative;
          z-index: 30;
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

        .mr-optional-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .mr-pretty-select {
          position: relative;
          z-index: 1;
        }

        .mr-pretty-select-open {
          z-index: 90;
        }

        .mr-pretty-trigger {
          width: 100%;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #e5e7eb;
          padding: 0 11px 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mr-pretty-trigger:hover {
          border-color: rgba(34, 197, 94, 0.22);
          background: rgba(255, 255, 255, 0.05);
        }

        .mr-pretty-trigger-picked {
          border-color: rgba(16, 185, 129, 0.55) !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16), 0 0 18px rgba(16, 185, 129, 0.14) !important;
          background: rgba(16, 185, 129, 0.08) !important;
          animation: mrSelectPulse 0.42s ease-out;
        }

        @keyframes mrSelectPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        .mr-pretty-select-open .mr-pretty-trigger {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
          background: rgba(255, 255, 255, 0.06);
        }

        .mr-pretty-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          font-size: 0.8125rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mr-pretty-label-filled {
          color: #e5e7eb;
        }

        .mr-pretty-chevron {
          color: #6b7280;
          transition: transform 0.18s ease;
          flex-shrink: 0;
        }

        .mr-pretty-chevron-open {
          transform: rotate(180deg);
        }

        .mr-pretty-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 40;
          max-height: 260px;
          overflow: auto;
          padding: 8px;
          border-radius: 12px;
          border: 1px solid rgba(34, 197, 94, 0.25);
          background: linear-gradient(165deg, rgba(19, 24, 38, 0.98) 0%, rgba(12, 16, 28, 0.98) 100%);
          box-shadow: 0 16px 35px rgba(0, 0, 0, 0.45), 0 0 20px rgba(34, 197, 94, 0.07);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .mr-pretty-option {
          width: 100%;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: transparent;
          color: #cbd5e1;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 10px 10px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.16s ease;
        }

        .mr-pretty-option:hover {
          background: rgba(34, 197, 94, 0.12);
          color: #dcfce7;
        }

        .mr-pretty-option-active {
          background: rgba(34, 197, 94, 0.16);
          color: #86efac;
        }

        .mr-pretty-option-check {
          color: #34d399;
          flex-shrink: 0;
        }

        .mr-optional-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #e5e7eb;
          font-size: 0.8125rem;
          outline: none;
          transition: all 0.25s ease;
        }

        .mr-optional-input::placeholder {
          color: #4b5563;
        }

        .mr-optional-input:focus {
          border-color: rgba(34, 197, 94, 0.35);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
          background: rgba(255, 255, 255, 0.06);
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

        /* ── Observations Grid ── */
        .mr-obs-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .mr-obs-list {
            grid-template-columns: repeat(2, 1fr);
          }
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

        .mr-obs-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1;
        }

        .mr-obs-chip-school {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.14);
          border: 1px solid rgba(59, 130, 246, 0.28);
        }

        .mr-obs-chip-person {
          color: #86efac;
          background: rgba(34, 197, 94, 0.14);
          border: 1px solid rgba(34, 197, 94, 0.28);
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

          .mr-optional-row {
            grid-template-columns: 1fr;
          }
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

        @media (max-width: 640px) {
          .mr-filter-row {
            flex-direction: column;
            align-items: stretch;
          }

          .mr-filter-controls {
            width: 100%;
          }

          .mr-month-input {
            flex: 1;
          }
        }
      `}</style>
    </div>
  )
}
