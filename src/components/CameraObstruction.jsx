import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { EyeOff, Plus, Trash2, ShieldAlert, Clock, Percent, School, Monitor, Loader2, AlertCircle, Sparkles, Filter, ShieldCheck, ChevronDown, Check, CalendarDays } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './CameraObstruction.css'

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
  const isAdmin = user?.role === 'Admin'
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
  const [selectedDate, setSelectedDate] = useState('')
  const [startClock, setStartClock] = useState('')
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
    if (!selectedDate) return setErrorMsg('Preencha a data da ocorrência.')
    if (!startClock) return setErrorMsg('Preencha a hora de início.')
    if (!endClock) return setErrorMsg('Preencha a hora de término.')

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
      setSelectedDate('')
      setStartClock('')
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
  const startTime = selectedDate && startClock ? `${selectedDate}T${startClock}` : ''
  const endTime = selectedDate && endClock ? `${selectedDate}T${endClock}` : ''

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

  const getPeriodSummary = (startIso, endIso) => {
    if (!startIso || !endIso) return 'Período indisponível'

    const start = new Date(startIso)
    const end = new Date(endIso)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Período indisponível'

    const startLabel = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const endLabel = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const diffMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))

    let durationLabel = `${diffMinutes} min`
    if (diffMinutes >= 60) {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      durationLabel = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
    }

    return `das ${startLabel} às ${endLabel} · ${durationLabel}`
  }

  const getPercentColor = (pct) => {
    if (pct >= 80) return '#f87171' // high red
    if (pct >= 50) return '#fbbf24' // medium yellow
    return '#86efac' // low green
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

                {/* Data + Horarios */}
                <div className="cob-form-group">
                  <label className="cob-label">
                    <CalendarDays size={14} /> Data da ocorrência
                  </label>
                  <CobPrettySelect
                    value={selectedDate}
                    onChange={setSelectedDate}
                    options={dateFieldOptions}
                    placeholder="Dia da semana"
                    icon={CalendarDays}
                    selectKey="form-date"
                    openSelectKey={openSelectKey}
                    setOpenSelectKey={setOpenSelectKey}
                    compact
                  />
                </div>

                <div className="cob-form-row">
                  <div className="cob-form-group">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Início
                    </label>
                    <label className="cob-time-input-wrap" aria-label="Hora de início">
                      <Clock size={14} className="cob-time-input-icon" />
                      <input
                        type="time"
                        className="cob-time-input"
                        value={startClock}
                        onChange={(e) => {
                          const nextClock = e.target.value
                          setStartClock(nextClock)
                          if (endClock && selectedDate && nextClock) {
                            const nextStart = `${selectedDate}T${nextClock}`
                            const currentEnd = `${selectedDate}T${endClock}`
                            if (currentEnd < nextStart) {
                              setEndClock(nextClock)
                            }
                          }
                        }}
                        step="60"
                      />
                    </label>
                  </div>

                  <div className="cob-form-group">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Fim
                    </label>
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
                            <CalendarDays size={12} />
                            Data: {new Date(record.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <span className="cob-time-item">
                            <Clock size={12} />
                            De: {new Date(record.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="cob-time-item">
                            <Clock size={12} />
                            Até: {new Date(record.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="cob-time-item cob-time-period">
                            <Clock size={12} />
                            Período: {getPeriodSummary(record.startTime, record.endTime)}
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
    </div>
  )
}
