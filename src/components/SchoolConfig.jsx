import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, School, Cpu, BookOpen, Plus, Trash2, Save, Loader2, AlertTriangle, ChevronDown, ChevronRight, ShieldAlert, Pencil, Check, Briefcase, Users, KeyRound } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const PROFESSIONAL_ROLE_OPTIONS = ['Psicóloga', 'Pedagoga']

function PrettySelectRole({ value, onChange, options, placeholder, selectKey, openSelectKey, setOpenSelectKey }) {
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
    <div className="psr-select" ref={containerRef}>
      <button
        type="button"
        className={`psr-trigger ${didSelect ? 'psr-trigger-picked' : ''}`}
        onClick={() => setOpenSelectKey(isOpen ? null : selectKey)}
        aria-expanded={isOpen}
      >
        <span className={`psr-label ${value ? 'psr-label-filled' : ''}`}>
          <Briefcase size={14} />
          {value || placeholder}
        </span>
        <ChevronDown size={15} className={`psr-chevron ${isOpen ? 'psr-chevron-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="psr-options">
          {options.map((item) => (
            <button
              key={item}
              type="button"
              className={`psr-option ${value === item ? 'psr-option-active' : ''}`}
              onClick={() => handlePick(item)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {value === item && <Check size={12} className="psr-option-check" />}
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SchoolConfig() {
  const user = useAuthStore((state) => state.user)
  const [schoolData, setSchoolData] = useState({})
  const [professionals, setProfessionals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeSection, setActiveSection] = useState('schools')
  const [expandedSchool, setExpandedSchool] = useState(null)
  const [openSelectKey, setOpenSelectKey] = useState(null)

  // New school / device inputs
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newDeviceInputs, setNewDeviceInputs] = useState({}) // { schoolName: 'value' }
  const [newTurmaInputs, setNewTurmaInputs] = useState({})  // { 'school|device': 'value' }

  // Editing device state: { school, oldId, newId }
  const [editingDevice, setEditingDevice] = useState(null)

  // Professionals
  const [newProfessionalName, setNewProfessionalName] = useState('')
  const [newProfessionalRole, setNewProfessionalRole] = useState('')
  const [newProfessionalPassword, setNewProfessionalPassword] = useState('')
  const [editingProfessionalId, setEditingProfessionalId] = useState(null)
  const [editingProfessionalName, setEditingProfessionalName] = useState('')
  const [editingProfessionalRole, setEditingProfessionalRole] = useState('')

  // Confirm delete modal state: { type: 'school'|'device'|'turma', label, action }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const requestDelete = (type, label, action) => {
    setDeleteTarget({ type, label, action })
  }

  const confirmDelete = () => {
    if (deleteTarget?.action) deleteTarget.action()
    setDeleteTarget(null)
  }

  const loadData = useCallback(async () => {
    try {
      const [schoolsResponse, professionalsResponse] = await Promise.all([
        api.get('/schools'),
        api.get('/professionals')
      ])
      setSchoolData(schoolsResponse || {})
      setProfessionals(professionalsResponse?.professionals || [])
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
      const [updatedSchools, updatedProfessionals] = await Promise.all([
        api.put('/schools', { schoolData }),
        api.put('/professionals', { professionals })
      ])
      setSchoolData(updatedSchools || {})
      const nextProfessionals = updatedProfessionals?.professionals || []
      setProfessionals(nextProfessionals)

      if (user?.email) {
        const updatedSelf = nextProfessionals.find((item) => (
          String(item?.id || '') === `user-${user.id}`
          || String(item?.name || '').trim().toLowerCase() === String(user.name || '').trim().toLowerCase()
        ))
        if (updatedSelf && (updatedSelf.role !== user.role || updatedSelf.name !== user.name)) {
          useAuthStore.setState((prev) => ({
            ...prev,
            user: prev.user
              ? { ...prev.user, name: updatedSelf.name, role: updatedSelf.role }
              : prev.user
          }))
        }
      }

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

  const startEditDevice = (schoolName, deviceId) => {
    setEditingDevice({ school: schoolName, oldId: deviceId, newId: deviceId })
  }

  const confirmEditDevice = () => {
    if (!editingDevice) return
    const { school, oldId, newId } = editingDevice
    const trimmed = newId.trim()
    if (!trimmed || trimmed === oldId) {
      setEditingDevice(null)
      return
    }
    if (schoolData[school]?.[trimmed]) {
      alert('Já existe um device com esse número nesta escola.')
      return
    }
    setSchoolData(prev => {
      const devices = { ...prev[school] }
      const turmas = devices[oldId] || []
      delete devices[oldId]
      devices[trimmed] = turmas
      return { ...prev, [school]: devices }
    })
    setEditingDevice(null)
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

  // ── Professionals actions ──
  const addProfessional = () => {
    const name = newProfessionalName.trim()
    const role = newProfessionalRole.trim()
    const password = String(newProfessionalPassword || '').trim()
    if (!name || !role || !password) return
    if (password.length < 6) {
      alert('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (!PROFESSIONAL_ROLE_OPTIONS.includes(role)) return

    const duplicated = professionals.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.role.toLowerCase() === role.toLowerCase())
    if (duplicated) return

    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setProfessionals((prev) => [...prev, { id, name, role, password }])
    setNewProfessionalName('')
    setNewProfessionalRole('')
    setNewProfessionalPassword('')
    setHasChanges(true)
  }

  const removeProfessional = (id) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
    if (editingProfessionalId === id) {
      setEditingProfessionalId(null)
      setEditingProfessionalName('')
      setEditingProfessionalRole('')
    }
    setHasChanges(true)
  }

  const startEditProfessional = (item) => {
    setEditingProfessionalId(item.id)
    setEditingProfessionalName(item.name)
    setEditingProfessionalRole(item.role)
  }

  const confirmEditProfessional = () => {
    if (!editingProfessionalId) return
    const current = professionals.find((item) => item.id === editingProfessionalId)
    if (!current) return

    const name = editingProfessionalName.trim()
    const role = editingProfessionalRole.trim()
    if (!name || !role) return

    const unchanged = current.name.trim() === name && current.role.trim() === role
    if (unchanged) {
      setEditingProfessionalId(null)
      setEditingProfessionalName('')
      setEditingProfessionalRole('')
      return
    }

    setProfessionals((prev) => prev.map((p) => (
      p.id === editingProfessionalId ? { ...p, name, role } : p
    )))
    setEditingProfessionalId(null)
    setEditingProfessionalName('')
    setEditingProfessionalRole('')
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
          <h1 className="sc-page-title">Configurações</h1>
          <p className="sc-page-subtitle">Gerencie escolas, devices, turmas e profissionais</p>
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

      <div className="sc-section-switcher">
        <button
          className={`sc-section-btn ${activeSection === 'schools' ? 'sc-section-btn-active' : ''}`}
          onClick={() => setActiveSection('schools')}
        >
          <School size={14} />
          Escolas
        </button>
        <button
          className={`sc-section-btn ${activeSection === 'professionals' ? 'sc-section-btn-active' : ''}`}
          onClick={() => setActiveSection('professionals')}
        >
          <Users size={14} />
          Outros Profissionais
        </button>
      </div>

      {activeSection === 'schools' ? (
        <>
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
                        onClick={(e) => { e.stopPropagation(); requestDelete('escola', schoolName, () => removeSchool(schoolName)) }}
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
                                    {editingDevice?.school === schoolName && editingDevice?.oldId === deviceId ? (
                                      <div className="sc-edit-inline">
                                        <input
                                          className="sc-input sc-input-xs sc-edit-input"
                                          value={editingDevice.newId}
                                          onChange={e => setEditingDevice(prev => ({ ...prev, newId: e.target.value }))}
                                          onKeyDown={e => { if (e.key === 'Enter') confirmEditDevice(); if (e.key === 'Escape') setEditingDevice(null) }}
                                          autoFocus
                                        />
                                        <button className="sc-edit-confirm" onClick={confirmEditDevice} title="Confirmar">
                                          <Check size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="sc-device-id">{deviceId}</span>
                                    )}
                                    <div className="sc-device-actions">
                                      <button
                                        className="sc-remove-btn sc-remove-btn-sm"
                                        onClick={() => startEditDevice(schoolName, deviceId)}
                                        title="Editar device"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        className="sc-remove-btn sc-remove-btn-sm"
                                        onClick={() => requestDelete('device', `${deviceId} (${schoolName})`, () => removeDevice(schoolName, deviceId))}
                                        title="Remover device"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Turmas */}
                                  <div className="sc-turmas-list">
                                    {turmas.map((turma, i) => (
                                      <div key={i} className="sc-turma-tag">
                                        <span>{turma}</span>
                                        <button className="sc-turma-remove" onClick={() => requestDelete('turma', `${turma} (device ${deviceId})`, () => removeTurma(schoolName, deviceId, i))}>×</button>
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
        </>
      ) : (
        <>
          <div className="sc-add-bar">
            <Briefcase size={16} style={{ color: '#86efac' }} />
            <input
              className="sc-input"
              placeholder="Nome do profissional..."
              value={newProfessionalName}
              onChange={(e) => setNewProfessionalName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProfessional()}
            />
            <PrettySelectRole
              value={newProfessionalRole}
              onChange={setNewProfessionalRole}
              options={PROFESSIONAL_ROLE_OPTIONS}
              placeholder="Selecione o cargo..."
              selectKey="new-role"
              openSelectKey={openSelectKey}
              setOpenSelectKey={setOpenSelectKey}
            />
            <div className="sc-password-wrap">
              <KeyRound size={14} style={{ color: '#64748b' }} />
              <input
                type="password"
                className="sc-input sc-input-password"
                placeholder="Senha (mín. 6)"
                value={newProfessionalPassword}
                onChange={(e) => setNewProfessionalPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addProfessional()}
              />
            </div>
            <button className="sc-add-btn" onClick={addProfessional} disabled={!newProfessionalName.trim() || !newProfessionalRole.trim() || String(newProfessionalPassword || '').trim().length < 6}>
              <Plus size={14} /> Adicionar Profissional
            </button>
          </div>

          <div className="sc-prof-list">
            {professionals.length === 0 ? (
              <div className="sc-empty">
                <Users size={28} style={{ color: '#4b5563' }} />
                <p>Nenhum profissional cadastrado ainda.</p>
              </div>
            ) : (
              professionals.map((item) => (
                <div key={item.id} className="sc-prof-card">
                  {editingProfessionalId === item.id ? (
                    <div className="sc-prof-edit-row">
                      <input
                        className="sc-input sc-input-sm"
                        value={editingProfessionalName}
                        onChange={(e) => setEditingProfessionalName(e.target.value)}
                        placeholder="Nome"
                      />
                      <PrettySelectRole
                        value={editingProfessionalRole}
                        onChange={setEditingProfessionalRole}
                        options={PROFESSIONAL_ROLE_OPTIONS}
                        placeholder="Cargo"
                        selectKey={`edit-role-${item.id}`}
                        openSelectKey={openSelectKey}
                        setOpenSelectKey={setOpenSelectKey}
                      />
                      <button className="sc-edit-confirm" onClick={confirmEditProfessional} title="Confirmar">
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="sc-prof-main">
                      <div className="sc-prof-avatar"><Users size={14} /></div>
                      <div className="sc-prof-info">
                        <h4 className="sc-prof-name">{item.name}</h4>
                        <p className="sc-prof-role">{item.role}</p>
                        {item.email && <p className="sc-prof-email">{item.email}</p>}
                      </div>
                      <div className="sc-prof-actions">
                        <button className="sc-remove-btn sc-remove-btn-sm" onClick={() => startEditProfessional(item)} title="Editar profissional">
                          <Pencil size={12} />
                        </button>
                        <button
                          className="sc-remove-btn sc-remove-btn-sm"
                          onClick={() => requestDelete('profissional', `${item.name} (${item.role})`, () => removeProfessional(item.id))}
                          title="Remover profissional"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="sc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="sc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-accent" />
            <div className="sc-modal-body">
              <div className="sc-modal-icon-wrap">
                <ShieldAlert size={28} style={{ color: '#f87171' }} />
              </div>
              <h3 className="sc-modal-title">Excluir {deleteTarget.type}?</h3>
              <p className="sc-modal-text">
                Tem certeza que deseja remover <strong style={{ color: '#f87171' }}>{deleteTarget.label}</strong>?
                {deleteTarget.type === 'escola' && ' Todos os devices e turmas desta escola também serão removidos.'}
                {deleteTarget.type === 'device' && ' Todas as turmas deste device também serão removidas.'}
              </p>
              <p className="sc-modal-hint">Lembre-se de salvar as alterações para aplicar.</p>
              <div className="sc-modal-actions">
                <button className="sc-modal-btn sc-modal-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="sc-modal-btn sc-modal-confirm" onClick={confirmDelete}>
                  <Trash2 size={14} /> Sim, excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{baseStyles}</style>
    </div>
  )
}

const baseStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }

  .sc-container {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
    max-width: 1700px;
    margin: 0 auto;
    position: relative;
    isolation: isolate;
    animation: scFadeIn 0.5s ease-out;
  }

  .sc-container::before,
  .sc-container::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
    z-index: -1;
    filter: blur(42px);
    opacity: 0.28;
  }

  .sc-container::before {
    width: 320px;
    height: 320px;
    top: -68px;
    right: 10%;
    background: radial-gradient(circle, rgba(34, 197, 94, 0.26), rgba(34, 197, 94, 0));
    animation: scGlowMove 9s ease-in-out infinite;
  }

  .sc-container::after {
    width: 290px;
    height: 290px;
    bottom: 6%;
    left: 2%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0));
    animation: scGlowMove 11s ease-in-out infinite reverse;
  }

  @keyframes scFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scRiseIn {
    from { opacity: 0; transform: translateY(14px) scale(0.992); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes scFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0); }
  }

  @keyframes scGlowMove {
    0% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(8px, -10px, 0); }
    100% { transform: translate3d(0, 0, 0); }
  }

  /* ── Header ── */
  .sc-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 24px;
    animation: scRiseIn 0.45s ease both;
  }

  .sc-header-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08));
    border: 1px solid rgba(34,197,94,0.2);
    box-shadow: 0 0 20px rgba(34,197,94,0.06);
    animation: scFloat 5.6s ease-in-out infinite;
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
    padding: 13px 16px;
    background: rgba(251, 191, 36, 0.06);
    border: 1px solid rgba(251, 191, 36, 0.15);
    border-radius: 12px;
    color: #fbbf24;
    font-size: 0.8125rem;
    animation: scRiseIn 0.45s ease both;
    animation-delay: 0.04s;
  }

  .sc-section-switcher {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    border-radius: 15px;
    background: linear-gradient(155deg, rgba(15, 15, 30, 0.55) 0%, rgba(11, 15, 28, 0.6) 100%);
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 14px 24px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    width: fit-content;
    animation: scRiseIn 0.45s ease both;
    animation-delay: 0.08s;
  }

  .sc-section-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: #94a3b8;
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sc-section-btn:hover {
    color: #d1d5db;
    background: rgba(255, 255, 255, 0.03);
  }

  .sc-section-btn-active {
    color: #86efac;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.25);
  }

  /* ── Add bar ── */
  .sc-add-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: linear-gradient(155deg, rgba(15, 15, 30, 0.55) 0%, rgba(11, 15, 28, 0.6) 100%);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 18px;
    box-shadow: 0 16px 28px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-wrap: wrap;
    animation: scRiseIn 0.45s ease both;
    animation-delay: 0.12s;
    transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
  }

  .sc-add-bar:hover {
    transform: translateY(-1px);
    border-color: rgba(134, 239, 172, 0.18);
    box-shadow: 0 22px 34px rgba(2, 8, 23, 0.3), 0 0 18px rgba(34, 197, 94, 0.06);
  }

  .sc-input {
    flex: 1;
    min-width: 0;
    padding: 11px 14px;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.11);
    border-radius: 11px;
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
  .sc-select { cursor: pointer; }

  .sc-password-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 210px;
    flex: 1;
    padding: 0 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
  }

  .sc-password-wrap:focus-within {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
  }

  .sc-input-password {
    border: none;
    background: transparent;
    padding: 10px 0;
    min-width: 120px;
    box-shadow: none !important;
  }

  .sc-input-password:focus {
    border: none;
    box-shadow: none;
  }

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

  .sc-prof-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sc-prof-card {
    padding: 16px;
    background: linear-gradient(155deg, rgba(15, 15, 30, 0.5) 0%, rgba(10, 14, 26, 0.58) 100%);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 16px;
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
    animation: scRiseIn 0.4s ease both;
  }

  .sc-prof-card:hover {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.2);
    box-shadow: 0 14px 24px rgba(2, 8, 23, 0.24);
  }

  .sc-prof-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sc-prof-avatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #86efac;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.2);
    flex-shrink: 0;
  }

  .sc-prof-info {
    flex: 1;
    min-width: 0;
  }

  .sc-prof-name {
    color: #f3f4f6;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .sc-prof-role {
    color: #9ca3af;
    font-size: 0.8rem;
    margin-top: 2px;
  }

  .sc-prof-email {
    color: #60a5fa;
    font-size: 0.72rem;
    margin-top: 3px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    opacity: 0.85;
  }

  .sc-prof-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sc-prof-edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 8px;
    align-items: center;
  }

  /* ── Loading / Empty ── */
  .sc-loading, .sc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 64px 20px;
    background: linear-gradient(160deg, rgba(15, 15, 30, 0.52) 0%, rgba(10, 13, 24, 0.58) 100%);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.28);
    color: #6b7280;
    font-size: 0.9375rem;
  }

  /* ── Schools List ── */
  .sc-schools-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sc-school-card {
    background: linear-gradient(158deg, rgba(15, 15, 30, 0.6) 0%, rgba(10, 13, 26, 0.68) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    overflow: hidden;
    transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
    box-shadow: 0 16px 28px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: scRiseIn 0.42s ease both;
  }

  .sc-school-card:hover {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.18);
    box-shadow: 0 24px 38px rgba(2, 8, 23, 0.34), 0 0 20px rgba(59, 130, 246, 0.05);
  }

  .sc-school-expanded {
    border-color: rgba(34, 197, 94, 0.24);
    box-shadow: 0 24px 40px rgba(2, 8, 23, 0.34), 0 0 18px rgba(34, 197, 94, 0.08);
  }

  .sc-school-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 22px;
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
    padding: 0 22px 22px;
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
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }

  .sc-device-card {
    padding: 14px;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .sc-device-card:hover {
    transform: translateY(-1px);
    border-color: rgba(96, 165, 250, 0.2);
  }

  .sc-device-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sc-device-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sc-device-id {
    font-size: 1.125rem;
    font-weight: 800;
    color: #60a5fa;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  .sc-edit-inline {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .sc-edit-input {
    width: 80px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #60a5fa;
  }

  .sc-edit-confirm {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid rgba(34,197,94,0.25);
    background: rgba(34,197,94,0.1);
    color: #86efac;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .sc-edit-confirm:hover {
    background: rgba(34,197,94,0.2);
    box-shadow: 0 0 8px rgba(34,197,94,0.15);
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

  /* ── Confirm Delete Modal ── */
  .sc-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: scFadeIn 0.15s ease-out;
  }

  .sc-modal-card {
    width: 100%;
    max-width: 420px;
    margin: 0 16px;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(145deg, rgba(30,35,50,0.97), rgba(18,22,34,0.99));
    border: 1px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(239,68,68,0.06);
    animation: scSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
  }

  @keyframes scSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sc-modal-accent {
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(239,68,68,0.6), rgba(239,68,68,0.8), rgba(239,68,68,0.6), transparent);
  }

  .sc-modal-body {
    padding: 28px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
  }

  .sc-modal-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08));
    border: 1px solid rgba(239,68,68,0.2);
  }

  .sc-modal-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .sc-modal-text {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
  }

  .sc-modal-hint {
    font-size: 0.75rem;
    color: #4b5563;
    font-style: italic;
  }

  .sc-modal-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    margin-top: 4px;
  }

  .sc-modal-btn {
    flex: 1;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .sc-modal-cancel {
    background: rgba(100,116,139,0.1);
    color: #94a3b8;
    border: 1px solid rgba(100,116,139,0.15);
  }

  .sc-modal-cancel:hover {
    background: rgba(100,116,139,0.18);
    border-color: rgba(100,116,139,0.3);
  }

  .sc-modal-confirm {
    background: linear-gradient(135deg, rgba(239,68,68,0.75), rgba(185,28,28,0.85));
    color: #fff;
    border: 1px solid rgba(239,68,68,0.35);
    box-shadow: 0 4px 16px rgba(239,68,68,0.2);
  }

  .sc-modal-confirm:hover {
    box-shadow: 0 6px 24px rgba(239,68,68,0.35);
    transform: translateY(-1px);
  }

  @media (max-width: 860px) {
    .sc-add-bar {
      flex-wrap: wrap;
    }

    .sc-add-bar .sc-input {
      min-width: 220px;
    }

    .sc-prof-edit-row {
      grid-template-columns: 1fr;
    }
  }

  /* ── PrettySelectRole ── */
  .psr-select {
    position: relative;
    flex: 1;
    min-width: 180px;
  }

  .psr-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #e5e7eb;
    font-size: 0.875rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .psr-trigger:hover {
    border-color: rgba(34, 197, 94, 0.2);
    background: rgba(255, 255, 255, 0.06);
  }

  .psr-trigger:focus {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
  }

  .psr-trigger-picked {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
  }

  .psr-label {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .psr-label-filled {
    color: #e5e7eb;
  }

  .psr-chevron {
    flex-shrink: 0;
    color: #6b7280;
    transition: transform 0.2s ease;
  }

  .psr-chevron-open {
    transform: rotate(180deg);
    color: #86efac;
  }

  .psr-options {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 9999;
    background: rgba(20, 25, 40, 0.95);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(34, 197, 94, 0.1);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: psrFadeIn 0.15s ease-out;
  }

  @keyframes psrFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .psr-option {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    border: none;
    color: #d1d5db;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .psr-option:hover {
    background: rgba(34, 197, 94, 0.08);
    color: #86efac;
  }

  .psr-option-active {
    background: rgba(34, 197, 94, 0.15);
    color: #86efac;
    font-weight: 600;
  }

  .psr-option-check {
    color: #86efac;
    flex-shrink: 0;
  }
`
