import { useState, useEffect, useCallback } from 'react'
import { Settings, School, Cpu, BookOpen, Plus, Trash2, Save, Loader2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../services/api'

export default function SchoolConfig() {
  const [schoolData, setSchoolData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedSchool, setExpandedSchool] = useState(null)

  // New school / device inputs
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newDeviceInputs, setNewDeviceInputs] = useState({}) // { schoolName: 'value' }
  const [newTurmaInputs, setNewTurmaInputs] = useState({})  // { 'school|device': 'value' }

  const loadData = useCallback(async () => {
    try {
      const data = await api.get('/schools')
      setSchoolData(data || {})
    } catch (err) {
      console.error('Erro ao carregar escolas:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const updated = await api.put('/schools', { schoolData })
      setSchoolData(updated)
      setHasChanges(false)
    } catch (err) {
      alert(err.message || 'Erro ao salvar configuração.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── School actions ──
  const addSchool = () => {
    const name = newSchoolName.trim()
    if (!name || schoolData[name]) return
    setSchoolData(prev => ({ ...prev, [name]: {} }))
    setNewSchoolName('')
    setExpandedSchool(name)
    setHasChanges(true)
  }

  const removeSchool = (schoolName) => {
    setSchoolData(prev => {
      const copy = { ...prev }
      delete copy[schoolName]
      return copy
    })
    if (expandedSchool === schoolName) setExpandedSchool(null)
    setHasChanges(true)
  }

  // ── Device actions ──
  const addDevice = (schoolName) => {
    const deviceId = (newDeviceInputs[schoolName] || '').trim()
    if (!deviceId) return
    if (schoolData[schoolName]?.[deviceId]) return

    setSchoolData(prev => ({
      ...prev,
      [schoolName]: { ...prev[schoolName], [deviceId]: [] }
    }))
    setNewDeviceInputs(prev => ({ ...prev, [schoolName]: '' }))
    setHasChanges(true)
  }

  const removeDevice = (schoolName, deviceId) => {
    setSchoolData(prev => {
      const devices = { ...prev[schoolName] }
      delete devices[deviceId]
      return { ...prev, [schoolName]: devices }
    })
    setHasChanges(true)
  }

  // ── Turma actions ──
  const addTurma = (schoolName, deviceId) => {
    const key = `${schoolName}|${deviceId}`
    const turma = (newTurmaInputs[key] || '').trim()
    if (!turma) return

    setSchoolData(prev => {
      const turmas = [...(prev[schoolName]?.[deviceId] || []), turma]
      return {
        ...prev,
        [schoolName]: { ...prev[schoolName], [deviceId]: turmas }
      }
    })
    setNewTurmaInputs(prev => ({ ...prev, [key]: '' }))
    setHasChanges(true)
  }

  const removeTurma = (schoolName, deviceId, turmaIndex) => {
    setSchoolData(prev => {
      const turmas = [...(prev[schoolName]?.[deviceId] || [])]
      turmas.splice(turmaIndex, 1)
      return {
        ...prev,
        [schoolName]: { ...prev[schoolName], [deviceId]: turmas }
      }
    })
    setHasChanges(true)
  }

  const schoolNames = Object.keys(schoolData)

  if (isLoading) {
    return (
      <div className="sc-container">
        <div className="sc-loading">
          <Loader2 size={24} style={{ color: '#86efac', animation: 'spin 1s linear infinite' }} />
          <span>Carregando configuração...</span>
        </div>
        <style>{baseStyles}</style>
      </div>
    )
  }

  return (
    <div className="sc-container">
      {/* Header */}
      <div className="sc-page-header">
        <div className="sc-header-icon">
          <Settings size={22} style={{ color: '#86efac' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="sc-page-title">Configurações de Escolas</h1>
          <p className="sc-page-subtitle">Gerencie escolas, devices e turmas</p>
        </div>
        {hasChanges && (
          <button className="sc-save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
            ) : (
              <><Save size={16} /> Salvar Alterações</>
            )}
          </button>
        )}
      </div>

      {/* Unsaved warning */}
      {hasChanges && (
        <div className="sc-warning-bar">
          <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
          <span>Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar.</span>
        </div>
      )}

      {/* Add school */}
      <div className="sc-add-bar">
        <School size={16} style={{ color: '#86efac' }} />
        <input
          className="sc-input"
          placeholder="Nome da nova escola..."
          value={newSchoolName}
          onChange={(e) => setNewSchoolName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSchool()}
        />
        <button className="sc-add-btn" onClick={addSchool} disabled={!newSchoolName.trim()}>
          <Plus size={14} /> Adicionar Escola
        </button>
      </div>

      {/* Schools list */}
      <div className="sc-schools-list">
        {schoolNames.length === 0 ? (
          <div className="sc-empty">
            <School size={28} style={{ color: '#4b5563' }} />
            <p>Nenhuma escola configurada ainda.</p>
          </div>
        ) : (
          schoolNames.map(schoolName => {
            const devices = schoolData[schoolName] || {}
            const deviceIds = Object.keys(devices)
            const isExpanded = expandedSchool === schoolName
            const totalTurmas = deviceIds.reduce((sum, d) => sum + (devices[d]?.length || 0), 0)

            return (
              <div key={schoolName} className={`sc-school-card ${isExpanded ? 'sc-school-expanded' : ''}`}>
                {/* School header */}
                <div className="sc-school-header" onClick={() => setExpandedSchool(isExpanded ? null : schoolName)}>
                  <div className="sc-school-toggle">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="sc-school-info">
                    <h3 className="sc-school-name">{schoolName}</h3>
                    <div className="sc-school-badges">
                      <span className="sc-badge sc-badge-device"><Cpu size={10} /> {deviceIds.length} device{deviceIds.length !== 1 ? 's' : ''}</span>
                      <span className="sc-badge sc-badge-turma"><BookOpen size={10} /> {totalTurmas} turma{totalTurmas !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button
                    className="sc-remove-btn"
                    onClick={(e) => { e.stopPropagation(); removeSchool(schoolName) }}
                    title="Remover escola"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="sc-school-body">
                    {/* Add device */}
                    <div className="sc-add-inline">
                      <Cpu size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      <input
                        className="sc-input sc-input-sm"
                        placeholder="Nº do device..."
                        value={newDeviceInputs[schoolName] || ''}
                        onChange={(e) => setNewDeviceInputs(prev => ({ ...prev, [schoolName]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addDevice(schoolName)}
                      />
                      <button className="sc-add-btn sc-add-btn-sm" onClick={() => addDevice(schoolName)}>
                        <Plus size={12} /> Device
                      </button>
                    </div>

                    {/* Devices grid */}
                    {deviceIds.length === 0 ? (
                      <p className="sc-hint">Nenhum device cadastrado nesta escola.</p>
                    ) : (
                      <div className="sc-devices-grid">
                        {deviceIds.map(deviceId => {
                          const turmas = devices[deviceId] || []
                          const turmaKey = `${schoolName}|${deviceId}`

                          return (
                            <div key={deviceId} className="sc-device-card">
                              <div className="sc-device-header">
                                <span className="sc-device-id">{deviceId}</span>
                                <button
                                  className="sc-remove-btn sc-remove-btn-sm"
                                  onClick={() => removeDevice(schoolName, deviceId)}
                                  title="Remover device"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Turmas */}
                              <div className="sc-turmas-list">
                                {turmas.map((turma, i) => (
                                  <div key={i} className="sc-turma-tag">
                                    <span>{turma}</span>
                                    <button className="sc-turma-remove" onClick={() => removeTurma(schoolName, deviceId, i)}>×</button>
                                  </div>
                                ))}
                              </div>

                              {/* Add turma */}
                              <div className="sc-add-turma">
                                <input
                                  className="sc-input sc-input-xs"
                                  placeholder="Nova turma..."
                                  value={newTurmaInputs[turmaKey] || ''}
                                  onChange={(e) => setNewTurmaInputs(prev => ({ ...prev, [turmaKey]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && addTurma(schoolName, deviceId)}
                                />
                                <button className="sc-add-turma-btn" onClick={() => addTurma(schoolName, deviceId)}>
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <style>{baseStyles}</style>
    </div>
  )
}

const baseStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }

  .sc-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: scFadeIn 0.5s ease-out;
  }

  @keyframes scFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .sc-page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .sc-header-icon {
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

  .sc-page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f3f4f6;
    letter-spacing: -0.01em;
  }

  .sc-page-subtitle {
    font-size: 0.9375rem;
    color: #9ca3af;
    margin-top: 2px;
  }

  .sc-save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px rgba(34, 197, 94, 0.25);
    white-space: nowrap;
  }

  .sc-save-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.35);
  }

  .sc-save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Warning bar ── */
  .sc-warning-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(251, 191, 36, 0.06);
    border: 1px solid rgba(251, 191, 36, 0.15);
    border-radius: 12px;
    color: #fbbf24;
    font-size: 0.8125rem;
  }

  /* ── Add bar ── */
  .sc-add-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(15, 15, 30, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
  }

  .sc-input {
    flex: 1;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #e5e7eb;
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;
  }

  .sc-input:focus {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
  }

  .sc-input-sm { padding: 8px 12px; font-size: 0.8125rem; }
  .sc-input-xs { padding: 6px 10px; font-size: 0.75rem; flex: 1; }

  .sc-add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
    border: 1px solid rgba(34,197,94,0.25);
    border-radius: 10px;
    color: #86efac;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .sc-add-btn:hover:not(:disabled) {
    background: rgba(34,197,94,0.2);
    box-shadow: 0 2px 10px rgba(34,197,94,0.12);
  }

  .sc-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .sc-add-btn-sm { padding: 7px 12px; font-size: 0.75rem; }

  /* ── Loading / Empty ── */
  .sc-loading, .sc-empty {
    display: flex;
    flex-direction: column;
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

  /* ── Schools List ── */
  .sc-schools-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sc-school-card {
    background: rgba(15, 15, 30, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .sc-school-expanded {
    border-color: rgba(34, 197, 94, 0.15);
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }

  .sc-school-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .sc-school-header:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .sc-school-toggle {
    color: #6b7280;
    flex-shrink: 0;
  }

  .sc-school-info {
    flex: 1;
    min-width: 0;
  }

  .sc-school-name {
    font-size: 1rem;
    font-weight: 700;
    color: #f3f4f6;
  }

  .sc-school-badges {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .sc-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .sc-badge-device {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.15);
  }

  .sc-badge-turma {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.15);
  }

  .sc-remove-btn {
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
    flex-shrink: 0;
  }

  .sc-remove-btn:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
  }

  .sc-remove-btn-sm {
    width: 24px;
    height: 24px;
  }

  /* ── School Body ── */
  .sc-school-body {
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    padding-top: 16px;
  }

  .sc-add-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-hint {
    font-size: 0.8125rem;
    color: #4b5563;
    font-style: italic;
  }

  /* ── Devices Grid ── */
  .sc-devices-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .sc-device-card {
    padding: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sc-device-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sc-device-id {
    font-size: 1.125rem;
    font-weight: 800;
    color: #60a5fa;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  /* ── Turmas ── */
  .sc-turmas-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .sc-turma-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.15);
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #86efac;
  }

  .sc-turma-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: color 0.15s;
    padding: 0;
  }

  .sc-turma-remove:hover { color: #f87171; }

  .sc-add-turma {
    display: flex;
    gap: 6px;
  }

  .sc-add-turma-btn {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(34,197,94,0.2);
    background: rgba(34,197,94,0.08);
    color: #86efac;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sc-add-turma-btn:hover {
    background: rgba(34,197,94,0.15);
    box-shadow: 0 0 8px rgba(34,197,94,0.1);
  }
`
