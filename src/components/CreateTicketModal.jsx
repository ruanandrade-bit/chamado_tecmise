import { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, Plus, Loader2, Lock, ChevronDown, Check, School, MapPin, Flag } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'

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
      alert(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`)
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
      alert(error.message || 'Não foi possível criar o chamado.')
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ctm-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: ctmFadeIn 0.2s ease-out;
        }

        @keyframes ctmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ctm-modal {
          position: relative;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          overflow-y: auto;
          background: rgba(12, 14, 28, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.03),
            0 25px 80px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: ctmSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes ctmSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ctm-modal::-webkit-scrollbar { width: 5px; }
        .ctm-modal::-webkit-scrollbar-track { background: transparent; }
        .ctm-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

        /* ── Accent Line ── */
        .ctm-accent-line {
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(34,197,94,0.5), rgba(134,239,172,0.7), rgba(34,197,94,0.5), transparent);
          border-radius: 24px 24px 0 0;
        }

        /* ── Header ── */
        .ctm-header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          background: rgba(12, 14, 28, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ctm-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ctm-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08));
          border: 1px solid rgba(34,197,94,0.2);
        }

        .ctm-header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .ctm-close-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.04);
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ctm-close-btn:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }

        /* ── Form ── */
        .ctm-form {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ctm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .ctm-grid { grid-template-columns: 1fr; }
        }

        .ctm-field-full {
          grid-column: 1 / -1;
        }

        .ctm-field {
          display: flex;
          flex-direction: column;
        }

        /* ── Labels ── */
        .ctm-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }

        .ctm-required {
          color: #f87171;
          margin-left: 1px;
        }

        .ctm-hint {
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: 6px;
        }

        /* ── Inputs & Custom Selects ── */
        .ctm-input,
        .ctm-textarea {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #e5e7eb;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
          font-family: inherit;
        }

        .ctm-input::placeholder,
        .ctm-textarea::placeholder {
          color: #4b5563;
        }

        .ctm-input:focus,
        .ctm-textarea:focus {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.04);
          background: rgba(255, 255, 255, 0.06);
        }

        .ctm-pretty-select {
          position: relative;
          width: 100%;
        }

        .ctm-pretty-trigger {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #e5e7eb;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.24s ease;
          cursor: pointer;
        }

        .ctm-pretty-trigger:hover {
          border-color: rgba(34, 197, 94, 0.22);
          background: rgba(255, 255, 255, 0.06);
        }

        .ctm-pretty-select-open .ctm-pretty-trigger {
          border-color: rgba(34, 197, 94, 0.42);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.06);
          background: rgba(255, 255, 255, 0.06);
        }

        .ctm-pretty-trigger-disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .ctm-pretty-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          text-align: left;
          line-height: 1.15;
          font-weight: 500;
        }

        .ctm-pretty-label-filled {
          color: #e5e7eb;
        }

        .ctm-pretty-chevron {
          color: #64748b;
          transition: transform 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }

        .ctm-pretty-chevron-open {
          transform: rotate(180deg);
          color: #86efac;
        }

        .ctm-pretty-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 80;
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
          transform-origin: top center;
          animation: ctmSelectPanelIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ctm-pretty-options::-webkit-scrollbar {
          width: 4px;
        }

        .ctm-pretty-options::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 99px;
        }

        .ctm-pretty-option {
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
          transition: all 0.18s ease;
          opacity: 0;
          transform: translateY(6px);
          animation: ctmSelectItemIn 0.24s ease forwards;
          animation-delay: calc(var(--ctm-option-index, 0) * 28ms);
        }

        .ctm-pretty-option:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #dcfce7;
        }

        .ctm-pretty-option-active {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(22, 163, 74, 0.14));
          color: #ecfdf5;
          border: 1px solid rgba(134, 239, 172, 0.35);
        }

        .ctm-pretty-option-check {
          color: #86efac;
          flex-shrink: 0;
        }

        .ctm-pretty-option-low { color: #86efac; }
        .ctm-pretty-option-medium { color: #fcd34d; }
        .ctm-pretty-option-high { color: #fca5a5; }

        .ctm-pretty-option-low.ctm-pretty-option-active {
          color: #dcfce7;
          border-color: rgba(34, 197, 94, 0.45);
        }

        .ctm-pretty-option-medium.ctm-pretty-option-active {
          color: #fef3c7;
          border-color: rgba(250, 204, 21, 0.45);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(180, 83, 9, 0.14));
        }

        .ctm-pretty-option-high.ctm-pretty-option-active {
          color: #fee2e2;
          border-color: rgba(248, 113, 113, 0.45);
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.14));
        }

        @keyframes ctmSelectPanelIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ctmSelectItemIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ctm-input-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ctm-textarea {
          resize: none;
          min-height: 100px;
        }

        /* ── Dropzone ── */
        .ctm-dropzone {
          width: 100%;
          border: 2px dashed rgba(34, 197, 94, 0.2);
          border-radius: 16px;
          padding: 28px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        .ctm-dropzone:hover {
          border-color: rgba(34, 197, 94, 0.4);
          background: rgba(34, 197, 94, 0.03);
        }

        .ctm-dropzone-active {
          border-color: rgba(134, 239, 172, 0.5) !important;
          background: rgba(34, 197, 94, 0.08) !important;
          box-shadow: 0 0 24px rgba(34, 197, 94, 0.08);
        }

        .ctm-dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .ctm-dropzone-icon-wrap {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.12);
          transition: all 0.3s ease;
        }

        .ctm-dropzone:hover .ctm-dropzone-icon-wrap {
          background: rgba(34, 197, 94, 0.14);
          transform: translateY(-2px);
        }

        .ctm-dropzone-icon { color: rgba(134, 239, 172, 0.5); transition: color 0.2s; }
        .ctm-dropzone-icon-active { color: #86efac; }
        .ctm-dropzone:hover .ctm-dropzone-icon { color: #86efac; }

        .ctm-dropzone-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(134, 239, 172, 0.6);
          transition: color 0.2s;
        }
        .ctm-dropzone:hover .ctm-dropzone-text { color: #86efac; }
        .ctm-dropzone-text-active { color: #86efac !important; }

        .ctm-dropzone-sub {
          font-size: 0.75rem;
          color: #4b5563;
          margin-top: 2px;
        }

        /* ── Image Previews ── */
        .ctm-previews { margin-top: 4px; }

        .ctm-previews-count {
          font-size: 0.8125rem;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .ctm-previews-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 640px) {
          .ctm-previews-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .ctm-preview-item {
          position: relative;
        }

        .ctm-preview-img {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.2s;
        }

        .ctm-preview-item:hover .ctm-preview-img {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .ctm-preview-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          background: rgba(239, 68, 68, 0.8);
          color: #fff;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .ctm-preview-item:hover .ctm-preview-remove {
          opacity: 1;
        }

        .ctm-preview-remove:hover {
          background: rgba(220, 38, 38, 1);
          transform: scale(1.1);
        }

        .ctm-preview-name {
          font-size: 0.6875rem;
          color: #6b7280;
          margin-top: 4px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Action Buttons ── */
        .ctm-actions {
          display: flex;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .ctm-btn-cancel {
          flex: 1;
          padding: 13px 20px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #9ca3af;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .ctm-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
        }

        .ctm-btn-submit {
          position: relative;
          flex: 1;
          padding: 13px 20px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ctm-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.35);
        }

        .ctm-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ctm-btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: ctmBtnGlow 3s ease-in-out infinite;
        }

        @keyframes ctmBtnGlow {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }

        /* ── Checkbox Grid ── */
        .ctm-checkbox-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ctm-checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .ctm-checkbox-item:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .ctm-checkbox-checked {
          background: rgba(34, 197, 94, 0.1) !important;
          border-color: rgba(34, 197, 94, 0.3) !important;
        }

        .ctm-checkbox-checked:hover {
          background: rgba(34, 197, 94, 0.15) !important;
          border-color: rgba(34, 197, 94, 0.4) !important;
        }

        .ctm-checkbox-box {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          font-weight: 700;
          color: transparent;
          transition: all 0.2s ease;
        }

        .ctm-checkbox-box-checked {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #22c55e;
          color: #fff;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
        }

        .ctm-checkbox-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #d1d5db;
        }

        .ctm-checkbox-checked .ctm-checkbox-label {
          color: #86efac;
        }

        /* ── Turma device badge ── */
        .ctm-turma-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .ctm-turma-grid { grid-template-columns: 1fr; }
        }

        .ctm-turma-device {
          font-size: 0.625rem;
          font-weight: 600;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: auto;
          letter-spacing: 0.5px;
        }

        .ctm-checkbox-checked .ctm-turma-device {
          color: #4ade80;
          background: rgba(34, 197, 94, 0.1);
        }

        /* ── Disabled device checkbox ── */
        .ctm-checkbox-disabled {
          opacity: 0.35;
          cursor: not-allowed !important;
          pointer-events: none;
        }

        .ctm-checkbox-disabled .ctm-checkbox-label {
          color: #4b5563;
        }
      `}</style>
    </div>
  )
}
