import { useState, useEffect, useMemo } from 'react'
import { Kanban as KanbanIcon, Trash2, Calendar, Search, Filter, Loader2, AlertCircle, X, Check, Archive, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './ResolvedKanban.css'

export default function ResolvedKanban() {
  const { user } = useAuthStore()
  const role = (user?.role || '').toLowerCase()
  const canEdit = role === 'pedagoga' || role === 'psicóloga' || user?.canDragDrop === true

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterResp, setFilterResp] = useState('')
  const [timelineMonth, setTimelineMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Dropdown states
  const [isMonthOpen, setIsMonthOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isRespOpen, setIsRespOpen] = useState(false)

  // Modals state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsMonthOpen(false)
      setIsPriorityOpen(false)
      setIsRespOpen(false)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const data = await api.get('/kanban')
      setTasks(data || [])
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreTask = async () => {
    if (!restoreTarget) return
    setIsSaving(true)
    try {
      await api.put(`/kanban/${restoreTarget.id}`, { 
        isArchived: false, 
        archivedAt: null 
      })
      setTasks(prev => prev.map(t => t.id === restoreTarget.id ? { ...t, isArchived: false, archivedAt: null } : t))
      setShowRestoreModal(false)
      setShowDetailModal(false)
      setRestoreTarget(null)
      setViewTarget(null)
    } catch (err) {
      alert(`Erro ao restaurar tarefa: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!deleteTarget) return
    setIsSaving(true)
    try {
      await api.delete(`/kanban/${deleteTarget.id}`)
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id))
      setShowDeleteModal(false)
      setShowDetailModal(false)
      setDeleteTarget(null)
      setViewTarget(null)
    } catch (err) {
      alert(`Erro ao excluir tarefa permanentemente: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const monthOptions = useMemo(() => {
    const list = []
    const date = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1)
      const year = d.getFullYear()
      const monthNum = String(d.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${monthNum}`
      
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
      
      list.push({ value, label: capitalizedLabel })
    }
    return list
  }, [])

  const selectedMonthLabel = useMemo(() => {
    const found = monthOptions.find(o => o.value === timelineMonth)
    return found ? found.label : 'Selecionar Mês'
  }, [timelineMonth, monthOptions])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    const date = new Date(+y, +m - 1, +d)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const formatDateTime = (isoStr) => {
    if (!isoStr) return ''
    const date = new Date(isoStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getPriorityLabel = (p) => {
    if (p === 'high') return 'Alta'
    if (p === 'medium') return 'Média'
    return 'Baixa'
  }

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    if (!t.isArchived) return false

    // Filter by Month (matches archivedAt date)
    if (timelineMonth && t.archivedAt) {
      if (!t.archivedAt.startsWith(timelineMonth)) return false
    }

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.responsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = !filterPriority || t.priority === filterPriority
    const matchesResp = !filterResp || t.responsible.toLowerCase() === filterResp.toLowerCase()

    return matchesSearch && matchesPriority && matchesResp
  })

  // Group stats only for selected month's archived tasks
  const stats = useMemo(() => {
    const monthTasks = tasks.filter(t => t.isArchived && t.archivedAt && t.archivedAt.startsWith(timelineMonth))
    return {
      total: monthTasks.length,
      pedagoga: monthTasks.filter(t => t.responsible === 'Pedagoga').length,
      psicologa: monthTasks.filter(t => t.responsible === 'Psicóloga').length,
      highPriority: monthTasks.filter(t => t.priority === 'high').length
    }
  }, [tasks, timelineMonth])

  const columns = [
    { id: 'todo', label: 'A Fazer', color: '#a78bfa' },
    { id: 'inprogress', label: 'Em Andamento', color: '#38bdf8' },
    { id: 'inrevision', label: 'Em Revisão', color: '#fbbf24' },
    { id: 'completed', label: 'Concluído', color: '#10b981' }
  ]

  return (
    <div className="rk-container">
      {/* Header */}
      <div className="rk-page-header">
        <div className="rk-header-left">
          <div className="rk-header-icon"><Archive size={24} /></div>
          <div>
            <h1 className="rk-page-title">Kanban Resolvido</h1>
            <p className="rk-page-sub">Histórico de tarefas concluídas e arquivadas</p>
          </div>
        </div>
        <div className="rk-header-right">
          <div className="rk-search-box">
            <Search size={14} />
            <input
              placeholder="Buscar histórico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Top statistics */}
      <div className="rk-stats-grid">
        <div className="rk-stat-card">
          <div className="rk-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Archive size={16} /></div>
          <div className="rk-stat-info">
            <span className="rk-stat-label">Arquivadas no Mês</span>
            <span className="rk-stat-val">{stats.total}</span>
          </div>
        </div>
        <div className="rk-stat-card">
          <div className="rk-stat-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}><Check size={16} /></div>
          <div className="rk-stat-info">
            <span className="rk-stat-label">Pedagoga</span>
            <span className="rk-stat-val">{stats.pedagoga}</span>
          </div>
        </div>
        <div className="rk-stat-card">
          <div className="rk-stat-icon" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}><Check size={16} /></div>
          <div className="rk-stat-info">
            <span className="rk-stat-label">Psicóloga</span>
            <span className="rk-stat-val">{stats.psicologa}</span>
          </div>
        </div>
        <div className="rk-stat-card">
          <div className="rk-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><AlertCircle size={16} /></div>
          <div className="rk-stat-info">
            <span className="rk-stat-label">Alta Prioridade</span>
            <span className="rk-stat-val text-red-400">{stats.highPriority}</span>
          </div>
        </div>
      </div>

      {/* Premium Filters Bar */}
      <div className="rk-filters-bar">
        <div className="rk-filters-left">
          <div className="rk-filters-icon-label">
            <Filter size={14} />
            <span>Filtros:</span>
          </div>

          {/* Month Selector */}
          <div className="rk-custom-select-container" onClick={e => e.stopPropagation()}>
            <button
              className={`rk-filter-btn ${timelineMonth ? 'active' : ''}`}
              onClick={() => {
                setIsMonthOpen(!isMonthOpen)
                setIsPriorityOpen(false)
                setIsRespOpen(false)
              }}
            >
              <Calendar size={14} />
              <span>{selectedMonthLabel}</span>
              <ChevronDown size={14} className={`rk-select-chevron ${isMonthOpen ? 'open' : ''}`} />
            </button>
            {isMonthOpen && (
              <div className="rk-custom-dropdown">
                {monthOptions.map(opt => (
                  <div
                    key={opt.value}
                    className={`rk-dropdown-option ${timelineMonth === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setTimelineMonth(opt.value)
                      setIsMonthOpen(false)
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional Selector */}
          <div className="rk-custom-select-container" onClick={e => e.stopPropagation()}>
            <button
              className={`rk-filter-btn ${filterResp ? 'active' : ''}`}
              onClick={() => {
                setIsRespOpen(!isRespOpen)
                setIsMonthOpen(false)
                setIsPriorityOpen(false)
              }}
            >
              <span className="rk-option-dot" style={{ background: filterResp === 'Psicóloga' ? '#10b981' : filterResp === 'Pedagoga' ? '#a78bfa' : '#6b7280' }} />
              <span>{filterResp || 'Todos os Profissionais'}</span>
              <ChevronDown size={14} className={`rk-select-chevron ${isRespOpen ? 'open' : ''}`} />
            </button>
            {isRespOpen && (
              <div className="rk-custom-dropdown">
                <div
                  className={`rk-dropdown-option ${!filterResp ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterResp('')
                    setIsRespOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#6b7280' }} />
                  Todos os Profissionais
                </div>
                <div
                  className={`rk-dropdown-option ${filterResp === 'Pedagoga' ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterResp('Pedagoga')
                    setIsRespOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#a78bfa' }} />
                  Pedagoga
                </div>
                <div
                  className={`rk-dropdown-option ${filterResp === 'Psicóloga' ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterResp('Psicóloga')
                    setIsRespOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#10b981' }} />
                  Psicóloga
                </div>
              </div>
            )}
          </div>

          {/* Priority Selector */}
          <div className="rk-custom-select-container" onClick={e => e.stopPropagation()}>
            <button
              className={`rk-filter-btn ${filterPriority ? 'active' : ''}`}
              onClick={() => {
                setIsPriorityOpen(!isPriorityOpen)
                setIsMonthOpen(false)
                setIsRespOpen(false)
              }}
            >
              <span className="rk-option-dot" style={{ background: filterPriority === 'high' ? '#ef4444' : filterPriority === 'medium' ? '#3b82f6' : filterPriority === 'low' ? '#10b981' : '#6b7280' }} />
              <span>{filterPriority ? `Prioridade: ${getPriorityLabel(filterPriority)}` : 'Todas as Prioridades'}</span>
              <ChevronDown size={14} className={`rk-select-chevron ${isPriorityOpen ? 'open' : ''}`} />
            </button>
            {isPriorityOpen && (
              <div className="rk-custom-dropdown">
                <div
                  className={`rk-dropdown-option ${!filterPriority ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterPriority('')
                    setIsPriorityOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#6b7280' }} />
                  Todas as Prioridades
                </div>
                <div
                  className={`rk-dropdown-option ${filterPriority === 'high' ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterPriority('high')
                    setIsPriorityOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#ef4444' }} />
                  Alta
                </div>
                <div
                  className={`rk-dropdown-option ${filterPriority === 'medium' ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterPriority('medium')
                    setIsPriorityOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#3b82f6' }} />
                  Média
                </div>
                <div
                  className={`rk-dropdown-option ${filterPriority === 'low' ? 'selected' : ''}`}
                  onClick={() => {
                    setFilterPriority('low')
                    setIsPriorityOpen(false)
                  }}
                >
                  <span className="rk-option-dot" style={{ background: '#10b981' }} />
                  Baixa
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Board Layout (Read-Only) */}
      {isLoading ? (
        <div className="rk-board-loading">
          <Loader2 className="rk-spinner" size={32} />
          <span>Carregando histórico...</span>
        </div>
      ) : (
        <div className="rk-board">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id)

            return (
              <div key={col.id} className="rk-column">
                <div className="rk-col-header">
                  <div className="rk-col-title-wrap">
                    <span className="rk-col-dot" style={{ background: col.color }} />
                    <span className="rk-col-title">{col.label}</span>
                  </div>
                  <span className="rk-col-count">{colTasks.length}</span>
                </div>

                <div className="rk-col-body">
                  {colTasks.length === 0 ? (
                    <div className="rk-column-empty">
                      <div className="rk-column-empty-icon"><Archive size={16} /></div>
                      <span className="rk-column-empty-text">Sem arquivadas</span>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const initial = task.responsible ? task.responsible.charAt(0).toUpperCase() : 'P'

                      return (
                        <div
                          key={task.id}
                          className={`rk-card rk-card-priority-${task.priority}`}
                          onClick={() => { setViewTarget(task); setShowDetailModal(true) }}
                        >
                          <div className="rk-card-header">
                            <h4 className="rk-card-title">{task.title}</h4>
                          </div>

                          {task.description && (
                            <p className="rk-card-desc">{task.description}</p>
                          )}

                          {task.tags && task.tags.length > 0 && (
                            <div className="rk-card-tags">
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className="rk-card-tag">{tag}</span>
                              ))}
                            </div>
                          )}

                          <div className="rk-card-archive-date">
                            <Archive size={10} />
                            <span>Arquivado em {formatDateTime(task.archivedAt)}</span>
                          </div>

                          <div className="rk-card-footer">
                            <div className="rk-card-meta-left">
                              <span className={`rk-card-priority-badge prio-${task.priority}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                            </div>

                            <div className="rk-card-meta-right">
                              {task.date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem' }}>
                                  <Calendar size={10} /> {formatDate(task.date)}
                                </span>
                              )}
                              <span
                                className="rk-card-resp-badge"
                                style={{
                                  background: task.responsible === 'Psicóloga' ? '#10b981' : '#a78bfa'
                                }}
                                title={task.responsible}
                              >
                                {initial}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && viewTarget && (
        <div className="rk-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="rk-modal-card" onClick={e => e.stopPropagation()}>
            <div className="rk-modal-accent" style={{ background: '#10b981' }} />
            <div className="rk-modal-head">
              <div className="rk-modal-head-left">
                <div className="rk-modal-head-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <Archive size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f3f4f6' }}>#{viewTarget.id}</h3>
                  <p className="rk-modal-head-sub">Criado por {viewTarget.author}</p>
                </div>
              </div>
              <button className="rk-modal-close" onClick={() => setShowDetailModal(false)}><X size={16} /></button>
            </div>

            <div className="rk-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Título</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>{viewTarget.title}</h2>
              </div>

              {viewTarget.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Descrição</span>
                  <p style={{ fontSize: '0.875rem', color: '#d1d5db', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{viewTarget.description}</p>
                </div>
              )}

              {viewTarget.tags && viewTarget.tags.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Etiquetas (Tags)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewTarget.tags.map((tag, idx) => (
                      <span key={idx} className="rk-card-tag" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rk-detail-info-grid">
                <div className="rk-detail-info-item">
                  <span className="rk-detail-label">Responsável</span>
                  <span className="rk-detail-val">{viewTarget.responsible}</span>
                </div>
                <div className="rk-detail-info-item">
                  <span className="rk-detail-label">Prioridade</span>
                  <span className={`rk-detail-val prio-${viewTarget.priority}`} style={{ fontWeight: 700 }}>
                    {getPriorityLabel(viewTarget.priority)}
                  </span>
                </div>
                <div className="rk-detail-info-item">
                  <span className="rk-detail-label">Status ao Arquivar</span>
                  <span className="rk-detail-val" style={{ textTransform: 'capitalize' }}>
                    {viewTarget.status === 'todo' ? 'A Fazer' : viewTarget.status === 'inprogress' ? 'Em Andamento' : viewTarget.status === 'inrevision' ? 'Em Revisão' : 'Concluído'}
                  </span>
                </div>
                <div className="rk-detail-info-item">
                  <span className="rk-detail-label">Arquivado Em</span>
                  <span className="rk-detail-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {viewTarget.archivedAt ? formatDateTime(viewTarget.archivedAt) : ''}
                  </span>
                </div>
              </div>

              {canEdit && (
                <div className="rk-modal-actions">
                  <button 
                    className="rk-btn-cancel" 
                    style={{ border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }} 
                    onClick={() => { setRestoreTarget(viewTarget); setShowRestoreModal(true) }}
                  >
                    <RotateCcw size={14} /> Desarquivar
                  </button>
                  <button className="rk-btn-danger" onClick={() => { setDeleteTarget(viewTarget); setShowDeleteModal(true) }}>
                    <Trash2 size={14} /> Excluir Permanentemente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && restoreTarget && (
        <div className="rk-modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="rk-modal-card rk-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="rk-modal-accent" style={{ background: '#a78bfa' }} />
            <div className="rk-modal-head">
              <div className="rk-modal-head-left">
                <div className="rk-modal-head-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>Confirmar Desarquivamento</h3>
                </div>
              </div>
              <button className="rk-modal-close" onClick={() => setShowRestoreModal(false)}><X size={16} /></button>
            </div>
            <div className="rk-modal-body" style={{ gap: 18 }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                Tem certeza que deseja restaurar a tarefa <strong>"{restoreTarget.title}"</strong> de volta ao Kanban ativo?
              </p>
              <div className="rk-modal-actions" style={{ marginTop: 6 }}>
                <button className="rk-btn-cancel" onClick={() => setShowRestoreModal(false)}>Cancelar</button>
                <button 
                  className="rk-btn-danger" 
                  style={{ background: '#a78bfa', color: 'white' }} 
                  onClick={handleRestoreTask} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Restaurando...' : 'Sim, Restaurar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="rk-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="rk-modal-card rk-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="rk-modal-accent rk-accent-red" />
            <div className="rk-modal-head">
              <div className="rk-modal-head-left">
                <div className="rk-modal-head-icon rk-icon-red">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>Confirmar Exclusão</h3>
                </div>
              </div>
              <button className="rk-modal-close" onClick={() => setShowDeleteModal(false)}><X size={16} /></button>
            </div>
            <div className="rk-modal-body" style={{ gap: 18 }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                Tem certeza que deseja excluir permanentemente a tarefa <strong>"{deleteTarget.title}"</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="rk-modal-actions" style={{ marginTop: 6 }}>
                <button className="rk-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                <button className="rk-btn-danger" onClick={handleDeleteTask} disabled={isSaving}>
                  {isSaving ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
