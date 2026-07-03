import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { FileText, Plus, Trash2, Send, CalendarDays, ClipboardList, Loader2, Ticket, Pencil, X, Check, AlertTriangle, ShieldAlert, School, UserRound, ChevronDown, Pin, PinOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'
import './MonthlyReport.css'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function PrettySelect({ value, onChange, options, placeholder, icon: Icon, selectKey, openSelectKey, setOpenSelectKey, allowClear = true }) {
  const containerRef = useRef(null)
  const isOpen = openSelectKey === selectKey
  const [didSelect, setDidSelect] = useState(false)

  useEffect(() => {
    const handleOutside = (event) => {
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
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpenSelectKey((prev) => (prev === selectKey ? null : selectKey))}
        aria-expanded={isOpen}
      >
        <span className={`mr-pretty-label ${value ? 'mr-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {value || placeholder}
        </span>
        <ChevronDown size={15} className={`mr-pretty-chevron ${isOpen ? 'mr-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="mr-pretty-options" onMouseDown={(e) => e.stopPropagation()}>
          {allowClear && (
            <button
              type="button"
              className={`mr-pretty-option ${!value ? 'mr-pretty-option-active' : ''}`}
              onClick={() => handlePick('')}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {placeholder}
            </button>
          )}
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
  const isAdmin = user?.role === 'Admin'

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const monthName = MONTH_NAMES[selectedMonth - 1] || MONTH_NAMES[currentMonth - 1]
  const monthOption = MONTH_NAMES[selectedMonth - 1] || ''
  const yearOption = String(selectedYear)
  const [yearOptions, setYearOptions] = useState([])
  const isCurrentPeriod = selectedMonth === currentMonth && selectedYear === currentYear

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
  const [pinningId, setPinningId] = useState(null)

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

  const sortedObservations = useMemo(() => {
    return observations
      .map((obs, index) => ({ obs, index }))
      .sort((a, b) => {
        if (Boolean(a.obs.pinned) === Boolean(b.obs.pinned)) {
          return a.index - b.index
        }
        return a.obs.pinned ? -1 : 1
      })
      .map(({ obs }) => obs)
  }, [observations])

  // Load available years
  useEffect(() => {
    const loadYears = async () => {
      try {
        const data = await api.get('/reports/years')
        if (Array.isArray(data.years) && data.years.length > 0) {
          setYearOptions(data.years)
          // If current year not in options but has data, ensure it's included
          const selectedYearStr = String(currentYear)
          if (!data.years.includes(selectedYearStr)) {
            setSelectedYear(Number(data.years[0]))
          }
        } else {
          // Fallback: if no years with tickets, show current year
          setYearOptions([String(currentYear)])
        }
      } catch (err) {
        console.error('Erro ao carregar anos:', err)
        // Fallback to current year if error
        setYearOptions([String(currentYear)])
      }
    }
    loadYears()
  }, [currentYear])

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

    const currentObs = observations.find((item) => item.id === editingId)
    if (!currentObs) {
      cancelEditing()
      return
    }

    const nextText = String(editText || '').trim()
    const nextSchool = String(editSchool || '').trim()
    const nextAssignee = String(editAssignee || '').trim()

    const currentText = String(currentObs.text || '').trim()
    const currentSchool = String(currentObs.school || '').trim()
    const currentAssignee = String(currentObs.assignee || '').trim()

    const hasChanges = (
      nextText !== currentText
      || nextSchool !== currentSchool
      || nextAssignee !== currentAssignee
    )

    if (!hasChanges) {
      cancelEditing()
      return
    }

    setIsSavingEdit(true)
    try {
      const data = await api.put(
        `/reports/monthly/${selectedMonth}/${selectedYear}/${editingId}`,
        {
          text: nextText,
          school: nextSchool,
          assignee: nextAssignee
        }
      )
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
      cancelEditing()
    } catch (err) {
      alert(err.message || 'Erro ao editar observação.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleTogglePin = async (obs) => {
    if (!obs?.id || pinningId) return
    setPinningId(obs.id)
    try {
      const data = await api.patch(
        `/reports/monthly/${selectedMonth}/${selectedYear}/${obs.id}/pin`,
        { pinned: !Boolean(obs.pinned) }
      )
      setObservations(data.observations || [])
      setTicketsThisMonth(data.ticketCount || 0)
    } catch (err) {
      alert(err.message || 'Erro ao fixar observação.')
    } finally {
      setPinningId(null)
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
          <div className="mr-filter-picker">
            <PrettySelect
              value={monthOption}
              onChange={(value) => {
                const monthIndex = MONTH_NAMES.indexOf(value)
                if (monthIndex >= 0) setSelectedMonth(monthIndex + 1)
              }}
              options={MONTH_NAMES}
              placeholder="Mês"
              icon={CalendarDays}
              selectKey="filter-month"
              openSelectKey={openSelectKey}
              setOpenSelectKey={setOpenSelectKey}
              allowClear={false}
            />
          </div>
          <div className="mr-filter-picker mr-filter-picker-year">
            <PrettySelect
              value={yearOption}
              onChange={(value) => {
                const parsedYear = Number(value)
                if (Number.isInteger(parsedYear)) setSelectedYear(parsedYear)
              }}
              options={yearOptions}
              placeholder="Ano"
              selectKey="filter-year"
              openSelectKey={openSelectKey}
              setOpenSelectKey={setOpenSelectKey}
              allowClear={false}
            />
          </div>
          <button
            onClick={() => {
              setSelectedMonth(currentMonth)
              setSelectedYear(currentYear)
            }}
            className="mr-current-month-btn"
            disabled={isCurrentPeriod}
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
      ) : sortedObservations.length === 0 ? (
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
          {sortedObservations.map((obs, index) => {
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
                      {obs.pinned && (
                        <span className="mr-obs-pinned-chip">
                          <Pin size={8} />
                          fixada
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
                      <button
                        onClick={() => handleTogglePin(obs)}
                        className={`mr-obs-action-btn ${obs.pinned ? 'mr-obs-action-btn-pinned' : ''}`}
                        title={obs.pinned ? 'Desfixar observação' : 'Fixar observação'}
                        disabled={pinningId === obs.id}
                        onMouseEnter={(e) => {
                          if (obs.pinned) return
                          e.currentTarget.style.color = '#60a5fa'
                          e.currentTarget.style.background = 'rgba(96, 165, 250, 0.12)'
                        }}
                        onMouseLeave={(e) => {
                          if (obs.pinned) return
                          e.currentTarget.style.color = '#64748b'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {obs.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>

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
    </div>
  )
}
