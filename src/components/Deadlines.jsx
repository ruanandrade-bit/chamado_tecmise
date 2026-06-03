import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, CalendarDays, Clock, CheckCircle2, AlertTriangle, AlertCircle, Search, Filter, Loader2, ShieldCheck, X, Edit3, ChevronRight, Tag } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Deadlines.css'

const CATEGORY_CONFIG = {
  pedagoga: { label: 'Pedagogia', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  psicologa: { label: 'Psicologia', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  geral: { label: 'Geral / Outros', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' }
}

const PRIORITY_CONFIG = {
  alta: { label: 'Prioridade Alta', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.2)' },
  media: { label: 'Prioridade Média', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.2)' },
  baixa: { label: 'Prioridade Baixa', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.2)' }
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  em_andamento: { label: 'Em Andamento', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  concluido: { label: 'Concluído', color: '#34d399', bg: 'rgba(52,211,153,0.08)' }
}

export default function Deadlines() {
  const { user } = useAuthStore()
  const role = (user?.role || '').toLowerCase()
  const canEdit = role === 'pedagoga' || role === 'psicóloga' || user?.canDragDrop === true

  const [deadlines, setDeadlines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewDeadline, setViewDeadline] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Form state
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadDeadlines() }, [])

  const loadDeadlines = async () => {
    setIsLoading(true)
    try {
      const data = await api.get('/deadlines')
      setDeadlines(data || [])
    } catch (e) { console.error('Error fetching deadlines:', e) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Título é obrigatório.')
    if (!form.date) return setFormError('Data é obrigatória.')

    setIsSaving(true)
    try {
      if (editTarget) {
        const updated = await api.put(`/deadlines/${editTarget.id}`, form)
        setDeadlines(prev => prev.map(d => d.id === updated.id ? updated : d))
        setEditTarget(null)
      } else {
        const newDeadline = await api.post('/deadlines', form)
        setDeadlines(prev => [newDeadline, ...prev])
      }
      setForm({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
      setShowAddModal(false)
    } catch (err) { setFormError(err.message || 'Falha ao salvar.') }
    finally { setIsSaving(false) }
  }

  const handleEditClick = (d) => {
    setEditTarget(d)
    setForm({
      title: d.title,
      description: d.description || '',
      date: d.date,
      time: d.time || '',
      category: d.category || 'pedagoga',
      priority: d.priority || 'media',
      status: d.status || 'pendente'
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/deadlines/${id}`)
      setDeadlines(prev => prev.filter(d => d.id !== id))
      setDeleteTarget(null)
    } catch (e) { alert('Falha ao deletar.') }
  }

  const toggleStatus = async (d) => {
    if (!canEdit) return
    const nextStatusMap = {
      pendente: 'em_andamento',
      em_andamento: 'concluido',
      concluido: 'pendente'
    }
    const nextStatus = nextStatusMap[d.status || 'pendente']
    try {
      const updated = await api.put(`/deadlines/${d.id}`, { status: nextStatus })
      setDeadlines(prev => prev.map(item => item.id === updated.id ? updated : item))
    } catch (e) { console.error('Error changing status:', e) }
  }

  // Derived filter
  const filtered = deadlines.filter(d => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    const matchCat = !filterCategory || d.category === filterCategory
    const matchPriority = !filterPriority || d.priority === filterPriority
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchCat && matchPriority && matchStatus
  })

  // Sort deadlines: concluidos at the bottom, others sorted by date (closer first)
  const sortedDeadlines = [...filtered].sort((a, b) => {
    if (a.status === 'concluido' && b.status !== 'concluido') return 1
    if (a.status !== 'concluido' && b.status === 'concluido') return -1
    return new Date(a.date) - new Date(b.date)
  })

  // Stats
  const total = deadlines.length
  const pending = deadlines.filter(d => d.status !== 'concluido').length
  const completed = deadlines.filter(d => d.status === 'concluido').length
  const urgent = deadlines.filter(d => d.status !== 'concluido' && d.priority === 'alta').length

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  const isOverdue = (dateStr, status) => {
    if (status === 'concluido') return false
    const todayStr = new Date().toISOString().split('T')[0]
    return dateStr < todayStr
  }

  return (
    <div className="dl-container">
      {/* Header */}
      <div className="dl-page-header">
        <div className="dl-header-left">
          <div className="dl-header-icon"><CalendarDays size={24} /></div>
          <div>
            <h1 className="dl-page-title">Datas & Prazos</h1>
            <p className="dl-page-sub">Controle cronograma de metas, atendimentos, entregas e relatórios</p>
          </div>
        </div>
        <div className="dl-header-right">
          <div className="dl-search-box">
            <Search size={14} />
            <input placeholder="Buscar prazos ou descrições..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {canEdit ? (
            <button className="dl-new-btn" onClick={() => { setEditTarget(null); setForm({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' }); setShowAddModal(true) }}>
              <Plus size={16} /> Novo prazo
            </button>
          ) : (
            <span className="dl-badge-view"><AlertCircle size={14} /> Somente Leitura</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dl-stats-grid">
        <div className="dl-stat-card">
          <div className="dl-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.1)' }}><Calendar size={20} /></div>
          <div><p className="dl-stat-num">{total}</p><p className="dl-stat-label">total de prazos</p></div>
        </div>
        <div className="dl-stat-card">
          <div className="dl-stat-icon" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }}><Clock size={20} /></div>
          <div><p className="dl-stat-num">{pending}</p><p className="dl-stat-label">prazos ativos</p></div>
        </div>
        <div className="dl-stat-card">
          <div className="dl-stat-icon" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)' }}><CheckCircle2 size={20} /></div>
          <div><p className="dl-stat-num">{completed}</p><p className="dl-stat-label">concluídos</p></div>
        </div>
        <div className="dl-stat-card">
          <div className="dl-stat-icon" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}><AlertTriangle size={20} /></div>
          <div><p className="dl-stat-num">{urgent}</p><p className="dl-stat-label">urgentes pendentes</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="dl-filters-bar">
        <div className="dl-filter-item">
          <Filter size={12} />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas categorias</option>
            <option value="pedagoga">Pedagogia</option>
            <option value="psicologa">Psicologia</option>
            <option value="geral">Geral / Outros</option>
          </select>
        </div>
        <div className="dl-filter-item">
          <Tag size={12} />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">Todas prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div className="dl-filter-item">
          <CheckCircle2 size={12} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
      </div>

      {/* Deadlines List */}
      {isLoading ? (
        <div className="dl-loading"><Loader2 size={32} className="dl-spinner" /><p>Carregando prazos...</p></div>
      ) : sortedDeadlines.length === 0 ? (
        <div className="dl-empty-state">
          <CalendarDays size={48} style={{ color: '#374151', marginBottom: 12 }} />
          <p>Nenhum prazo encontrado.</p>
        </div>
      ) : (
        <div className="dl-list-wrapper">
          {sortedDeadlines.map((dl, i) => {
            const cat = CATEGORY_CONFIG[dl.category] || CATEGORY_CONFIG.geral
            const prio = PRIORITY_CONFIG[dl.priority] || PRIORITY_CONFIG.media
            const st = STATUS_CONFIG[dl.status] || STATUS_CONFIG.pendente
            const overdue = isOverdue(dl.date, dl.status)

            return (
              <div key={dl.id} className={`dl-row-card ${dl.status === 'concluido' ? 'dl-completed-card' : ''}`} style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setViewDeadline(dl)}>
                {/* Status Toggle Box */}
                <div className="dl-status-box" onClick={(e) => { e.stopPropagation(); toggleStatus(dl) }} title={canEdit ? "Alterar status" : ""}>
                  {dl.status === 'concluido' ? (
                    <CheckCircle2 size={22} className="dl-status-check-active" />
                  ) : (
                    <div className={`dl-status-ring ring-${dl.status}`} />
                  )}
                </div>

                <div className="dl-main-info">
                  <div className="dl-title-row">
                    <span className="dl-title-text">{dl.title}</span>
                    {overdue && <span className="dl-badge-overdue">ATRASADO</span>}
                  </div>
                  {dl.description && <p className="dl-desc-text">{dl.description}</p>}
                </div>

                <div className="dl-meta-info">
                  <div className="dl-date-badge">
                    <Calendar size={14} />
                    <span>{formatDateDisplay(dl.date)}</span>
                    {dl.time && (
                      <>
                        <Clock size={14} style={{ marginLeft: 6 }} />
                        <span>{dl.time}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="dl-badges-group">
                  <span className="dl-tag-badge" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>{cat.label}</span>
                  <span className="dl-tag-badge" style={{ background: prio.bg, color: prio.color, borderColor: prio.border }}>{prio.label}</span>
                  <span className="dl-tag-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                </div>

                {canEdit && (
                  <div className="dl-actions-group" onClick={e => e.stopPropagation()}>
                    <button className="dl-action-btn" onClick={() => handleEditClick(dl)} title="Editar prazo"><Edit3 size={14} /></button>
                    <button className="dl-action-btn dl-btn-del" onClick={() => setDeleteTarget(dl)} title="Excluir prazo"><Trash2 size={14} /></button>
                  </div>
                )}
                <ChevronRight size={16} className="dl-chevron" />
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="dl-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dl-modal-card" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-accent" />
            <div className="dl-modal-head">
              <div className="dl-modal-head-left">
                <div className="dl-modal-head-icon">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h3>{editTarget ? 'Editar Prazo' : 'Novo Prazo'}</h3>
                  <p className="dl-modal-head-sub">Preencha as informações do cronograma</p>
                </div>
              </div>
              <button className="dl-modal-close" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="dl-modal-body">
              {formError && <div className="dl-alert-error"><AlertCircle size={14} />{formError}</div>}
              <div className="dl-form-group">
                <label>Título *</label>
                <input className="dl-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Entrega do Relatório Mensal" />
              </div>
              <div className="dl-form-group">
                <label>Descrição</label>
                <textarea className="dl-input dl-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes do prazo..." />
              </div>
              <div className="dl-form-row">
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Data Limite *</label>
                  <input type="date" className="dl-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Horário</label>
                  <input type="time" className="dl-input" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="dl-form-row">
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Categoria</label>
                  <select className="dl-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="pedagoga">Pedagogia</option>
                    <option value="psicologa">Psicologia</option>
                    <option value="geral">Geral / Outros</option>
                  </select>
                </div>
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Prioridade</label>
                  <select className="dl-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>
              <div className="dl-form-group">
                <label>Status</label>
                <select className="dl-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
              <button type="submit" className="dl-submit-btn" disabled={isSaving}>
                {isSaving ? <><Loader2 size={16} className="dl-spinner" /> Salvando...</> : <><Plus size={16} /> Salvar Prazo</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="dl-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="dl-modal-card dl-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-accent dl-accent-red" />
            <div className="dl-modal-head">
              <div className="dl-modal-head-left">
                <div className="dl-modal-head-icon dl-icon-red">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3>Confirmar Exclusão</h3>
                  <p className="dl-modal-head-sub">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button className="dl-modal-close" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="dl-modal-body">
              <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>Tem certeza que deseja excluir o prazo <strong style={{ color: '#f1f5f9' }}>"{deleteTarget.title}"</strong>?</p>
              <div className="dl-modal-actions">
                <button className="dl-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="dl-btn-danger" onClick={() => handleDelete(deleteTarget.id)}><Trash2 size={14} /> Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDeadline && (() => {
        const cat = CATEGORY_CONFIG[viewDeadline.category] || CATEGORY_CONFIG.geral
        const prio = PRIORITY_CONFIG[viewDeadline.priority] || PRIORITY_CONFIG.media
        const st = STATUS_CONFIG[viewDeadline.status] || STATUS_CONFIG.pendente
        return (
          <div className="dl-modal-overlay" onClick={() => setViewDeadline(null)}>
            <div className="dl-modal-card" onClick={e => e.stopPropagation()}>
              <div className="dl-modal-accent" />
              <div className="dl-modal-head">
                <div className="dl-modal-head-left">
                  <div className="dl-modal-head-icon" style={{ background: cat.bg, color: cat.color }}>
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3>{viewDeadline.title}</h3>
                    <p className="dl-modal-head-sub">Autor: {viewDeadline.author}</p>
                  </div>
                </div>
                <button className="dl-modal-close" onClick={() => setViewDeadline(null)}><X size={16} /></button>
              </div>
              <div className="dl-modal-body">
                {viewDeadline.description ? (
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.6 }}>{viewDeadline.description}</p>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.8125rem', fontStyle: 'italic' }}>Sem descrição disponível.</p>
                )}
                <div className="dl-detail-info-grid">
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Data</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>📅 {formatDateDisplay(viewDeadline.date)} {viewDeadline.time && ` às ${viewDeadline.time}`}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Categoria</span>
                    <span className="dl-tag-badge" style={{ background: cat.bg, color: cat.color, borderColor: cat.border, alignSelf: 'flex-start' }}>{cat.label}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Prioridade</span>
                    <span className="dl-tag-badge" style={{ background: prio.bg, color: prio.color, borderColor: prio.border, alignSelf: 'flex-start' }}>{prio.label}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Status</span>
                    <span className="dl-tag-badge" style={{ background: st.bg, color: st.color, alignSelf: 'flex-start' }}>{st.label}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
