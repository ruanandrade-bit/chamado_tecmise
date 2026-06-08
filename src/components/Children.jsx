import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Edit3, Loader2, Plus, Search, ShieldAlert, UserRound, Users, X } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Children.css'

const emptyForm = {
  name: '',
  analysisRequired: '',
  periodStart: '',
  periodEnd: '',
  completedStatus: '',
  observations: ''
}

const analysisOptions = ['SIM', 'NÃO', 'TIRAR/ NÃO TEM DADOS', 'NÃO TEM DADOS', 'Desligada a Camera']
const completedOptions = ['SIM', 'NÃO', 'X', 'NÃO TEM DADOS', '-']
const ALL_TURMAS_OPTION = 'Todas as turmas'

function normalizeRole(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function PrettySelect({ value, options, placeholder, selectKey, openSelectKey, setOpenSelectKey, onChange, disabled = false }) {
  const ref = useRef(null)
  const isOpen = openSelectKey === selectKey

  useEffect(() => {
    if (openSelectKey !== selectKey) return

    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpenSelectKey(null)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [openSelectKey, selectKey, setOpenSelectKey])

  return (
    <div className="ch-select" ref={ref}>
      <button
        type="button"
        className={`ch-select-trigger ${isOpen ? 'ch-select-trigger-open' : ''}`}
        disabled={disabled}
        onClick={() => setOpenSelectKey(isOpen ? null : selectKey)}
        aria-expanded={isOpen}
      >
        <span className={value ? 'ch-select-label-filled' : ''}>{value || placeholder}</span>
        <ChevronDown size={15} className={`ch-select-chevron ${isOpen ? 'ch-select-chevron-open' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="ch-select-options">
          {options.map((option, index) => (
            <button
              key={`${selectKey}-${option}`}
              type="button"
              className={`ch-select-option ${value === option ? 'ch-select-option-active' : ''}`}
              onClick={() => {
                onChange(option)
                setOpenSelectKey(null)
              }}
              style={{ '--ch-option-index': index }}
            >
              {value === option && <Check size={12} />}
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDayMonthInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function Children() {
  const { user } = useAuthStore()
  const role = normalizeRole(user?.role)
  const canAccess = user?.canDragDrop === true || role === 'pedagoga' || role === 'psicologa'
  const loggedUserName = user?.name || 'Usuário'

  const [schoolData, setSchoolData] = useState({})
  const [children, setChildren] = useState([])
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedTurma, setSelectedTurma] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [openSelectKey, setOpenSelectKey] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(1)

  const formatShortDate = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return '-'

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}`

    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/\d{4}$/)
    if (brMatch) return `${brMatch[1]}/${brMatch[2]}`

    return raw
  }

  const formatPeriod = (child) => {
    if (child.periodStart || child.periodEnd) {
      return `${formatShortDate(child.periodStart)} ate ${formatShortDate(child.periodEnd)}`
    }
    return child.periodDone || '-'
  }

  const loadData = useCallback(async () => {
    if (!canAccess) return
    setIsLoading(true)
    try {
      const [schoolsResponse, childrenResponse] = await Promise.all([
        api.get('/schools'),
        api.get('/children')
      ])
      setSchoolData(schoolsResponse || {})
      setChildren(childrenResponse || [])
    } catch (err) {
      setFormError(err.message || 'Erro ao carregar crianças.')
    } finally {
      setIsLoading(false)
    }
  }, [canAccess])

  useEffect(() => { loadData() }, [loadData])

  const schoolOptions = useMemo(() => Object.keys(schoolData).sort((a, b) => a.localeCompare(b)), [schoolData])

  const turmaOptions = useMemo(() => {
    const devices = schoolData[selectedSchool] || {}
    const turmas = Array.from(new Set(
      Object.values(devices)
        .flatMap((turmas) => Array.isArray(turmas) ? turmas : [])
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b))
    return selectedSchool ? [ALL_TURMAS_OPTION, ...turmas] : turmas
  }, [schoolData, selectedSchool])

  useEffect(() => {
    if (!selectedSchool) {
      setSelectedTurma('')
      return
    }
    if (selectedTurma && !turmaOptions.includes(selectedTurma)) {
      setSelectedTurma('')
    }
  }, [selectedSchool, selectedTurma, turmaOptions])

  useEffect(() => { setPage(1) }, [selectedSchool, selectedTurma, searchQuery])

  const filteredChildren = useMemo(() => {
    if (!selectedSchool || !selectedTurma) return []
    const q = searchQuery.trim().toLowerCase()

    return children
      .filter((child) => (
        child.school === selectedSchool
        && (selectedTurma === ALL_TURMAS_OPTION || child.turma === selectedTurma)
      ))
      .filter((child) => {
        if (!q) return true
        return (
          String(child.name || '').toLowerCase().includes(q) ||
          String(child.userName || child.responsible || child.createdBy || '').toLowerCase().includes(q) ||
          String(child.analysisRequired || '').toLowerCase().includes(q) ||
          String(child.periodStart || '').toLowerCase().includes(q) ||
          String(child.periodEnd || '').toLowerCase().includes(q) ||
          String(child.periodDone || '').toLowerCase().includes(q) ||
          String(child.completedStatus || '').toLowerCase().includes(q) ||
          String(child.observations || '').toLowerCase().includes(q)
        )
      })
  }, [children, searchQuery, selectedSchool, selectedTurma])

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filteredChildren.length / pageSize))
  const visibleChildren = filteredChildren.slice((page - 1) * pageSize, page * pageSize)
  const rangeStart = filteredChildren.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, filteredChildren.length)
  const canCreateChild = Boolean(selectedSchool) && Boolean(selectedTurma) && selectedTurma !== ALL_TURMAS_OPTION

  const openCreateForm = () => {
    if (!canCreateChild) {
      setFormError('Para cadastrar nova criança, selecione uma turma específica.')
      return
    }
    setEditTarget(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (child) => {
    setSelectedSchool(child.school || '')
    setSelectedTurma(child.turma || '')
    setEditTarget(child)
    setForm({
      name: child.name || '',
      analysisRequired: child.analysisRequired || '',
      periodStart: child.periodStart || '',
      periodEnd: child.periodEnd || '',
      completedStatus: child.completedStatus || '',
      observations: child.observations || ''
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!selectedSchool || !selectedTurma) return setFormError('Selecione uma escola e uma turma antes de salvar.')
    if (selectedTurma === ALL_TURMAS_OPTION) return setFormError('Para cadastrar, selecione uma turma específica.')
    if (!form.name.trim()) return setFormError('Nome da criança é obrigatório.')

    setIsSaving(true)
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        observations: form.observations.trim(),
        userName: loggedUserName,
        school: selectedSchool,
        turma: selectedTurma
      }

      if (editTarget) {
        const updated = await api.put(`/children/${editTarget.id}`, payload)
        setChildren((prev) => prev.map((child) => child.id === updated.id ? updated : child))
      } else {
        const created = await api.post('/children', payload)
        setChildren((prev) => [created, ...prev])
      }
      closeForm()
    } catch (err) {
      setFormError(err.message || 'Erro ao salvar criança.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!canAccess) {
    return (
      <div className="ch-access-denied">
        <ShieldAlert size={34} />
        <h2>Acesso restrito</h2>
        <p>Apenas admin, psicóloga e pedagoga podem acessar a tela de crianças.</p>
      </div>
    )
  }

  return (
    <div className="ch-container">
      <div className="ch-page-header">
        <div className="ch-header-icon"><Users size={22} /></div>
        <div className="ch-title-wrap">
          <h1>Crianças</h1>
          <p>Gerencie as crianças cadastradas nas escolas</p>
        </div>
        <button className="ch-primary-btn" onClick={openCreateForm} disabled={!canCreateChild} title={!canCreateChild ? 'Selecione uma turma específica para cadastrar' : 'Nova criança'}>
          <Plus size={15} /> Nova criança
        </button>
      </div>

      <div className={`ch-workspace ${showForm ? 'ch-workspace-with-form' : ''}`}>
        <section className="ch-main-panel">
          <div className="ch-filters">
            <div className="ch-filter-group">
              <label>Escola</label>
              <PrettySelect
                value={selectedSchool}
                options={schoolOptions}
                placeholder={isLoading ? 'Carregando escolas...' : 'Selecione uma escola'}
                selectKey="school"
                openSelectKey={openSelectKey}
                setOpenSelectKey={setOpenSelectKey}
                onChange={(value) => {
                  setSelectedSchool(value)
                  setSelectedTurma('')
                }}
                disabled={isLoading || schoolOptions.length === 0}
              />
            </div>

            <ArrowRight size={20} className="ch-filter-arrow" />

            <div className="ch-filter-group">
              <label>Turma</label>
              <PrettySelect
                value={selectedTurma}
                options={turmaOptions}
                placeholder={selectedSchool ? 'Selecione uma turma ou todas' : 'Selecione a escola primeiro'}
                selectKey="turma"
                openSelectKey={openSelectKey}
                setOpenSelectKey={setOpenSelectKey}
                onChange={setSelectedTurma}
                disabled={!selectedSchool || turmaOptions.length === 0}
              />
            </div>

            <div className="ch-search-wrap">
              <Search size={15} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar criança..."
              />
            </div>
          </div>

          <div className="ch-content-card">
            {isLoading ? (
              <div className="ch-empty-state">
                <Loader2 size={30} className="ch-spin" />
                <p>Carregando crianças...</p>
              </div>
            ) : !selectedSchool ? (
              <div className="ch-empty-state">
                <Users size={44} />
                <p>Selecione uma escola para visualizar as turmas e crianças.</p>
              </div>
            ) : !selectedTurma ? (
              <div className="ch-empty-state">
                <BookOpen size={44} />
                <p>Selecione uma turma para visualizar as crianças cadastradas.</p>
              </div>
            ) : visibleChildren.length === 0 ? (
              <div className="ch-empty-state">
                <UserRound size={44} />
                <p>{selectedTurma === ALL_TURMAS_OPTION ? 'Nenhuma criança encontrada para este colégio.' : 'Nenhuma criança encontrada para esta turma.'}</p>
              </div>
            ) : (
              <>
                <div className="ch-table-wrap">
                  <table className="ch-table">
                    <thead>
                      <tr>
                        <th>Criança</th>
                        <th>Turma</th>
                        <th>Usuário</th>
                        <th>Requer análise individualizada</th>
                        <th>Período realizado</th>
                        <th>Concluído</th>
                        <th>Observações</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleChildren.map((child, index) => (
                        <tr
                          key={child.id}
                          className="ch-clickable-row"
                          style={{ '--ch-row-index': index }}
                          onClick={() => setViewTarget(child)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setViewTarget(child)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          <td>
                            <div className="ch-child-cell">
                              <span className="ch-avatar"><UserRound size={14} /></span>
                              <strong>{child.name}</strong>
                            </div>
                          </td>
                          <td>{child.turma}</td>
                          <td>{child.userName || child.responsible || child.createdBy || '-'}</td>
                          <td><span className={`ch-status-pill ${child.analysisRequired === 'SIM' ? 'ch-pill-ok' : child.analysisRequired === 'NÃO' ? 'ch-pill-danger' : 'ch-pill-muted'}`}>{child.analysisRequired || '-'}</span></td>
                          <td>{formatPeriod(child)}</td>
                          <td><span className={`ch-status-pill ${child.completedStatus === 'SIM' ? 'ch-pill-ok' : child.completedStatus === 'X' || child.completedStatus === 'NÃO' ? 'ch-pill-danger' : 'ch-pill-muted'}`}>{child.completedStatus || '-'}</span></td>
                          <td className="ch-observation-cell">{child.observations || '-'}</td>
                          <td>
                            <div className="ch-actions">
                              <button
                                className="ch-action-btn ch-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openEditForm(child)
                                }}
                                title="Editar criança"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ch-table-footer">
                  <span>Mostrando {rangeStart} a {rangeEnd} de {filteredChildren.length} criança{filteredChildren.length !== 1 ? 's' : ''}</span>
                  <div className="ch-pagination">
                    <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}><ArrowLeft size={14} /></button>
                    <span>{page}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}><ArrowRight size={14} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {showForm && (
          <aside className="ch-form-panel">
            <div className="ch-form-head">
              <div>
                <h2>{editTarget ? 'Editar criança' : 'Nova criança'}</h2>
                <p>{selectedSchool && selectedTurma ? `${selectedSchool} - ${selectedTurma}` : 'Selecione escola e turma'}</p>
              </div>
              <button className="ch-form-close" onClick={closeForm}><X size={15} /></button>
            </div>

            <form className="ch-form" onSubmit={handleSubmit}>
              {formError && <div className="ch-error"><AlertCircle size={14} /> {formError}</div>}

              <label>
                Nome da criança
                <input
                  value={form.name}
                  readOnly={Boolean(editTarget)}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className={editTarget ? 'ch-readonly-input' : ''}
                  title={editTarget ? 'Nome bloqueado após criação' : ''}
                  placeholder="Digite o nome da criança"
                />
              </label>

              <label>
                Usuário
                <input value={loggedUserName} readOnly className="ch-readonly-input" title="Campo bloqueado" />
              </label>

              <label>
                Requer análise individualizada
                <PrettySelect
                  value={form.analysisRequired}
                  options={analysisOptions}
                  placeholder="Selecione uma opção"
                  selectKey="analysisRequired"
                  openSelectKey={openSelectKey}
                  setOpenSelectKey={setOpenSelectKey}
                  onChange={(value) => setForm((prev) => ({ ...prev, analysisRequired: value }))}
                />
              </label>

              <label>
                Período realizado
                <div className="ch-period-grid">
                  <input
                    type="text"
                    value={form.periodStart}
                    inputMode="numeric"
                    maxLength={5}
                    onChange={(event) => setForm((prev) => ({ ...prev, periodStart: formatDayMonthInput(event.target.value) }))}
                    placeholder="dd/mm"
                    aria-label="Data inicial"
                  />
                  <input
                    type="text"
                    value={form.periodEnd}
                    inputMode="numeric"
                    maxLength={5}
                    onChange={(event) => setForm((prev) => ({ ...prev, periodEnd: formatDayMonthInput(event.target.value) }))}
                    placeholder="dd/mm"
                    aria-label="Data de término"
                  />
                </div>
              </label>

              <label>
                Concluído
                <PrettySelect
                  value={form.completedStatus}
                  options={completedOptions}
                  placeholder="Selecione uma opção"
                  selectKey="completedStatus"
                  openSelectKey={openSelectKey}
                  setOpenSelectKey={setOpenSelectKey}
                  onChange={(value) => setForm((prev) => ({ ...prev, completedStatus: value }))}
                />
              </label>

              <label>
                Observações
                <textarea
                  value={form.observations}
                  onChange={(event) => setForm((prev) => ({ ...prev, observations: event.target.value }))}
                  placeholder="Digite observações..."
                  rows={5}
                />
              </label>

              <div className="ch-form-actions">
                <button type="button" className="ch-secondary-btn" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="ch-save-btn" disabled={isSaving}>
                  {isSaving ? <><Loader2 size={14} className="ch-spin" /> Salvando...</> : 'Salvar'}
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {viewTarget && (
        <div className="ch-modal-overlay ch-detail-overlay" onClick={() => setViewTarget(null)}>
          <div className="ch-detail-card" onClick={(event) => event.stopPropagation()}>
            <div className="ch-detail-head">
              <div className="ch-detail-title-row">
                <div className="ch-detail-icon"><UserRound size={18} /></div>
                <div>
                  <h3>{viewTarget.name}</h3>
                  <p>{viewTarget.school} - {viewTarget.turma}</p>
                </div>
              </div>
              <button className="ch-form-close" onClick={() => setViewTarget(null)}><X size={15} /></button>
            </div>

            <div className="ch-detail-body">
              <div className="ch-detail-grid">
                <div className="ch-detail-item">
                  <span>Usuário</span>
                  <strong>{viewTarget.userName || viewTarget.responsible || viewTarget.createdBy || '-'}</strong>
                </div>
                <div className="ch-detail-item">
                  <span>Requer análise individualizada</span>
                  <strong>{viewTarget.analysisRequired || '-'}</strong>
                </div>
                <div className="ch-detail-item">
                  <span>Período realizado</span>
                  <strong>{formatPeriod(viewTarget)}</strong>
                </div>
                <div className="ch-detail-item">
                  <span>Concluído</span>
                  <strong>{viewTarget.completedStatus || '-'}</strong>
                </div>
              </div>

              <div className="ch-detail-observations">
                <span>Observações</span>
                <p>{viewTarget.observations || 'Nenhuma observação registrada.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
