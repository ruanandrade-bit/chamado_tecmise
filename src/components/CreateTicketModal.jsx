import { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, Plus, Loader2, Lock, ChevronDown, Check, School, MapPin, Flag } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'
import { toast } from '../stores/toastStore'
import './CreateTicketModal.css'

function PrettySelectField({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  selectKey,
  openSelectKey,
  setOpenSelectKey,
  allowClear = false,
  disabled = false
}) {
  const containerRef = useRef(null)
  const isOpen = openSelectKey === selectKey

  const normalizedOptions = useMemo(
    () => (options || []).map((item) => (
      typeof item === 'string'
        ? { value: item, label: item, tone: null }
        : {
          value: item.value,
          label: item.label ?? item.value,
          tone: item.tone ?? null
        }
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
    <div className={`ctm-pretty-select ${isOpen ? 'ctm-pretty-select-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`ctm-pretty-trigger ${disabled ? 'ctm-pretty-trigger-disabled' : ''}`}
        onClick={() => {
          if (disabled) return
          setOpenSelectKey(isOpen ? null : selectKey)
        }}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`ctm-pretty-label ${value ? 'ctm-pretty-label-filled' : ''}`}>
          {Icon && <Icon size={14} />}
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={15} className={`ctm-pretty-chevron ${isOpen ? 'ctm-pretty-chevron-open' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="ctm-pretty-options">
          {allowClear && (
            <button
              type="button"
              className={`ctm-pretty-option ${!value ? 'ctm-pretty-option-active' : ''}`}
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
              className={`ctm-pretty-option ${value === item.value ? 'ctm-pretty-option-active' : ''} ${item.tone ? `ctm-pretty-option-${item.tone}` : ''}`}
              onClick={() => pick(item.value)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ '--ctm-option-index': index }}
            >
              {value === item.value && <Check size={12} className="ctm-pretty-option-check" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateTicketModal({ onClose }) {
  const { addTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Load school data from API
  const [schoolData, setSchoolData] = useState({})
  const [schoolsLoading, setSchoolsLoading] = useState(true)

  useEffect(() => {
    api.get('/schools')
      .then(data => setSchoolData(data || {}))
      .catch(err => console.error('Erro ao carregar escolas:', err))
      .finally(() => setSchoolsLoading(false))
  }, [])

  const SCHOOL_NAMES = useMemo(() => Object.keys(schoolData), [schoolData])

  const [formData, setFormData] = useState({
    school: '',
    selectedTurmas: [],
    selectedPeriods: ['Matutino'],
    selectedDevices: [],
    problemType: '',
    description: '',
    priority: 'media'
  })

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [openSelectKey, setOpenSelectKey] = useState(null)

  const periods = ['Matutino', 'Vespertino', 'Integral']
  const problemLocations = [
    'Sem dados no relatório',
    'Gráfico juntos',
    'Sem videos na AWS',
    'Cadastro de escola/turmas',
    'Processar imagens',
    'Criação de acesso S4S'
  ]
  const priorityOptions = [
    { value: 'baixa', label: 'Baixa', tone: 'low' },
    { value: 'media', label: 'Média', tone: 'medium' },
    { value: 'alta', label: 'Alta', tone: 'high' }
  ]

  // Build turma list for selected school: { id, turmaName, device }
  const availableTurmas = useMemo(() => {
    if (!formData.school) return []
    const schoolDevices = schoolData[formData.school] || {}
    const turmas = []
    for (const [device, turmaList] of Object.entries(schoolDevices)) {
      turmaList.forEach((turma, index) => {
        turmas.push({
          id: `${device}::${turma}::${index}`,
          name: turma,
          device
        })
      })
      }
    return turmas
  }, [formData.school, schoolData])

  const turmaById = useMemo(
    () => new Map(availableTurmas.map((item) => [item.id, item])),
    [availableTurmas]
  )

  const selectedTurmaEntries = useMemo(
    () => formData.selectedTurmas.map((id) => turmaById.get(id)).filter(Boolean),
    [formData.selectedTurmas, turmaById]
  )

  // All devices for this school
  const allDevices = useMemo(() => {
    if (!formData.school) return []
    return Object.keys(schoolData[formData.school] || {})
  }, [formData.school, schoolData])

  // Devices that are allowed (linked to selected turmas)
  const allowedDevices = useMemo(() => {
    const devices = new Set()
    for (const turma of selectedTurmaEntries) {
      devices.add(turma.device)
    }
    return devices
  }, [selectedTurmaEntries])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleTurma = (turmaId) => {
    setFormData(prev => {
      const isSelected = prev.selectedTurmas.includes(turmaId)
      const newTurmas = isSelected
        ? prev.selectedTurmas.filter(t => t !== turmaId)
        : [...prev.selectedTurmas, turmaId]

      // Recalculate which devices are allowed after turma change
      const newAllowedDevices = new Set()
      for (const t of newTurmas) {
        const match = turmaById.get(t)
        if (match) newAllowedDevices.add(match.device)
      }
      // Remove any selected devices no longer allowed
      const newSelectedDevices = prev.selectedDevices.filter(d => newAllowedDevices.has(d))

      return { ...prev, selectedTurmas: newTurmas, selectedDevices: newSelectedDevices }
    })
  }

  const toggleDevice = (dev) => {
    if (!allowedDevices.has(dev)) return
    setFormData(prev => {
      const selected = prev.selectedDevices.includes(dev)
        ? prev.selectedDevices.filter(d => d !== dev)
        : [...prev.selectedDevices, dev]
      return { ...prev, selectedDevices: selected }
    })
  }

  const togglePeriod = (period) => {
    setFormData(prev => {
      const selected = prev.selectedPeriods.includes(period)
        ? prev.selectedPeriods.filter(p => p !== period)
        : [...prev.selectedPeriods, period]
      return { ...prev, selectedPeriods: selected }
    })
  }

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files || [])
    fileArray.slice(0, 5 - images.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          preview: event.target.result,
          type: file.type
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleImageUpload(e.dataTransfer.files)
  }

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const missingFields = []
    if (!formData.school.trim()) missingFields.push('Escola')
    if (formData.selectedTurmas.length === 0) missingFields.push('Turma')
    if (formData.selectedDevices.length === 0) missingFields.push('Device')
    if (!formData.description.trim()) missingFields.push('Descrição')

    if (missingFields.length > 0) {
      toast.warning(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      const turmaNameCount = selectedTurmaEntries.reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1
        return acc
      }, {})

      const classroomLabels = selectedTurmaEntries.map((item) => (
        turmaNameCount[item.name] > 1 ? `${item.name} (${item.device})` : item.name
      ))

      await addTicket({
        school: formData.school.trim(),
        classroom: classroomLabels.join(', '),
        device: formData.selectedDevices.join(', '),
        period: formData.selectedPeriods.join(' • '),
        problemType: formData.problemType,
        description: formData.description.trim(),
        priority: formData.priority,
        attachments: images.map(img => ({
          name: img.name,
          preview: img.preview,
          type: img.type
        }))
      })

      onClose()
    } catch (error) {
      toast.error(error.message || 'Não foi possível criar o chamado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ctm-overlay" onClick={onClose}>
      <div className="ctm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top accent line */}
        <div className="ctm-accent-line" />

        {/* Header */}
        <div className="ctm-header">
          <div className="ctm-header-left">
            <div className="ctm-header-icon">
              <Plus size={20} style={{ color: '#86efac' }} />
            </div>
            <h2 className="ctm-header-title">Criar Novo Chamado</h2>
          </div>
          <button onClick={onClose} className="ctm-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="ctm-form">
          {/* Grid de campos */}
          <div className="ctm-grid">
            {/* School - Dropdown predefinido */}
            <div className="ctm-field ctm-field-full">
              <label className="ctm-label">Escola <span className="ctm-required">*</span></label>
              <PrettySelectField
                value={formData.school}
                onChange={(nextSchool) => setFormData((prev) => ({
                  ...prev,
                  school: nextSchool,
                  selectedTurmas: [],
                  selectedDevices: []
                }))}
                options={SCHOOL_NAMES}
                placeholder={schoolsLoading ? 'Carregando escolas...' : 'Selecione a escola'}
                icon={School}
                selectKey="ctm-school"
                openSelectKey={openSelectKey}
                setOpenSelectKey={setOpenSelectKey}
                disabled={schoolsLoading || SCHOOL_NAMES.length === 0}
              />
            </div>

            {/* Turma - Predefined checkboxes */}
            <div className="ctm-field">
              <label className="ctm-label">Turma <span className="ctm-required">*</span></label>
              {!formData.school ? (
                <p className="ctm-hint" style={{ marginTop: 0 }}>Selecione uma escola primeiro</p>
              ) : (
                <>
                  <div className="ctm-turma-grid">
                    {availableTurmas.map(({ id, name, device }) => (
                      <label
                        key={id}
                        className={`ctm-checkbox-item ${formData.selectedTurmas.includes(id) ? 'ctm-checkbox-checked' : ''}`}
                        title={`Device ${device}`}
                      >
                        <span className={`ctm-checkbox-box ${formData.selectedTurmas.includes(id) ? 'ctm-checkbox-box-checked' : ''}`}>
                          {formData.selectedTurmas.includes(id) && '✓'}
                        </span>
                        <span className="ctm-checkbox-label">{name}</span>
                        <span className="ctm-turma-device">{device}</span>
                        <input
                          type="checkbox"
                          checked={formData.selectedTurmas.includes(id)}
                          onChange={() => toggleTurma(id)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="ctm-hint">
                    {formData.selectedTurmas.length} turma{formData.selectedTurmas.length !== 1 ? 's' : ''} selecionada{formData.selectedTurmas.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            {/* Device - Checkboxes filtrados pelas turmas selecionadas */}
            <div className="ctm-field">
              <label className="ctm-label">Device <span className="ctm-required">*</span></label>
              {!formData.school ? (
                <p className="ctm-hint" style={{ marginTop: 0 }}>Selecione uma escola primeiro</p>
              ) : formData.selectedTurmas.length === 0 ? (
                <p className="ctm-hint" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} /> Selecione uma turma primeiro
                </p>
              ) : (
                <>
                  <div className="ctm-checkbox-grid">
                    {allDevices.map(dev => {
                      const isAllowed = allowedDevices.has(dev)
                      const isSelected = formData.selectedDevices.includes(dev)
                      return (
                        <label
                          key={dev}
                          className={`ctm-checkbox-item ${isSelected ? 'ctm-checkbox-checked' : ''} ${!isAllowed ? 'ctm-checkbox-disabled' : ''}`}
                          onClick={(e) => { if (!isAllowed) e.preventDefault() }}
                        >
                          <span className={`ctm-checkbox-box ${isSelected ? 'ctm-checkbox-box-checked' : ''}`}>
                            {isSelected ? '✓' : (!isAllowed ? '' : '')}
                          </span>
                          <span className="ctm-checkbox-label">{dev}</span>
                          {!isAllowed && <Lock size={11} style={{ color: '#4b5563', marginLeft: 'auto' }} />}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDevice(dev)}
                            disabled={!isAllowed}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )
                    })}
                  </div>
                  <p className="ctm-hint">
                    {formData.selectedDevices.length} de {allowedDevices.size} disponíve{allowedDevices.size !== 1 ? 'is' : 'l'} selecionado{formData.selectedDevices.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>

            {/* Period - Checkboxes */}
            <div className="ctm-field">
              <label className="ctm-label">Período</label>
              <div className="ctm-checkbox-grid">
                {periods.map(period => (
                  <label key={period} className={`ctm-checkbox-item ${formData.selectedPeriods.includes(period) ? 'ctm-checkbox-checked' : ''}`}>
                    <span className={`ctm-checkbox-box ${formData.selectedPeriods.includes(period) ? 'ctm-checkbox-box-checked' : ''}`}>
                      {formData.selectedPeriods.includes(period) && '✓'}
                    </span>
                    <span className="ctm-checkbox-label">{period}</span>
                    <input
                      type="checkbox"
                      checked={formData.selectedPeriods.includes(period)}
                      onChange={() => togglePeriod(period)}
                      style={{ display: 'none' }}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Local do problema */}
            <div className="ctm-field">
              <label className="ctm-label">Local do problema</label>
              <PrettySelectField
                value={formData.problemType}
                onChange={(nextProblemType) => setFormData((prev) => ({ ...prev, problemType: nextProblemType }))}
                options={problemLocations}
                placeholder="Escolha o local do problema"
                icon={MapPin}
                selectKey="ctm-problem-type"
                openSelectKey={openSelectKey}
                setOpenSelectKey={setOpenSelectKey}
                allowClear
              />
            </div>

            {/* Responsible - Auto-filled, disabled */}
            <div className="ctm-field">
              <label className="ctm-label">Responsável</label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="ctm-input ctm-input-disabled"
              />
              <p className="ctm-hint">📌 Atribuído automaticamente</p>
            </div>

            {/* Priority */}
            <div className="ctm-field">
              <label className="ctm-label">Prioridade</label>
              <PrettySelectField
                value={formData.priority}
                onChange={(nextPriority) => setFormData((prev) => ({ ...prev, priority: nextPriority }))}
                options={priorityOptions}
                placeholder="Selecione a prioridade"
                icon={Flag}
                selectKey="ctm-priority"
                openSelectKey={openSelectKey}
                setOpenSelectKey={setOpenSelectKey}
              />
            </div>
          </div>

          {/* Description */}
          <div className="ctm-field">
            <label className="ctm-label">Descrição <span className="ctm-required">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o problema em detalhes..."
              rows="4"
              className="ctm-textarea"
              required
            />
          </div>

          {/* Image upload with drag and drop */}
          <div className="ctm-field">
            <label className="ctm-label">Anexar Imagens (até 5)</label>

            {/* Upload area with drag and drop */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`ctm-dropzone ${dragActive ? 'ctm-dropzone-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="ctm-dropzone-content">
                <div className="ctm-dropzone-icon-wrap">
                  <Upload size={22} className={dragActive ? 'ctm-dropzone-icon-active' : 'ctm-dropzone-icon'} />
                </div>
                <div>
                  <p className={`ctm-dropzone-text ${dragActive ? 'ctm-dropzone-text-active' : ''}`}>
                    {dragActive ? 'Solte para fazer upload' : 'Clique para fazer upload'}
                  </p>
                  <p className="ctm-dropzone-sub">ou arraste imagens aqui</p>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              style={{ display: 'none' }}
            />

            {/* Image previews */}
            {images.length > 0 && (
              <div className="ctm-previews">
                <p className="ctm-previews-count">{images.length} imagem{images.length !== 1 ? 's' : ''} anexada{images.length !== 1 ? 's' : ''}</p>
                <div className="ctm-previews-grid">
                  {images.map(img => (
                    <div key={img.id} className="ctm-preview-item">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="ctm-preview-img"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="ctm-preview-remove"
                      >
                        <X size={14} />
                      </button>
                      <p className="ctm-preview-name">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="ctm-actions">
            <button type="button" onClick={onClose} className="ctm-btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="ctm-btn-submit">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Criando...
                </>
              ) : (
                'Criar Chamado'
              )}
              <span className="ctm-btn-glow" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
