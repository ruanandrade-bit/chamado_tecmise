import { useState, useEffect } from 'react'
import { EyeOff, Plus, Trash2, ShieldAlert, Calendar, Clock, Percent, School, Monitor, Loader2, AlertCircle, Sparkles, Filter, ShieldCheck } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function CameraObstruction() {
  const { user } = useAuthStore()
  const isAdmin = user?.canDragDrop === true

  const [schools, setSchools] = useState({})
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedDevices, setSelectedDevices] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [percentage, setPercentage] = useState(50)
  const [errorMsg, setErrorMsg] = useState('')

  // Filter states
  const [filterSchool, setFilterSchool] = useState('')
  const [filterMinPercent, setFilterMinPercent] = useState('')

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

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
    if (!startTime) return setErrorMsg('Preencha o horário de início.')
    if (!endTime) return setErrorMsg('Preencha o horário de término.')
    if (startTime >= endTime) return setErrorMsg('O horário de término deve ser após o de início.')

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
      // Reset form
      setSelectedSchool('')
      setSelectedDevices([])
      setStartTime('')
      setEndTime('')
      setPercentage(50)
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao salvar registro.')
    } finally {
      setIsSaving(false)
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/camera-obstructions/${id}`)
      setRecords(prev => prev.filter(r => r.id !== id))
      setDeleteTarget(null)
    } catch (err) {
      alert('Falha ao deletar registro.')
    }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchSchool = !filterSchool || r.school === filterSchool
    const matchPercent = !filterMinPercent || r.percentage >= Number(filterMinPercent)
    return matchSchool && matchPercent
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

  // Format time display
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    return timeStr
  }

  const getPercentColor = (pct) => {
    if (pct >= 80) return '#f87171' // high red
    if (pct >= 50) return '#fbbf24' // medium yellow
    return '#34d399' // low green
  }

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
                  <select 
                    className="cob-select"
                    value={selectedSchool}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                  >
                    <option value="">Selecione um colégio...</option>
                    {Object.keys(schools).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
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
                  <div className="cob-form-group flex-1">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Início
                    </label>
                    <input 
                      type="datetime-local"
                      className="cob-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="cob-form-group flex-1">
                    <label className="cob-label">
                      <Clock size={14} /> Horário Fim
                    </label>
                    <input 
                      type="datetime-local"
                      className="cob-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
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
                  <Filter size={12} />
                  <select
                    className="cob-filter-select"
                    value={filterSchool}
                    onChange={(e) => setFilterSchool(e.target.value)}
                  >
                    <option value="">Todos colégios</option>
                    {Object.keys(schools).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="cob-filter-item">
                  <Percent size={12} />
                  <select
                    className="cob-filter-select"
                    value={filterMinPercent}
                    onChange={(e) => setFilterMinPercent(e.target.value)}
                  >
                    <option value="">Todas obstruções</option>
                    <option value="30">A partir de 30%</option>
                    <option value="50">A partir de 50%</option>
                    <option value="80">A partir de 80%</option>
                  </select>
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
                {filteredRecords.map((record) => (
                  <div key={record.id} className="cob-record-card">
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

      {/* Confirmation Modal */}
      {deleteTarget && (
        <div className="cob-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cob-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cob-modal-header">
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <h3>Confirmar Exclusão</h3>
            </div>
            <div className="cob-modal-body">
              <p>Tem certeza que deseja excluir o registro de obstrução de câmera do <strong>{deleteTarget.school}</strong>?</p>
              <p className="cob-modal-warning">Esta ação é irreversível.</p>
            </div>
            <div className="cob-modal-footer">
              <button className="cob-modal-btn cob-modal-btn-cancel" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className="cob-modal-btn cob-modal-btn-confirm" onClick={() => handleDelete(deleteTarget.id)}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern styles matching custom premium dark UI guidelines */}
      <style>{`
        .cob-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: cobFadeIn 0.5s ease-out;
        }

        @keyframes cobFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .cob-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 20px;
        }

        .cob-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cob-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(37, 99, 235, 0.08));
          border: 1px solid rgba(96, 165, 250, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
          box-shadow: 0 0 16px rgba(96, 165, 250, 0.1);
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
        }

        /* Stats Grid */
        .cob-stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        @media (min-width: 640px) {
          .cob-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .cob-stat-card {
          background: rgba(30, 30, 40, 0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
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
          gap: 24px;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .cob-layout-grid {
            grid-template-columns: 380px 1fr;
          }
        }

        .cob-full-width {
          grid-column: span 2;
        }

        /* Cards */
        .cob-section-card {
          background: rgba(15, 15, 30, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
        }

        .cob-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #f3f4f6;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
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
          gap: 16px;
        }

        .cob-form-row {
          display: flex;
          gap: 12px;
        }

        .cob-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
        }

        .cob-percent-indicator {
          font-size: 0.875rem;
          font-weight: 700;
        }

        .cob-select, .cob-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.875rem;
          color: #e5e7eb;
          transition: all 0.2s ease;
          outline: none;
        }

        .cob-select:focus, .cob-input:focus {
          border-color: rgba(96, 165, 250, 0.4);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
          background: rgba(255, 255, 255, 0.05);
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
          gap: 8px;
        }

        .cob-filter-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .cob-filter-select {
          background: transparent;
          border: none;
          color: #f3f4f6;
          outline: none;
          cursor: pointer;
          font-size: 0.75rem;
        }

        /* Records List */
        .cob-records-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 560px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .cob-record-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .cob-record-card:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
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

        /* Modals */
        .cob-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          animation: cobFadeIn 0.2s ease-out;
        }

        .cob-modal-card {
          background: linear-gradient(135deg, #1e1e2d, #151525);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          animation: cobModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cobModalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .cob-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cob-modal-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #f3f4f6;
        }

        .cob-modal-body {
          color: #d1d5db;
          font-size: 0.875rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .cob-modal-warning {
          color: #f87171;
          font-size: 0.75rem;
          margin-top: 8px;
          font-weight: 600;
        }

        .cob-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cob-modal-btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .cob-modal-btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          color: #9ca3af;
        }

        .cob-modal-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f3f4f6;
        }

        .cob-modal-btn-confirm {
          background: #ef4444;
          color: white;
        }

        .cob-modal-btn-confirm:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  )
}
