import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Plus, Loader2 } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'

const SCHOOL_DEVICES = {
  'Colégio Frei': ['059', '063', '064'],
  'Colégio Dom José': ['048', '053', '069'],
  'Colégio Honorata': ['035', '055'],
  'Colégio Rotary': ['045', '066'],
  'Colégio Mercedes': ['056', '072'],
  'Colégio Terezinha': ['023', '026', '027', '029', '042', '043', '044', '065'],
  'Colégio Cemma': ['050', '067', '071', '076'],
  'Colégio Grace': ['032', '036', '037', '038'],
  'Colégio Graziela': ['012', '014'],
  'Colégio Antônio': ['011', '013'],
  'Colégio Médici': ['034', '070', '073'],
}

const SCHOOL_NAMES = Object.keys(SCHOOL_DEVICES)

export default function CreateTicketModal({ onClose }) {
  const { addTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  
  const [formData, setFormData] = useState({
    school: '',
    classroom: '',
    selectedPeriods: ['Matutino'],
    selectedDevices: [],
    problemType: '',
    description: '',
    priority: 'media'
  })
  
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const periods = ['Matutino', 'Vespertino', 'Integral']
  const problemLocations = [
    'Sem dados no relatório',
    'Gráfico juntos',
    'Sem videos na AWS',
    'Cadastro de escola/turmas',
    'Processar imagens',
    'Criação de acesso S4S'
  ]

  const availableDevices = formData.school ? (SCHOOL_DEVICES[formData.school] || []) : []
  
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'school') {
      // Reset devices when school changes
      setFormData(prev => ({ ...prev, school: value, selectedDevices: [] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const toggleDevice = (dev) => {
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
    if (!formData.classroom.trim()) missingFields.push('Turma')
    if (formData.selectedDevices.length === 0) missingFields.push('Device')
    if (!formData.description.trim()) missingFields.push('Descrição')

    if (missingFields.length > 0) {
      alert(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      await addTicket({
        school: formData.school.trim(),
        classroom: formData.classroom.trim(),
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
              <select
                name="school"
                value={formData.school}
                onChange={handleChange}
                className="ctm-select"
                required
              >
                <option value="" disabled>Selecione a escola</option>
                {SCHOOL_NAMES.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Classroom */}
            <div className="ctm-field">
              <label className="ctm-label">Turma <span className="ctm-required">*</span></label>
              <input
                type="text"
                name="classroom"
                value={formData.classroom}
                onChange={handleChange}
                placeholder="Ex: 5º B, 3º D"
                className="ctm-input"
                required
              />
            </div>

            {/* Device - Checkboxes filtrados pela escola */}
            <div className="ctm-field">
              <label className="ctm-label">Device <span className="ctm-required">*</span></label>
              {!formData.school ? (
                <p className="ctm-hint" style={{ marginTop: 0 }}>Selecione uma escola primeiro</p>
              ) : (
                <>
                  <div className="ctm-checkbox-grid">
                    {availableDevices.map(dev => (
                      <label key={dev} className={`ctm-checkbox-item ${formData.selectedDevices.includes(dev) ? 'ctm-checkbox-checked' : ''}`}>
                        <span className={`ctm-checkbox-box ${formData.selectedDevices.includes(dev) ? 'ctm-checkbox-box-checked' : ''}`}>
                          {formData.selectedDevices.includes(dev) && '✓'}
                        </span>
                        <span className="ctm-checkbox-label">{dev}</span>
                        <input
                          type="checkbox"
                          checked={formData.selectedDevices.includes(dev)}
                          onChange={() => toggleDevice(dev)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="ctm-hint">
                    {formData.selectedDevices.length} de {availableDevices.length} selecionado{formData.selectedDevices.length !== 1 ? 's' : ''}
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
              <select
                name="problemType"
                value={formData.problemType}
                onChange={handleChange}
                className="ctm-select"
              >
                <option value="" disabled>Escolha o local do problema</option>
                {problemLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
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
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="ctm-select"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
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

        /* ── Inputs & Selects ── */
        .ctm-input,
        .ctm-select,
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
        .ctm-select:focus,
        .ctm-textarea:focus {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08), 0 0 16px rgba(34, 197, 94, 0.04);
          background: rgba(255, 255, 255, 0.06);
        }

        .ctm-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }

        .ctm-select option {
          background: #1a1a2e;
          color: #e5e7eb;
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
      `}</style>
    </div>
  )
}
