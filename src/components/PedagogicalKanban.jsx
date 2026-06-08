import { useState, useEffect } from 'react'
import { Kanban as KanbanIcon, Plus, Trash2, Calendar, Clock, Bell, BookOpen, Brain, Search, Filter, Loader2, AlertCircle, ShieldCheck, X, Edit3, Check, ArrowRight, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown, Archive, History } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useKanbanStore } from '../stores/kanbanStore'
import './PedagogicalKanban.css'

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const getTodayIsoLocal = () => {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().split('T')[0]
}

const normalizeDateForInput = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (isoDateRegex.test(raw)) return raw

  const ddMmMatch = raw.match(/^(\d{2})\/(\d{2})$/)
  if (ddMmMatch) {
    const currentYear = new Date().getFullYear()
    const [, day, month] = ddMmMatch
    return `${currentYear}-${month}-${day}`
  }

  return ''
}

export default function PedagogicalKanban() {
  const { user } = useAuthStore()
  const role = (user?.role || '').toLowerCase()
  const canEdit = role === 'pedagoga' || role === 'psicóloga' || user?.canDragDrop === true
  const currentUserName = (user?.name || '').trim() || 'Usuário'
  const currentUserEmail = String(user?.email || '').trim().toLowerCase()
  const minDueDate = getTodayIsoLocal()

  const isCreatedByCurrentUser = (item) => {
    if (!item) return false
    if (item.authorEmail) return String(item.authorEmail).trim().toLowerCase() === currentUserEmail
    return String(item.author || '').trim().toLowerCase() === currentUserName.toLowerCase()
  }

  const { tasks, isLoading, error, loadTasks, setTasks } = useKanbanStore()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterResp, setFilterResp] = useState('')
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isRespOpen, setIsRespOpen] = useState(false)
  const [isFormPriorityOpen, setIsFormPriorityOpen] = useState(false)
  const [isFormStatusOpen, setIsFormStatusOpen] = useState(false)

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    date: '',
    tags: '',
    responsible: currentUserName
  })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsPriorityOpen(false)
      setIsRespOpen(false)
      setIsFormPriorityOpen(false)
      setIsFormStatusOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const fetchTasks = loadTasks

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim()) {
      return setFormError('O título da tarefa é obrigatório.')
    }

    if (!form.date.trim()) {
      return setFormError('A data de prazo é obrigatória.')
    }

    const dueDate = form.date.trim()
    if (!isoDateRegex.test(dueDate)) {
      return setFormError('Data inválida. Use o calendário para selecionar o prazo.')
    }

    if (dueDate < minDueDate) {
      return setFormError('Não é permitido cadastrar prazo com data anterior a hoje.')
    }

    setIsSaving(true)
    try {
      const tagsArray = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const payload = {
        ...form,
        date: dueDate,
        tags: tagsArray
      }

      if (editTarget) {
        const updated = await api.put(`/kanban/${editTarget.id}`, payload)
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
        if (viewTarget && viewTarget.id === updated.id) {
          setViewTarget(updated)
        }
      } else {
        const created = await api.post('/kanban', payload)
        setTasks(prev => [created, ...prev])
      }

      setShowFormModal(false)
      setEditTarget(null)
      resetForm()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete Task
  const handleDeleteTask = async () => {
    if (!deleteTarget) return
    if (!isCreatedByCurrentUser(deleteTarget)) {
      alert('Apenas o criador pode excluir esta tarefa.')
      return
    }
    setIsSaving(true)
    try {
      await api.delete(`/kanban/${deleteTarget.id}`)
      setTasks(prev => prev.filter(t => t.id !== deleteTarget.id))
      setShowDeleteModal(false)
      setShowDetailModal(false)
      setDeleteTarget(null)
      setViewTarget(null)
    } catch (err) {
      alert(`Erro ao excluir tarefa: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Archive Task
  const handleArchiveTask = async () => {
    if (!archiveTarget) return
    setIsSaving(true)
    try {
      const archivedAt = new Date().toISOString()
      await api.put(`/kanban/${archiveTarget.id}`, { 
        isArchived: true, 
        archivedAt 
      })
      setTasks(prev => prev.map(t => t.id === archiveTarget.id ? { ...t, isArchived: true, archivedAt } : t))
      setShowArchiveModal(false)
      setShowDetailModal(false)
      setArchiveTarget(null)
      setViewTarget(null)
    } catch (err) {
      alert(`Erro ao arquivar tarefa: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Drag & Drop
  const handleDragStart = (e, taskId) => {
    if (!canEdit) return e.preventDefault()
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e, colStatus) => {
    if (!canEdit) return
    e.preventDefault()
    setDragOverColumn(colStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e, targetStatus) => {
    if (!canEdit) return
    e.preventDefault()
    setDragOverColumn(null)

    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain')
    if (!taskId) return

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === targetStatus) return

    // Optimistic UI update
    const previousTasks = [...tasks]
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t))

    try {
      const updated = await api.put(`/kanban/${taskId}`, { status: targetStatus })
      // Sync full response (includes history) back into local state
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch (err) {
      // Revert if API fails
      setTasks(previousTasks)
      alert(`Falha ao mover tarefa: ${err.message}`)
    } finally {
      setDraggedTaskId(null)
    }
  }

  // Move via buttons (for accessibility & non-drag interactions)
  const handleMoveTaskStatus = async (task, direction) => {
    if (!canEdit) return
    const statuses = ['todo', 'inprogress', 'inrevision', 'completed']
    const currentIndex = statuses.indexOf(task.status)
    const nextIndex = currentIndex + direction

    if (nextIndex >= 0 && nextIndex < statuses.length) {
      const nextStatus = statuses[nextIndex]
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
      try {
        const updated = await api.put(`/kanban/${task.id}`, { status: nextStatus })
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      } catch (err) {
        fetchTasks()
        alert(`Erro ao atualizar status: ${err.message}`)
      }
    }
  }

  const handleEditClick = (task) => {
    setEditTarget(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      date: normalizeDateForInput(task.date),
      tags: (task.tags || []).join(', '),
      responsible: task.responsible || currentUserName
    })
    setShowFormModal(true)
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      date: '',
      tags: '',
      responsible: currentUserName
    })
    setFormError('')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    const date = new Date(+y, +m - 1, +d)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getPriorityLabel = (p) => {
    if (p === 'high') return 'Alta'
    if (p === 'medium') return 'Média'
    return 'Baixa'
  }

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    if (t.isArchived) return false

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.responsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = !filterPriority || t.priority === filterPriority
    const matchesResp = !filterResp || t.responsible.toLowerCase() === filterResp.toLowerCase()

    return matchesSearch && matchesPriority && matchesResp
  })

  // Dynamic Statistics
  const openTasksCount = tasks.filter(t => !t.isArchived && ['todo', 'inprogress', 'inrevision'].includes(t.status)).length
  const highPriorityCount = tasks.filter(t => !t.isArchived && t.priority === 'high' && t.status !== 'completed').length
  const completedTasksCount = tasks.filter(t => !t.isArchived && t.status === 'completed').length

  const columns = [
    { id: 'todo', label: 'A Fazer', color: '#a78bfa' },
    { id: 'inprogress', label: 'Em Andamento', color: '#38bdf8' },
    { id: 'inrevision', label: 'Em Revisão', color: '#fbbf24' },
    { id: 'completed', label: 'Concluído', color: '#10b981' }
  ]

  return (
    <div className="pk-container">
      {/* Header */}
      <div className="pk-page-header">
        <div className="pk-header-left">
          <div className="pk-header-icon"><KanbanIcon size={24} /></div>
          <div>
            <h1 className="pk-page-title">Kanban</h1>
            <p className="pk-page-sub">Acompanhe tarefas, projetos pedagógicos e psicológicos</p>
          </div>
        </div>
        <div className="pk-header-right">
          <div className="pk-search-box">
            <Search size={14} />
            <input
              placeholder="Buscar tarefas, tags, responsáveis..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {canEdit ? (
            <button className="pk-new-btn" onClick={() => { setEditTarget(null); resetForm(); setShowFormModal(true) }}>
              <Plus size={16} /> Nova Tarefa
            </button>
          ) : (
            <span className="pk-badge-view"><AlertCircle size={14} /> Somente Leitura</span>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="pk-stats-grid">
        <div className="pk-stat-card">
          <div className="pk-stat-card-left">
            <div className="pk-stat-icon" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)' }}><Clock size={20} /></div>
            <div>
              <p className="pk-stat-num">{openTasksCount}</p>
              <p className="pk-stat-label">Em aberto</p>
            </div>
          </div>
          <svg className="pk-sparkline-svg" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="pk-sparkline-blue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pk-sparkline-blue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 30 Q 20 15 40 25 T 80 10 T 100 20 L 100 40 L 0 40 Z" fill="url(#pk-sparkline-blue-fill)" className="pk-sparkline-fill" />
            <path d="M 0 30 Q 20 15 40 25 T 80 10 T 100 20" stroke="url(#pk-sparkline-blue)" className="pk-sparkline-path" />
            <circle cx="100" cy="20" r="3" fill="#38bdf8" className="pk-sparkline-circle" style={{ color: '#38bdf8' }} />
          </svg>
        </div>
        <div className="pk-stat-card">
          <div className="pk-stat-card-left">
            <div className="pk-stat-icon" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}><AlertTriangle size={20} /></div>
            <div>
              <p className="pk-stat-num">{highPriorityCount}</p>
              <p className="pk-stat-label">Alta prioridade</p>
            </div>
          </div>
          <svg className="pk-sparkline-svg" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="pk-sparkline-red" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pk-sparkline-red-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 35 Q 30 10 50 28 T 100 5 L 100 40 L 0 40 Z" fill="url(#pk-sparkline-red-fill)" className="pk-sparkline-fill" />
            <path d="M 0 35 Q 30 10 50 28 T 100 5" stroke="url(#pk-sparkline-red)" className="pk-sparkline-path" />
            <circle cx="100" cy="5" r="3" fill="#f87171" className="pk-sparkline-circle" style={{ color: '#f87171' }} />
          </svg>
        </div>
        <div className="pk-stat-card">
          <div className="pk-stat-card-left">
            <div className="pk-stat-icon" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}><Check size={20} /></div>
            <div>
              <p className="pk-stat-num">{completedTasksCount}</p>
              <p className="pk-stat-label">Concluídas</p>
            </div>
          </div>
          <svg className="pk-sparkline-svg" viewBox="0 0 100 40">
            <defs>
              <linearGradient id="pk-sparkline-green" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="pk-sparkline-green-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 38 Q 20 30 50 15 T 80 18 T 100 2 L 100 40 L 0 40 Z" fill="url(#pk-sparkline-green-fill)" className="pk-sparkline-fill" />
            <path d="M 0 38 Q 20 30 50 15 T 80 18 T 100 2" stroke="url(#pk-sparkline-green)" className="pk-sparkline-path" />
            <circle cx="100" cy="2" r="3" fill="#10b981" className="pk-sparkline-circle" style={{ color: '#10b981' }} />
          </svg>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="pk-filters-bar">
        {/* Custom Priority Dropdown */}
        <div className="pk-custom-select-container">
          <button 
            className={`pk-filter-btn ${filterPriority ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsPriorityOpen(!isPriorityOpen)
              setIsRespOpen(false)
            }}
          >
            <Filter size={14} />
            <span>
              {filterPriority === 'high' ? 'Alta prioridade' : 
               filterPriority === 'medium' ? 'Média prioridade' : 
               filterPriority === 'low' ? 'Baixa prioridade' : 'Todas as prioridades'}
            </span>
            <ChevronDown size={14} className={`pk-select-chevron ${isPriorityOpen ? 'open' : ''}`} />
          </button>
          
          {isPriorityOpen && (
            <div className="pk-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`pk-dropdown-option ${filterPriority === '' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority(''); setIsPriorityOpen(false) }}
              >
                Todas as prioridades
              </div>
              <div 
                className={`pk-dropdown-option ${filterPriority === 'high' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('high'); setIsPriorityOpen(false) }}
              >
                <span className="pk-option-dot" style={{ background: '#f87171' }} />
                Alta prioridade
              </div>
              <div 
                className={`pk-dropdown-option ${filterPriority === 'medium' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('medium'); setIsPriorityOpen(false) }}
              >
                <span className="pk-option-dot" style={{ background: '#a78bfa' }} />
                Média prioridade
              </div>
              <div 
                className={`pk-dropdown-option ${filterPriority === 'low' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('low'); setIsPriorityOpen(false) }}
              >
                <span className="pk-option-dot" style={{ background: '#38bdf8' }} />
                Baixa prioridade
              </div>
            </div>
          )}
        </div>

        {/* Custom Responsible Dropdown */}
        <div className="pk-custom-select-container">
          <button 
            className={`pk-filter-btn ${filterResp ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsRespOpen(!isRespOpen)
              setIsPriorityOpen(false)
            }}
          >
            <Brain size={14} />
            <span>
              {filterResp === 'Pedagoga' ? 'Pedagoga' : 
               filterResp === 'Psicóloga' ? 'Psicóloga' : 'Todos os responsáveis'}
            </span>
            <ChevronDown size={14} className={`pk-select-chevron ${isRespOpen ? 'open' : ''}`} />
          </button>
          
          {isRespOpen && (
            <div className="pk-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`pk-dropdown-option ${filterResp === '' ? 'selected' : ''}`}
                onClick={() => { setFilterResp(''); setIsRespOpen(false) }}
              >
                Todos os responsáveis
              </div>
              <div 
                className={`pk-dropdown-option ${filterResp === 'Pedagoga' ? 'selected' : ''}`}
                onClick={() => { setFilterResp('Pedagoga'); setIsRespOpen(false) }}
              >
                <span className="pk-option-dot" style={{ background: '#a78bfa' }} />
                Pedagoga
              </div>
              <div 
                className={`pk-dropdown-option ${filterResp === 'Psicóloga' ? 'selected' : ''}`}
                onClick={() => { setFilterResp('Psicóloga'); setIsRespOpen(false) }}
              >
                <span className="pk-option-dot" style={{ background: '#10b981' }} />
                Psicóloga
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="pk-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80, color: '#9ca3af' }}>
          <Loader2 size={32} className="pk-spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Carregando quadro...</p>
        </div>
      ) : error ? (
        <div className="pk-alert-error" style={{ margin: '20px 0' }}><AlertCircle size={16} /> {error}</div>
      ) : (
        /* Kanban Board Grid */
        <div className="pk-board">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id)
            const isTarget = dragOverColumn === col.id

            return (
              <div
                key={col.id}
                className={`pk-column ${isTarget ? 'drag-over' : ''}`}
                onDragOver={e => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className="pk-col-header">
                  <div className="pk-col-title-wrap">
                    <span className="pk-col-dot" style={{ background: col.color }} />
                    <span className="pk-col-title">{col.label}</span>
                  </div>
                  <span className="pk-col-count">{colTasks.length}</span>
                </div>

                <div className="pk-col-body">
                  {colTasks.length === 0 ? (
                    <div className="pk-column-empty">
                      <div className="pk-column-empty-icon"><KanbanIcon size={16} /></div>
                      <span className="pk-column-empty-text">Nenhuma tarefa</span>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      // Priority check
                      const isHigh = task.priority === 'high'

                      return (
                        <div
                          key={task.id}
                          className={`pk-card pk-card-priority-${task.priority}`}
                          draggable={canEdit}
                          onDragStart={e => handleDragStart(e, task.id)}
                          onClick={() => { setViewTarget(task); setShowDetailModal(true) }}
                        >
                          <div className="pk-card-header">
                            <h4 className="pk-card-title">{task.title}</h4>
                          </div>

                          {task.description && (
                            <p className="pk-card-desc">{task.description}</p>
                          )}

                          {task.tags && task.tags.length > 0 && (
                            <div className="pk-card-tags">
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className="pk-card-tag">{tag}</span>
                              ))}
                            </div>
                          )}

                          <div className="pk-card-footer">
                            <div className="pk-card-meta-left" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span className={`pk-card-priority-badge prio-${task.priority}`}>
                                {getPriorityLabel(task.priority)}
                              </span>
                              {task.status === 'completed' && (
                                <button
                                  type="button"
                                  className="pk-card-archive-btn"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setArchiveTarget(task)
                                    setShowArchiveModal(true)
                                  }}
                                  title="Arquivar tarefa"
                                >
                                  <Archive size={11} />
                                  <span>Arquivar</span>
                                </button>
                              )}
                            </div>

                            <div className="pk-card-meta-right">
                              {task.date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem' }}>
                                  <Calendar size={10} /> {formatDate(task.date)}
                                </span>
                              )}
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
        <div className="pk-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="pk-modal-card" onClick={e => e.stopPropagation()}>
            <div className="pk-modal-accent" style={{ background: viewTarget.status === 'completed' ? '#10b981' : '#a78bfa' }} />
            <div className="pk-modal-head">
              <div className="pk-modal-head-left">
                <div
                  className="pk-modal-head-icon"
                  style={{
                    background: viewTarget.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(167,139,250,0.1)',
                    color: viewTarget.status === 'completed' ? '#10b981' : '#a78bfa'
                  }}
                >
                  <KanbanIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f3f4f6' }}>#{viewTarget.id}</h3>
                  <p className="pk-modal-head-sub">Criado por {viewTarget.author}</p>
                </div>
              </div>
              <button className="pk-modal-close" onClick={() => setShowDetailModal(false)}><X size={16} /></button>
            </div>

            <div className="pk-modal-body">
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
                      <span key={idx} className="pk-card-tag" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pk-detail-info-grid">
                <div className="pk-detail-info-item">
                  <span className="pk-detail-label">Responsável</span>
                  <span className="pk-detail-val">{viewTarget.responsible}</span>
                </div>
                <div className="pk-detail-info-item">
                  <span className="pk-detail-label">Prioridade</span>
                  <span className={`pk-detail-val prio-${viewTarget.priority}`} style={{ fontWeight: 700 }}>
                    {getPriorityLabel(viewTarget.priority)}
                  </span>
                </div>
                <div className="pk-detail-info-item">
                  <span className="pk-detail-label">Status Atual</span>
                  <span className="pk-detail-val" style={{ textTransform: 'capitalize' }}>
                    {viewTarget.status === 'todo' ? 'A Fazer' : viewTarget.status === 'inprogress' ? 'Em Andamento' : viewTarget.status === 'inrevision' ? 'Em Revisão' : 'Concluído'}
                  </span>
                </div>
                <div className="pk-detail-info-item">
                  <span className="pk-detail-label">Prazo Limite</span>
                  <span className="pk-detail-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {viewTarget.date ? formatDate(viewTarget.date) : 'Sem data definida'}
                  </span>
                </div>
              </div>

              {/* ── History Timeline ── */}
              {viewTarget.history && viewTarget.history.length > 0 && (
                <div className="pk-history-section">
                  <div className="pk-history-header">
                    <History size={14} />
                    <span>Histórico de Atividades</span>
                  </div>
                  <div className="pk-history-timeline">
                    {[...viewTarget.history].reverse().map((entry, idx) => {
                      const d = new Date(entry.date)
                      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

                      const statusLabel = (s) => {
                        if (s === 'todo') return 'A Fazer'
                        if (s === 'inprogress') return 'Em Andamento'
                        if (s === 'inrevision') return 'Em Revisão'
                        if (s === 'completed') return 'Concluído'
                        return s
                      }

                      let icon, color, text
                      switch (entry.action) {
                        case 'created':
                          icon = <Plus size={12} />
                          color = '#10b981'
                          text = <><strong>{entry.user}</strong> criou a tarefa</>
                          break
                        case 'status_changed':
                          icon = <ArrowRight size={12} />
                          color = entry.to === 'completed' ? '#10b981' : '#38bdf8'
                          text = <><strong>{entry.user}</strong> moveu de <em>{statusLabel(entry.from)}</em> para <em>{statusLabel(entry.to)}</em></>
                          break
                        case 'priority_changed':
                          icon = <AlertTriangle size={12} />
                          color = '#fbbf24'
                          text = <><strong>{entry.user}</strong> mudou a prioridade de <em>{getPriorityLabel(entry.from)}</em> para <em>{getPriorityLabel(entry.to)}</em></>
                          break
                        case 'deadline_changed':
                          icon = <Calendar size={12} />
                          color = '#a78bfa'
                          text = <><strong>{entry.user}</strong> mudou o prazo de <em>{formatDate(entry.from)}</em> para <em>{formatDate(entry.to)}</em></>
                          break
                        case 'archived':
                          icon = <Archive size={12} />
                          color = '#f59e0b'
                          text = <><strong>{entry.user}</strong> arquivou a tarefa</>
                          break
                        case 'unarchived':
                          icon = <Archive size={12} />
                          color = '#8b5cf6'
                          text = <><strong>{entry.user}</strong> restaurou a tarefa</>
                          break
                        default:
                          icon = <Clock size={12} />
                          color = '#6b7280'
                          text = <><strong>{entry.user}</strong> realizou uma ação</>
                      }

                      return (
                        <div key={idx} className="pk-history-item">
                          <div className="pk-history-dot" style={{ background: color, boxShadow: `0 0 8px ${color}44` }}>
                            {icon}
                          </div>
                          <div className="pk-history-content">
                            <p className="pk-history-text">{text}</p>
                            <span className="pk-history-date">{dateStr} às {timeStr}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="pk-modal-actions">
                  {viewTarget.status === 'completed' && (
                    <button 
                      className="pk-btn-cancel" 
                      style={{ border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }} 
                      onClick={() => { setArchiveTarget(viewTarget); setShowArchiveModal(true) }}
                    >
                      <Archive size={14} /> Arquivar
                    </button>
                  )}
                  <button className="pk-btn-cancel" onClick={() => handleEditClick(viewTarget)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Edit3 size={14} /> Editar
                  </button>
                  {isCreatedByCurrentUser(viewTarget) && (
                    <button className="pk-btn-danger" onClick={() => { setDeleteTarget(viewTarget); setShowDeleteModal(true) }}>
                      <Trash2 size={14} /> Excluir
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <div className="pk-modal-overlay" onClick={() => { setShowFormModal(false); setEditTarget(null) }}>
          <div className="pk-modal-card pk-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="pk-modal-accent" />
            <div className="pk-modal-head">
              <div className="pk-modal-head-left">
                <div className="pk-modal-head-icon">
                  <KanbanIcon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f3f4f6' }}>
                    {editTarget ? 'Editar Tarefa' : 'Nova Tarefa Kanban'}
                  </h3>
                  <p className="pk-modal-head-sub">Preencha os campos para {editTarget ? 'atualizar' : 'criar'} a tarefa</p>
                </div>
              </div>
              <button className="pk-modal-close" onClick={() => { setShowFormModal(false); setEditTarget(null) }}><X size={16} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="pk-modal-body">
              {formError && <div className="pk-alert-error"><AlertCircle size={14} /> {formError}</div>}

              <div className="pk-form-group">
                <label>Título *</label>
                <input
                  className="pk-input"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Reunião com responsáveis - João"
                  required
                />
              </div>

              <div className="pk-form-group">
                <label>Descrição</label>
                <textarea
                  className="pk-input pk-textarea"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ex: Discutir plano de intervenção escolar e acompanhamento psicológico..."
                />
              </div>

              <div className="pk-form-row">
                <div className="pk-form-group" style={{ flex: 1 }}>
                  <label>Usuário</label>
                  <input
                    className="pk-input"
                    value={form.responsible}
                    readOnly
                  />
                </div>
                <div className="pk-form-group" style={{ flex: 1 }}>
                  <label>Prioridade *</label>
                  <div className="pk-form-select-container">
                    <button 
                      type="button"
                      className={`pk-form-select-btn ${isFormPriorityOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFormPriorityOpen(!isFormPriorityOpen)
                        setIsFormStatusOpen(false)
                      }}
                    >
                      <span>{form.priority === 'high' ? 'Alta' : form.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                      <ChevronDown size={14} className={`pk-select-chevron ${isFormPriorityOpen ? 'open' : ''}`} />
                    </button>
                    {isFormPriorityOpen && (
                      <div className="pk-form-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={`pk-dropdown-option ${form.priority === 'high' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'high' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#ef4444' }} />
                          Alta
                        </div>
                        <div 
                          className={`pk-dropdown-option ${form.priority === 'medium' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'medium' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#3b82f6' }} />
                          Média
                        </div>
                        <div 
                          className={`pk-dropdown-option ${form.priority === 'low' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'low' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#10b981' }} />
                          Baixa
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pk-form-row">
                <div className="pk-form-group" style={{ flex: 1 }}>
                  <label>Prazo Limite *</label>
                  <input
                    type="date"
                    className="pk-input"
                    value={form.date}
                    onChange={e => {
                      let val = e.target.value
                      if (val) {
                        const parts = val.split('-')
                        if (parts[0] && parts[0].length > 4) {
                          parts[0] = parts[0].slice(0, 4)
                          val = parts.join('-')
                        }
                      }
                      setForm(p => ({ ...p, date: val }))
                    }}
                    min={minDueDate}
                    max="9999-12-31"
                    required
                  />
                </div>
                <div className="pk-form-group" style={{ flex: 1 }}>
                  <label>Status Inicial</label>
                  <div className="pk-form-select-container">
                    <button 
                      type="button"
                      className={`pk-form-select-btn ${isFormStatusOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFormStatusOpen(!isFormStatusOpen)
                        setIsFormPriorityOpen(false)
                      }}
                    >
                      <span>
                        {form.status === 'todo' ? 'A Fazer' : 
                         form.status === 'inprogress' ? 'Em Andamento' : 
                         form.status === 'inrevision' ? 'Em Revisão' : 'Concluído'}
                      </span>
                      <ChevronDown size={14} className={`pk-select-chevron ${isFormStatusOpen ? 'open' : ''}`} />
                    </button>
                    {isFormStatusOpen && (
                      <div className="pk-form-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={`pk-dropdown-option ${form.status === 'todo' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, status: 'todo' })); setIsFormStatusOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#6b7280' }} />
                          A Fazer
                        </div>
                        <div 
                          className={`pk-dropdown-option ${form.status === 'inprogress' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, status: 'inprogress' })); setIsFormStatusOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#3b82f6' }} />
                          Em Andamento
                        </div>
                        <div 
                          className={`pk-dropdown-option ${form.status === 'inrevision' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, status: 'inrevision' })); setIsFormStatusOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#f59e0b' }} />
                          Em Revisão
                        </div>
                        <div 
                          className={`pk-dropdown-option ${form.status === 'completed' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, status: 'completed' })); setIsFormStatusOpen(false) }}
                        >
                          <span className="pk-option-dot" style={{ background: '#10b981' }} />
                          Concluído
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pk-form-group">
                <label>Etiquetas (Separadas por vírgula)</label>
                <input
                  className="pk-input"
                  value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="Ex: Acolhimento, João, Reunião"
                />
              </div>

              <button type="submit" className="pk-submit-btn" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="pk-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar Tarefa</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Uniform style) */}
      {showDeleteModal && deleteTarget && (
        <div className="pk-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="pk-modal-card" onClick={e => e.stopPropagation()}>
            <div className="pk-modal-accent pk-accent-red" />
            <div className="pk-modal-head">
              <div className="pk-modal-head-left">
                <div className="pk-modal-head-icon pk-icon-red">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>Confirmar Exclusão</h3>
                </div>
              </div>
              <button className="pk-modal-close" onClick={() => setShowDeleteModal(false)}><X size={16} /></button>
            </div>
            <div className="pk-modal-body" style={{ gap: 18 }}>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
                Tem certeza que deseja excluir permanentemente a tarefa <strong>"{deleteTarget.title}"</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="pk-modal-actions" style={{ marginTop: 6 }}>
                <button className="pk-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                <button className="pk-btn-danger" onClick={handleDeleteTask} disabled={isSaving}>
                  {isSaving ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && archiveTarget && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={() => !isSaving && setShowArchiveModal(false)}
          />

          {/* Modal card */}
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.97) 0%, rgba(18, 22, 34, 0.99) 100%)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245, 158, 11, 0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Top amber accent bar */}
            <div
              style={{
                height: '3px',
                background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), rgba(245,158,11,0.8), rgba(245,158,11,0.6), transparent)',
              }}
            />

            {/* Amber glow */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 65%)',
                pointerEvents: 'none',
              }}
            />

            <div className="relative p-6 flex flex-col items-center text-center space-y-5">
              {/* Animated icon */}
              <div
                className="w-18 h-18 rounded-2xl flex items-center justify-center"
                style={{
                  width: '72px',
                  height: '72px',
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  boxShadow: '0 0 30px rgba(245,158,11,0.08)',
                }}
              >
                <Archive size={32} style={{ color: '#fbbf24' }} />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>
                  Arquivar Chamado?
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  Tem certeza que deseja arquivar a tarefa <strong>"{archiveTarget.title}"</strong>? Essa ação <strong style={{ color: '#fbbf24' }}>será transferida para o Kanban Resolvido</strong>.
                </p>
              </div>

              {/* Preview of task being archived */}
              <div
                className="w-full rounded-xl p-3 text-left"
                style={{
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Tarefa a ser arquivada:</p>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#fbbf24' }}>
                  #{archiveTarget.id}
                </p>
                {archiveTarget.title && (
                  <p className="text-sm line-clamp-3" style={{ color: '#cbd5e1' }}>
                    {archiveTarget.title.length > 120 ? archiveTarget.title.slice(0, 120) + '…' : archiveTarget.title}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full pt-1">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(100, 116, 139, 0.1)',
                    color: '#94a3b8',
                    border: '1px solid rgba(100, 116, 139, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.background = 'rgba(100, 116, 139, 0.18)'
                      e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.15)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  onClick={handleArchiveTask}
                  disabled={isSaving}
                  style={{
                    background: isSaving
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.75) 0%, rgba(217,119,6,0.85) 100%)',
                    color: '#fff',
                    border: '1px solid rgba(245,158,11,0.35)',
                    boxShadow: isSaving ? 'none' : '0 4px 20px rgba(245,158,11,0.2)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.boxShadow = '0 6px 25px rgba(245,158,11,0.35)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.2)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Arquivando...
                    </>
                  ) : (
                    <>
                      <Archive size={15} />
                      Sim, arquivar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
