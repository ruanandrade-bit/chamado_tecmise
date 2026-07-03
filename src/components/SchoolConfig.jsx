import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, School, Cpu, BookOpen, Plus, Trash2, Save, Loader2, AlertTriangle, ChevronDown, ChevronRight, ShieldAlert, Pencil, Check, Briefcase, Users, KeyRound, Mail } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../stores/toastStore'
import './SchoolConfig.css'

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
  const [newProfessionalCompanyEmail, setNewProfessionalCompanyEmail] = useState('')
  const [editingProfessionalId, setEditingProfessionalId] = useState(null)
  const [editingProfessionalName, setEditingProfessionalName] = useState('')
  const [editingProfessionalRole, setEditingProfessionalRole] = useState('')
  const [editingProfessionalCompanyEmail, setEditingProfessionalCompanyEmail] = useState('')

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
      toast.error(err.message || 'Erro ao salvar configuração.')
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
      toast.warning('Já existe um device com esse número nesta escola.')
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
      toast.warning('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (!PROFESSIONAL_ROLE_OPTIONS.includes(role)) return

    const duplicated = professionals.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.role.toLowerCase() === role.toLowerCase())
    if (duplicated) return

    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setProfessionals((prev) => [...prev, { id, name, role, password, companyEmail: newProfessionalCompanyEmail.trim() }])
    setNewProfessionalName('')
    setNewProfessionalRole('')
    setNewProfessionalPassword('')
    setNewProfessionalCompanyEmail('')
    setHasChanges(true)
  }

  const removeProfessional = (id) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
    if (editingProfessionalId === id) {
      setEditingProfessionalId(null)
      setEditingProfessionalName('')
      setEditingProfessionalRole('')
      setEditingProfessionalCompanyEmail('')
    }
    setHasChanges(true)
  }

  const startEditProfessional = (item) => {
    setEditingProfessionalId(item.id)
    setEditingProfessionalName(item.name)
    setEditingProfessionalRole(item.role)
    setEditingProfessionalCompanyEmail(item.companyEmail || '')
  }

  const confirmEditProfessional = () => {
    if (!editingProfessionalId) return
    const current = professionals.find((item) => item.id === editingProfessionalId)
    if (!current) return

    const name = editingProfessionalName.trim()
    const role = editingProfessionalRole.trim()
    if (!name || !role) return

    const unchanged = current.name.trim() === name && current.role.trim() === role && (current.companyEmail || '') === editingProfessionalCompanyEmail.trim()
    if (unchanged) {
      setEditingProfessionalId(null)
      setEditingProfessionalName('')
      setEditingProfessionalRole('')
      setEditingProfessionalCompanyEmail('')
      return
    }

    setProfessionals((prev) => prev.map((p) => (
      p.id === editingProfessionalId ? { ...p, name, role, companyEmail: editingProfessionalCompanyEmail.trim() } : p
    )))
    setEditingProfessionalId(null)
    setEditingProfessionalName('')
    setEditingProfessionalRole('')
    setEditingProfessionalCompanyEmail('')
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
            <div className="sc-password-wrap">
              <Mail size={14} style={{ color: '#64748b' }} />
              <input
                type="email"
                className="sc-input sc-input-password"
                placeholder="E-mail do Google (opcional)"
                value={newProfessionalCompanyEmail}
                onChange={(e) => setNewProfessionalCompanyEmail(e.target.value)}
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
                      <input
                        className="sc-input sc-input-sm"
                        value={editingProfessionalCompanyEmail}
                        onChange={(e) => setEditingProfessionalCompanyEmail(e.target.value)}
                        placeholder="E-mail do Google"
                        type="email"
                        style={{ maxWidth: '200px' }}
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
                        {item.companyEmail && (
                          <p className="sc-prof-email" style={{ color: '#fbbf24', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={11} /> Agenda: {item.companyEmail}
                          </p>
                        )}
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
    </div>
  )
}
