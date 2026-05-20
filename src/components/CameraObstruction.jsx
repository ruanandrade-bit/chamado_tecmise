import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { EyeOff, Plus, Trash2, ShieldAlert, Clock, Percent, School, Monitor, Loader2, AlertCircle, Sparkles, Filter, ShieldCheck, ChevronDown, Check, CalendarDays } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

function CobPrettySelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  selectKey,
  openSelectKey,
  setOpenSelectKey,
  allowClear = false,
  disabled = false,
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
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenSelectKey(null)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [setOpenSelectKey])

  const pick = (nextValue) => {
    onChange(nextValue)
    setOpenSelectKey(null)
  }

  return (
    <div
      className={`cob-pretty-select ${isOpen ? 'cob-pretty-select-open' : ''} ${compact ? 'cob-pretty-select-compact' : ''}`}
      ref={containerRef}
    >
      <button
        type="button"
        className={`cob-pretty-trigger ${disabled ? 'cob-pretty-trigger-disabled' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (disabled) return
          setOpenSelectKey((prev) => (prev === selectKey ? null : selectKey))
        }}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`cob-pretty-label ${value ? 'cob-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`cob-pretty-chevron ${isOpen ? 'cob-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="cob-pretty-options" onMouseDown={(e) => e.stopPropagation()}>
          {allowClear && (
            <button
              type="button"
              className={`cob-pretty-option ${!value ? 'cob-pretty-option-active' : ''}`}
              onClick={() => pick('')}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {placeholder}
            </button>
          )}
          {normalizedOptions.map((item, index) => (
            <button
              key={`${selectKey}-${item.value}`}
              type="button"
              className={`cob-pretty-option ${value === item.value ? 'cob-pretty-option-active' : ''}`}
              onClick={() => pick(item.value)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ '--cob-option-index': index }}
            >
              {value === item.value && <Check size={12} className="cob-pretty-option-check" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  schoolName,
  previewText
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.68)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={!isDeleting ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-[470px] rounded-2xl border overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
          borderColor: 'rgba(239, 68, 68, 0.26)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239, 68, 68, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'slideInUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent)',
          }}
        />

        <div className="relative p-6 flex flex-col items-center text-center gap-5">
          <div
            className="rounded-2xl flex items-center justify-center"
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

          <div className="space-y-2">
            <h3 className="text-[2rem] font-bold" style={{ color: '#f1f5f9', lineHeight: 1.05 }}>
              Excluir Observação?
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Tem certeza que deseja excluir o registro de <strong>{schoolName}</strong>? Essa ação <strong style={{ color: '#f87171' }}>não poderá ser desfeita</strong>.
            </p>
          </div>

          <div
            className="w-full rounded-xl p-3 text-left"
            style={{
              background: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
            }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Observação a ser excluída:</p>
            <p className="text-sm line-clamp-3" style={{ color: '#cbd5e1' }}>
              {previewText}
            </p>
          </div>

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
                  : 'linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.9) 100%)',
                color: '#fff',
                border: '1px solid rgba(239,68,68,0.35)',
                boxShadow: isDeleting ? 'none' : '0 4px 20px rgba(239,68,68,0.2)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="cob-spinner" />
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

export default function CameraObstruction() {
  const { user } = useAuthStore()
  const isAdmin = user?.canDragDrop === true
  const ALL_SCHOOLS_FILTER = '__all_schools__'
  const ALL_PERCENTS_FILTER = '__all_percents__'
  const ALL_DATE_FILTER = '__all_dates__'

  const [schools, setSchools] = useState({})
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedDevices, setSelectedDevices] = useState([])
  const [startDate, setStartDate] = useState('')
  const [startClock, setStartClock] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endClock, setEndClock] = useState('')
  const [percentage, setPercentage] = useState(50)
  const [errorMsg, setErrorMsg] = useState('')

  // Filter states
  const [filterSchool, setFilterSchool] = useState(ALL_SCHOOLS_FILTER)
  const [filterMinPercent, setFilterMinPercent] = useState(ALL_PERCENTS_FILTER)
  const [filterDateRange, setFilterDateRange] = useState(ALL_DATE_FILTER)
  const [openSelectKey, setOpenSelectKey] = useState(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchRecordsOnly = useCallback(async () => {
    try {
      const recordsData = await api.get('/camera-obstructions')
      setRecords(recordsData || [])
    } catch {
      // Silent fail to keep UI stable while polling.
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchRecordsOnly()
    }, 1000)

    const handleFocus = () => fetchRecordsOnly()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchRecordsOnly()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchRecordsOnly])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const [schoolsData, recordsData] = await Promise.all([
        api.get('/schools'),
        api.get('/camera-obstructions')
      ])
      setSchools(schoolsData || {})
      setRecords(recordsData || [])
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setIsLoading(false)
    }
  };

  const handleSchoolChange = (schoolName) => {
    setSelectedSchool(schoolName)
    setSelectedDevices([])
  };

  const toggleDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    )
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) return

    setErrorMsg('')
    if (!selectedSchool) return setErrorMsg('Selecione um colégio.')
    if (selectedDevices.length === 0) return setErrorMsg('Selecione pelo menos um device.')
    if (!startDate || !startClock) return setErrorMsg('Preencha data e hora de início.')
    if (!endDate || !endClock) return setErrorMsg('Preencha data e hora de término.')

    const startMs = new Date(startTime).getTime()
    const endMs = new Date(endTime).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return setErrorMsg('Data/hora inválida. Revise os campos de início e término.')
    }
    if (endMs <= startMs) return setErrorMsg('O horário de término deve ser após o de início.')

    setIsSaving(true)
    try {
      const newRecord = await api.post('/camera-obstructions', {
        school: selectedSchool,
        devices: selectedDevices,
        startTime,
        endTime,
        percentage: Number(percentage)
      })
      setRecords(prev => [newRecord, ...prev])
      fetchRecordsOnly()
      // Reset form
      setSelectedSchool('')
      setSelectedDevices([])
      setStartDate('')
      setStartClock('')
      setEndDate('')
      setEndClock('')
      setPercentage(50)
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao salvar registro.')
    } finally {
      setIsSaving(false)
    }
  };

  const handleDelete = async (id) => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/camera-obstructions/${id}`)
      setRecords(prev => prev.filter(r => r.id !== id))
      fetchRecordsOnly()
      setDeleteTarget(null)
    } catch (err) {
      alert(err.message || 'Falha ao deletar registro.')
    } finally {
      setIsDeleting(false)
    }
  };

  const schoolOptions = useMemo(
    () => Object.keys(schools || {}).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [schools]
  )
  const filterSchoolOptions = useMemo(
    () => [
      { value: ALL_SCHOOLS_FILTER, label: 'Todos colégios' },
      ...schoolOptions.map((name) => ({ value: name, label: name }))
    ],
    [schoolOptions, ALL_SCHOOLS_FILTER]
  )
  const filterPercentOptions = useMemo(
    () => [
      { value: ALL_PERCENTS_FILTER, label: 'Todas obstruções' },
      { value: '30', label: 'A partir de 30%' },
      { value: '50', label: 'A partir de 50%' },
      { value: '80', label: 'A partir de 80%' }
    ],
    [ALL_PERCENTS_FILTER]
  )
  const filterDateOptions = useMemo(
    () => [
      { value: ALL_DATE_FILTER, label: 'Qualquer data' },
      { value: 'today', label: 'Hoje' },
      { value: '24h', label: 'Últimas 24h' },
      { value: '3d', label: 'Últimos 3 dias' },
      { value: '7d', label: 'Últimos 7 dias' },
      { value: 'month', label: 'Este mês' },
    ],
    [ALL_DATE_FILTER]
  )
  const dateFieldOptions = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const day = today.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const weekLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
    return weekLabels.map((weekdayLabel, index) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + index)
      const value = d.toISOString().slice(0, 10)
      const isToday = d.toDateString() === today.toDateString()
      const dateLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      return {
        value,
        label: `${isToday ? 'Hoje · ' : ''}${weekdayLabel} · ${dateLabel}`
      }
    })
  }, [])
  const startTime = startDate && startClock ? `${startDate}T${startClock}` : ''
  const endTime = endDate && endClock ? `${endDate}T${endClock}` : ''

  // Filter records
  const filteredRecords = records.filter(r => {
    const baseDate = new Date(r.startTime || r.createdAt || r.endTime)
    if (Number.isNaN(baseDate.getTime())) return false

    const now = new Date()
    const matchSchool = filterSchool === ALL_SCHOOLS_FILTER || r.school === filterSchool
    const matchPercent = filterMinPercent === ALL_PERCENTS_FILTER || r.percentage >= Number(filterMinPercent)

    let matchDate = true
    if (filterDateRange === 'today') {
      matchDate = baseDate.toDateString() === now.toDateString()
    } else if (filterDateRange === '24h') {
      matchDate = baseDate.getTime() >= (now.getTime() - (24 * 60 * 60 * 1000))
    } else if (filterDateRange === '3d') {
      matchDate = baseDate.getTime() >= (now.getTime() - (3 * 24 * 60 * 60 * 1000))
    } else if (filterDateRange === '7d') {
      matchDate = baseDate.getTime() >= (now.getTime() - (7 * 24 * 60 * 60 * 1000))
    } else if (filterDateRange === 'month') {
      matchDate = baseDate.getMonth() === now.getMonth() && baseDate.getFullYear() === now.getFullYear()
    }

    return matchSchool && matchPercent && matchDate
  })

  // Compute simple stats
  const totalObstructions = records.length
  const maxObstruction = records.length > 0 ? Math.max(...records.map(r => r.percentage)) : 0
  const avgObstruction = records.length > 0 ? Math.round(records.reduce((acc, r) => acc + r.percentage, 0) / records.length) : 0

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const getPercentColor = (pct) => {
    if (pct >= 80) return '#f87171' // high red
    if (pct >= 50) return '#fbbf24' // medium yellow
    return '#34d399' // low green
  }

  const deletePreviewText = useMemo(() => {
    if (!deleteTarget) return ''

    const devices = Array.isArray(deleteTarget.devices)
      ? deleteTarget.devices.map((item) => `Device ${item}`).join(', ')
      : 'Sem devices'

    const start = deleteTarget.startTime
      ? new Date(deleteTarget.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : 'sem início'
    const end = deleteTarget.endTime
      ? new Date(deleteTarget.endTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : 'sem término'

    return `${deleteTarget.school} · ${devices} · Início ${start} · Final ${end} · ${deleteTarget.percentage}% obstruída.`
  }, [deleteTarget])

  return (
    <div className="cob-container">
      {/* Header */}
      <div className="cob-page-header">
        <div className="cob-header-left">
          <div className="cob-header-icon">
            <EyeOff size={24} />
          </div>
          <div>
            <h1 className="cob-page-title">Obstrução de Câmeras</h1>
            <p className="cob-page-subtitle">Registro e monitoramento de câmeras de segurança obstruídas</p>
          </div>
        </div>
        
        {isAdmin ? (
          <span className="cob-badge-admin">
            <ShieldCheck size={14} /> Modo Administrador
          </span>
        ) : (
          <span className="cob-badge-viewonly">
            <AlertCircle size={14} /> Somente Leitura
          </span>
        )}
      </div>

      {/* Stats Cards */}
      <div className="cob-stats-grid">
        <div className="cob-stat-card">
          <div className="cob-stat-icon-wrapper" style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}>
            <EyeOff size={20} />
          </div>
          <div>
            <p className="cob-stat-label">Total de Obstruções</p>
            <h3 className="cob-stat-value">{totalObstructions}</h3>
          </div>
        </div>
        
        <div className="cob-stat-card">
          <div className="cob-stat-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }}>
            <Percent size={20} />
          </div>
          <div>
            <p className="cob-stat-label">Média de Obstrução</p>
            <h3 className="cob-stat-value">{avgObstruction}%</h3>
          </div>
        </div>

        <div className="cob-stat-card">
          <div className="cob-stat-icon-wrapper" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="cob-stat-label">Pico de Obstrução</p>
            <h3 className="cob-stat-value">{maxObstruction}%</h3>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="cob-layout-grid">
        {/* Form Column - Visible to Admin Only */}
        {isAdmin && (
          <div className="cob-form-section">
            <div className="cob-section-card">
              <h2 className="cob-section-title">
                <span className="cob-section-accent" />
                Registrar Nova Obstrução
              </h2>

              <form onSubmit={handleSubmit} className="cob-form">
                {errorMsg && (
                  <div className="cob-alert-error">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Colegio */}
                <div className="cob-form-group">
                  <label className="cob-label">
                    <School size={14} /> Colégio
                  </label>
                  <CobPrettySelect
                    value={selectedSchool}
                    onChange={handleSchoolChange}
                    options={schoolOptions}
                    placeholder="Selecione um colégio..."
                    icon={School}
                    selectKey="form-school"
                    openSelectKey={openSelectKey}
                    setOpenSelectKey={setOpenSelectKey}
                  />
                </div>

                {/* Devices */}
                {selectedSchool && (
                  <div className="cob-form-group">
                    <label className="cob-label">
                      <Monitor size={14} /> Devices cadastrados
                    </label>
                    <p className="cob-helper-text">Selecione um ou mais devices afetados:</p>
                    <div className="cob-device-tags">
                      {Object.keys(schools[selectedSchool] || {}).map(deviceId => {
                        const isSelected = selectedDevices.includes(deviceId)
                        return (
                          <button
                            type="button"
                            key={deviceId}
                            className={`cob-device-tag ${isSelected ? 'cob-device-tag-selected' : ''}`}
                            onClick={() => toggleDevice(deviceId)}
                          >
                            Device {deviceId}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Horarios */}
                <div className="cob-form-row">
                  <div className="cob-form-group">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Início
                    </label>
                    <div className="cob-date-time-grid">
                      <CobPrettySelect
                        value={startDate}
                        onChange={(nextDate) => {
                          setStartDate(nextDate)
                          if (endDate && endClock && startClock) {
                            const nextStart = `${nextDate}T${startClock}`
                            const currentEnd = `${endDate}T${endClock}`
                            if (currentEnd < nextStart) {
                              setEndDate(nextDate)
                              setEndClock(startClock)
                            }
                          }
                        }}
                        options={dateFieldOptions}
                        placeholder="Dia da semana"
                        icon={CalendarDays}
                        selectKey="form-start-date"
                        openSelectKey={openSelectKey}
                        setOpenSelectKey={setOpenSelectKey}
                        compact
                      />
                      <label className="cob-time-input-wrap" aria-label="Hora de início">
                        <Clock size={14} className="cob-time-input-icon" />
                        <input
                          type="time"
                          className="cob-time-input"
                          value={startClock}
                          onChange={(e) => {
                            const nextClock = e.target.value
                            setStartClock(nextClock)
                            if (endDate && endClock && startDate) {
                              const nextStart = `${startDate}T${nextClock}`
                              const currentEnd = `${endDate}T${endClock}`
                              if (currentEnd < nextStart) {
                                setEndDate(startDate)
                                setEndClock(nextClock)
                              }
                            }
                          }}
                          step="60"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="cob-form-group">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Fim
                    </label>
                    <div className="cob-date-time-grid">
                      <CobPrettySelect
                        value={endDate}
                        onChange={(nextDate) => setEndDate(nextDate)}
                        options={dateFieldOptions}
                        placeholder="Dia da semana"
                        icon={CalendarDays}
                        selectKey="form-end-date"
                        openSelectKey={openSelectKey}
                        setOpenSelectKey={setOpenSelectKey}
                        compact
                      />
                      <label className="cob-time-input-wrap" aria-label="Hora de término">
                        <Clock size={14} className="cob-time-input-icon" />
                        <input
                          type="time"
                          className="cob-time-input"
                          value={endClock}
                          onChange={(e) => setEndClock(e.target.value)}
                          step="60"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Porcentagem */}
                <div className="cob-form-group">
                  <div className="cob-label-row">
                    <label className="cob-label">
                      <Percent size={14} /> Grau de Obstrução
                    </label>
                    <span className="cob-percent-indicator" style={{ color: getPercentColor(percentage) }}>
                      {percentage}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    className="cob-range"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                  <div className="cob-range-labels">
                    <span>0% (Livre)</span>
                    <span>100% (Obstruída)</span>
                  </div>
                </div>

                <button type="submit" className="cob-submit-btn" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="cob-spinner" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Salvar Registro
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Logs Table Column */}
        <div className={`cob-list-section ${!isAdmin ? 'cob-full-width' : ''}`}>
          <div className="cob-section-card">
            <div className="cob-list-header">
              <h2 className="cob-section-title">
                <span className="cob-section-accent" />
                Histórico de Ocorrências
              </h2>
              
              {/* Simple filter bar */}
              <div className="cob-filters">
                <div className="cob-filter-item">
                  <CobPrettySelect
                    value={filterSchool}
                    onChange={setFilterSchool}
                    options={filterSchoolOptions}
                    placeholder="Filtro de colégio"
                    icon={Filter}
                    selectKey="filter-school"
                    openSelectKey={openSelectKey}
                    setOpenSelectKey={setOpenSelectKey}
                    compact
                  />
                </div>

                <div className="cob-filter-item">
                  <CobPrettySelect
                    value={filterMinPercent}
                    onChange={setFilterMinPercent}
                    options={filterPercentOptions}
                    placeholder="Filtro de obstrução"
                    icon={Percent}
                    selectKey="filter-percent"
                    openSelectKey={openSelectKey}
                    setOpenSelectKey={setOpenSelectKey}
                    compact
                  />
                </div>

                <div className="cob-filter-item">
                  <CobPrettySelect
                    value={filterDateRange}
                    onChange={setFilterDateRange}
                    options={filterDateOptions}
                    placeholder="Filtro de data"
                    icon={CalendarDays}
                    selectKey="filter-date"
                    openSelectKey={openSelectKey}
                    setOpenSelectKey={setOpenSelectKey}
                    compact
                  />
                </div>

              </div>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="cob-loading-state">
                <Loader2 size={32} className="cob-spinner" />
                <p>Carregando histórico...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="cob-empty-state">
                <Sparkles size={32} style={{ color: '#4b5563' }} />
                <p>Nenhuma ocorrência registrada.</p>
              </div>
            ) : (
              <div className="cob-records-list">
                {filteredRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="cob-record-card"
                    style={{ '--cob-item-index': Math.min(index, 10) }}
                  >
                    <div className="cob-record-main">
                      <div className="cob-record-details">
                        <div className="cob-record-school-row">
                          <School size={14} className="cob-record-school-icon" />
                          <span className="cob-record-school">{record.school}</span>
                        </div>
                        
                        <div className="cob-record-devices">
                          {record.devices.map(dev => (
                            <span key={dev} className="cob-record-device-badge">
                              Device {dev}
                            </span>
                          ))}
                        </div>

                        <div className="cob-record-time-info">
                          <span className="cob-time-item">
                            <Clock size={12} />
                            De: {new Date(record.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({new Date(record.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                          </span>
                          <span className="cob-time-item">
                            <Clock size={12} />
                            Até: {new Date(record.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({new Date(record.endTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                          </span>
                        </div>
                      </div>

                      <div className="cob-record-side">
                        <div className="cob-percent-gauge">
                          <span className="cob-gauge-number" style={{ color: getPercentColor(record.percentage) }}>
                            {record.percentage}%
                          </span>
                          <span className="cob-gauge-label">Obstruída</span>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(record)}
                            className="cob-delete-btn"
                            title="Remover ocorrência"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="cob-record-meta-footer">
                      <span>Registrado por {record.createdBy} em {formatDate(record.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (isDeleting) return
          setDeleteTarget(null)
        }}
        onConfirm={() => deleteTarget?.id && handleDelete(deleteTarget.id)}
        isDeleting={isDeleting}
        schoolName={deleteTarget?.school || 'registro selecionado'}
        previewText={deletePreviewText}
      />

      {/* Modern styles matching custom premium dark UI guidelines */}
      <style>{`
        .cob-container {
          display: flex;
          flex-direction: column;
          gap: 34px;
          width: 100%;
          max-width: 1700px;
          margin: 0 auto;
          position: relative;
          isolation: isolate;
          animation: cobFadeIn 0.55s ease-out;
        }

        .cob-container::before,
        .cob-container::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          z-index: -1;
          filter: blur(42px);
          opacity: 0.28;
        }

        .cob-container::before {
          width: 320px;
          height: 320px;
          top: -70px;
          right: 10%;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.36), rgba(37, 99, 235, 0));
          animation: cobGlowMove 9s ease-in-out infinite;
        }

        .cob-container::after {
          width: 280px;
          height: 280px;
          bottom: 8%;
          left: 4%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0));
          animation: cobGlowMove 11s ease-in-out infinite reverse;
        }

        @keyframes cobFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cobRiseIn {
          from { opacity: 0; transform: translateY(14px) scale(0.992); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes cobFloat {
          0% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }

        @keyframes cobGlowMove {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(8px, -10px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        /* Header */
        .cob-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 24px;
          animation: cobRiseIn 0.45s ease both;
        }

        .cob-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cob-header-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(37, 99, 235, 0.08));
          border: 1px solid rgba(96, 165, 250, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          box-shadow: 0 0 16px rgba(96, 165, 250, 0.1);
          animation: cobFloat 5.6s ease-in-out infinite;
        }

        .cob-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }

        .cob-page-subtitle {
          color: #9ca3af;
          font-size: 0.9375rem;
        }

        .cob-badge-admin {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.2);
          box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.09), 0 10px 24px rgba(34, 197, 94, 0.09);
        }

        .cob-badge-viewonly {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: rgba(96, 165, 250, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.2);
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.09), 0 10px 24px rgba(96, 165, 250, 0.09);
        }

        /* Stats Grid */
        .cob-stats-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 18px;
        }

        @media (min-width: 840px) {
          .cob-stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .cob-stat-card {
          background: linear-gradient(155deg, rgba(30, 30, 40, 0.52) 0%, rgba(16, 20, 34, 0.5) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 16px 28px rgba(0, 0, 0, 0.2);
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
          animation: cobRiseIn 0.4s ease both;
        }

        .cob-stat-card:nth-child(1) { animation-delay: 0.04s; }
        .cob-stat-card:nth-child(2) { animation-delay: 0.1s; }
        .cob-stat-card:nth-child(3) { animation-delay: 0.16s; }

        .cob-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(96, 165, 250, 0.24);
          box-shadow: 0 24px 36px rgba(2, 8, 23, 0.38), 0 0 22px rgba(59, 130, 246, 0.08);
        }

        .cob-stat-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cob-stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .cob-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #f3f4f6;
          line-height: 1.2;
        }

        /* Layout Grid */
        .cob-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          align-items: start;
        }

        @media (min-width: 1120px) {
          .cob-layout-grid {
            grid-template-columns: 430px minmax(0, 1fr);
          }
        }

        @media (min-width: 1600px) {
          .cob-layout-grid {
            grid-template-columns: 470px minmax(0, 1fr);
          }
        }

        .cob-full-width {
          grid-column: span 2;
        }

        /* Cards */
        .cob-section-card {
          background: linear-gradient(158deg, rgba(15, 15, 30, 0.62) 0%, rgba(10, 13, 26, 0.68) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          padding: 30px;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
          animation: cobRiseIn 0.45s ease both;
        }

        .cob-form-section .cob-section-card { animation-delay: 0.08s; }
        .cob-list-section .cob-section-card { animation-delay: 0.14s; }

        .cob-section-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.22);
          box-shadow: 0 24px 46px rgba(0, 0, 0, 0.35), 0 0 24px rgba(59, 130, 246, 0.05);
        }

        .cob-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #f3f4f6;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }

        .cob-section-accent {
          width: 4px;
          height: 20px;
          background: linear-gradient(180deg, #60a5fa, #2563eb);
          border-radius: 99px;
          flex-shrink: 0;
        }

        /* Form styling */
        .cob-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cob-form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        @media (max-width: 560px) {
          .cob-form-row {
            grid-template-columns: 1fr;
          }
        }

        .cob-form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .cob-date-time-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .cob-time-input-wrap {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.24s ease;
        }

        .cob-time-input-wrap:hover {
          border-color: rgba(34, 197, 94, 0.24);
          background: rgba(255, 255, 255, 0.06);
        }

        .cob-time-input-wrap:focus-within {
          border-color: rgba(34, 197, 94, 0.42);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.06);
          background: rgba(255, 255, 255, 0.06);
        }

        .cob-time-input-icon {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .cob-time-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #e5e7eb;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          color-scheme: dark;
          -webkit-appearance: none;
          appearance: none;
          -moz-appearance: textfield;
        }

        .cob-time-input::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }

        .cob-time-input::-webkit-clear-button,
        .cob-time-input::-webkit-inner-spin-button,
        .cob-time-input::-webkit-outer-spin-button {
          display: none;
          -webkit-appearance: none;
          margin: 0;
        }

        .cob-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #9ca3af;
        }

        .cob-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cob-helper-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: -2px;
        }

        .cob-percent-indicator {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .cob-input {
          width: 100%;
          min-width: 0;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.875rem;
          color: #e5e7eb;
          transition: all 0.2s ease;
          outline: none;
          color-scheme: dark;
        }

        .cob-input:focus {
          border-color: rgba(96, 165, 250, 0.4);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
          background: rgba(255, 255, 255, 0.05);
        }

        .cob-pretty-select {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .cob-pretty-trigger {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.24s ease;
        }

        .cob-pretty-trigger:hover {
          border-color: rgba(34, 197, 94, 0.24);
          background: rgba(255, 255, 255, 0.06);
        }

        .cob-pretty-select-open .cob-pretty-trigger {
          border-color: rgba(34, 197, 94, 0.42);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.06);
          background: rgba(255, 255, 255, 0.06);
        }

        .cob-pretty-trigger-disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cob-pretty-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          text-align: left;
          font-size: 0.9rem;
          line-height: 1.15;
          font-weight: 500;
        }

        .cob-pretty-label-filled {
          color: #e5e7eb;
        }

        .cob-pretty-chevron {
          color: #64748b;
          transition: transform 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }

        .cob-pretty-chevron-open {
          transform: rotate(180deg);
          color: #86efac;
        }

        .cob-pretty-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 260px;
          overflow-y: auto;
          padding: 8px;
          border-radius: 14px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: linear-gradient(170deg, rgba(17, 22, 36, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55), 0 0 25px rgba(34, 197, 94, 0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: cobSelectPanelIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cob-pretty-options::-webkit-scrollbar {
          width: 4px;
        }

        .cob-pretty-options::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 99px;
        }

        .cob-pretty-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 11px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #cbd5e1;
          text-align: left;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          opacity: 0;
          transform: translateY(6px);
          animation: cobSelectItemIn 0.24s ease forwards;
          animation-delay: calc(var(--cob-option-index, 0) * 28ms);
        }

        .cob-pretty-option:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #dcfce7;
        }

        .cob-pretty-option-active {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(22, 163, 74, 0.14));
          color: #ecfdf5;
          border: 1px solid rgba(134, 239, 172, 0.35);
        }

        .cob-pretty-option-check {
          color: #86efac;
          flex-shrink: 0;
        }

        @keyframes cobSelectPanelIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cobSelectItemIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cob-device-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          max-height: 120px;
          overflow-y: auto;
        }

        .cob-device-tag {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cob-device-tag:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f3f4f6;
        }

        .cob-device-tag-selected {
          background: rgba(96, 165, 250, 0.15);
          border-color: rgba(96, 165, 250, 0.3);
          color: #60a5fa;
        }

        .cob-range {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          margin: 10px 0;
        }

        .cob-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .cob-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .cob-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: #6b7280;
        }

        .cob-submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          margin-top: 10px;
        }

        .cob-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }

        .cob-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Error alert */
        .cob-alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #f87171;
          font-size: 0.8125rem;
          border-radius: 10px;
        }

        /* List Header & Filters */
        .cob-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .cob-filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        .cob-filter-item {
          min-width: 240px;
          flex: 1 1 240px;
          max-width: 320px;
        }

        @media (max-width: 1024px) {
          .cob-filter-item {
            max-width: none;
            min-width: 190px;
            flex-basis: 190px;
          }
        }

        .cob-pretty-select-compact .cob-pretty-trigger {
          min-height: 44px;
          padding: 11px 13px;
          border-radius: 10px;
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
        }

        .cob-pretty-select-compact .cob-pretty-label {
          font-size: 0.86rem;
          color: #d1d5db;
        }

        .cob-pretty-select-compact .cob-pretty-options {
          border-radius: 12px;
          max-height: 240px;
        }

        .cob-pretty-select-compact .cob-pretty-option {
          font-size: 0.8rem;
          padding: 9px 10px;
          opacity: 1;
          transform: none;
          animation: none;
        }

        /* Records List */
        .cob-records-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 620px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .cob-record-card {
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.028) 0%, rgba(255, 255, 255, 0.018) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 18px;
          transition: all 0.24s ease;
          opacity: 0;
          transform: translateY(10px);
          animation: cobRecordIn 0.35s ease forwards;
          animation-delay: calc(var(--cob-item-index, 0) * 36ms);
        }

        .cob-record-card:hover {
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.026) 100%);
          border-color: rgba(147, 197, 253, 0.22);
          transform: translateX(2px) translateY(-1px);
          box-shadow: 0 16px 26px rgba(0, 0, 0, 0.24);
        }

        @keyframes cobRecordIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .cob-record-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .cob-record-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cob-record-school-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cob-record-school-icon {
          color: #60a5fa;
        }

        .cob-record-school {
          font-weight: 700;
          color: #f3f4f6;
          font-size: 0.9375rem;
        }

        .cob-record-devices {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .cob-record-device-badge {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #60a5fa;
        }

        .cob-record-time-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cob-time-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .cob-record-side {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .cob-percent-gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0, 0, 0, 0.15);
          padding: 8px 12px;
          border-radius: 10px;
          min-width: 72px;
        }

        .cob-gauge-number {
          font-size: 1.125rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 2px;
        }

        .cob-gauge-label {
          font-size: 0.625rem;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
        }

        .cob-delete-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: rgba(239, 68, 68, 0.08);
          color: #f87171;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cob-delete-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          transform: scale(1.05);
        }

        .cob-record-meta-footer {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.6875rem;
          color: #4b5563;
        }

        @media (prefers-reduced-motion: reduce) {
          .cob-container,
          .cob-container * {
            animation: none !important;
            transition: none !important;
          }
        }

        /* Loading / Empty States */
        .cob-loading-state, .cob-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 20px;
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .cob-spinner {
          animation: cobSpin 1s linear infinite;
        }

        @keyframes cobSpin {
          to { transform: rotate(360deg); }
        }

      `}</style>
    </div>
  )
}
