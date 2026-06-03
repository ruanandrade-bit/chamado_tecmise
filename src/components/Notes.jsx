import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2, Pin, PinOff, Calendar, Clock, Bell, BookOpen, Brain, Search, Filter, Loader2, AlertCircle, ShieldCheck, X, Edit3, Check, ArrowRight, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Notes.css'

const CATEGORY_CONFIG = {
  pedagoga: { label: 'Pedagoga', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  psicologa: { label: 'Psicóloga', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' }
}

const STATUS_CONFIG = {
  agendado: { label: 'Agendado', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  urgente: { label: 'Urgente', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  hoje: { label: 'Hoje', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  confirmado: { label: 'Confirmado', color: '#34d399', bg: 'rgba(52,211,153,0.12)' }
}

export default function Notes() {
  const { user } = useAuthStore()
  const role = (user?.role || '').toLowerCase()
  const canEdit = role === 'pedagoga' || role === 'psicóloga' || user?.canDragDrop === true

  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewNote, setViewNote] = useState(null)
  const [showTimeline, setShowTimeline] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')

  // Form
  const [form, setForm] = useState({ title: '', description: '', category: 'pedagoga', noteType: 'note', reminderDate: '', reminderTime: '', reminderStatus: 'agendado' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadNotes() }, [])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const data = await api.get('/notes')
      setNotes(data || [])
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Título é obrigatório.')
    setIsSaving(true)
    try {
      const newNote = await api.post('/notes', form)
      setNotes(prev => [newNote, ...prev])
      setForm({ title: '', description: '', category: 'pedagoga', noteType: 'note', reminderDate: '', reminderTime: '', reminderStatus: 'agendado' })
      setShowModal(false)
    } catch (err) { setFormError(err.message) }
    finally { setIsSaving(false) }
  }

  const togglePin = async (note) => {
    try {
      const updated = await api.put(`/notes/${note.id}`, { isPinned: !note.isPinned })
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`)
      setNotes(prev => prev.filter(n => n.id !== id))
      setDeleteTarget(null)
    } catch (e) { alert('Falha ao deletar.') }
  }

  // Derived data
  const filtered = notes.filter(n => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || n.title.toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q) || (n.author || '').toLowerCase().includes(q)
    const matchCat = !filterCategory || n.category === filterCategory
    const matchType = !filterType || n.noteType === filterType
    return matchSearch && matchCat && matchType
  })

  const pinned = filtered.filter(n => n.isPinned)
  const recentNotes = filtered.filter(n => n.noteType === 'note' && !n.isPinned).slice(0, 6)
  const reminders = filtered.filter(n => n.noteType === 'reminder')
  const countPedagoga = notes.filter(n => n.category === 'pedagoga').length
  const countPsicologa = notes.filter(n => n.category === 'psicologa').length
  const activeNotes = notes.filter(n => n.noteType === 'note').length
  const pendingReminders = notes.filter(n => n.noteType === 'reminder').length

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
  const formatDateTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ', ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="nt-container">
      {/* Header */}
      <div className="nt-page-header">
        <div className="nt-header-left">
          <div className="nt-header-icon"><StickyNote size={24} /></div>
          <div>
            <h1 className="nt-page-title">Anotações</h1>
            <p className="nt-page-sub">Registre observações, lembretes, acompanhamentos e datas importantes</p>
          </div>
        </div>
        <div className="nt-header-right">
          <div className="nt-search-box">
            <Search size={14} />
            <input placeholder="Buscar anotações, responsáveis, turmas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {canEdit ? (
            <button className="nt-new-btn" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nova anotação
            </button>
          ) : (
            <span className="nt-badge-view"><AlertCircle size={14} /> Somente Leitura</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="nt-stats-grid">
        <div className="nt-stat-card">
          <div className="nt-stat-icon" style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}><BookOpen size={20} /></div>
          <div><p className="nt-stat-num">{activeNotes}</p><p className="nt-stat-label">anotações ativas</p></div>
          <div className="nt-stat-sparkline nt-spark-blue" />
        </div>
        <div className="nt-stat-card">
          <div className="nt-stat-icon" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }}><Bell size={20} /></div>
          <div><p className="nt-stat-num">{pendingReminders}</p><p className="nt-stat-label">pendências de acompanhamento</p></div>
          <div className="nt-stat-sparkline nt-spark-yellow" />
        </div>
        <div className="nt-stat-card">
          <div className="nt-stat-icon" style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.1)' }}><Calendar size={20} /></div>
          <div><p className="nt-stat-num">{reminders.filter(r => r.reminderDate).length}</p><p className="nt-stat-label">datas vinculadas</p></div>
          <div className="nt-stat-sparkline nt-spark-purple" />
        </div>
      </div>

      {/* Filters */}
      <div className="nt-filters-bar">
        <div className="nt-filter-item">
          <Filter size={12} />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas as categorias</option>
            <option value="pedagoga">Pedagoga</option>
            <option value="psicologa">Psicóloga</option>
          </select>
        </div>
        <div className="nt-filter-item">
          <StickyNote size={12} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="note">Anotações</option>
            <option value="reminder">Lembretes</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="nt-loading"><Loader2 size={32} className="nt-spinner" /><p>Carregando anotações...</p></div>
      ) : (
        <div className="nt-main-grid">
          {/* Left Column */}
          <div className="nt-col-left">
            <div className="nt-section-header"><h2>ANOTAÇÕES RECENTES</h2></div>
            {recentNotes.length === 0 ? (
              <p className="nt-empty-hint">Nenhuma anotação recente.</p>
            ) : (
              <div className="nt-cards-grid">
                {recentNotes.map((note, i) => {
                  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
                  return (
                    <div key={note.id} className="nt-note-card" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="nt-card-top">
                        <div className="nt-card-icon" style={{ background: cat.bg, color: cat.color }}>
                          {note.category === 'psicologa' ? <Brain size={18} /> : <BookOpen size={18} />}
                        </div>
                        {canEdit && (
                          <button className="nt-pin-btn" onClick={() => togglePin(note)} title={note.isPinned ? 'Desafixar' : 'Fixar'}>
                            {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </button>
                        )}
                      </div>
                      <h3 className="nt-card-title">{note.title}</h3>
                      {note.description && <p className="nt-card-desc">{note.description}</p>}
                      <div className="nt-card-footer">
                        <span className="nt-cat-badge" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>{cat.label}</span>
                        <span className="nt-author-badge">👤 {note.author}</span>
                      </div>
                      <div className="nt-card-meta">
                        <span>📅 {formatDateTime(note.createdAt)}</span>
                        {canEdit && <button className="nt-card-del" onClick={() => setDeleteTarget(note)}><Trash2 size={12} /></button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Middle Column — Reminders */}
          <div className="nt-col-mid">
            <div className="nt-section-header"><h2>LEMBRETES E DATAS IMPORTANTES</h2></div>
            {reminders.length === 0 ? (
              <p className="nt-empty-hint">Nenhum lembrete cadastrado.</p>
            ) : (
              <div className="nt-reminders-list">
                {reminders.map((rem, i) => {
                  const cat = CATEGORY_CONFIG[rem.category] || CATEGORY_CONFIG.pedagoga
                  const st = STATUS_CONFIG[rem.reminderStatus] || STATUS_CONFIG.agendado
                  return (
                    <div key={rem.id} className="nt-reminder-row" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="nt-reminder-dot" style={{ background: cat.color }} />
                      <div className="nt-reminder-info">
                        <span className="nt-reminder-title">{rem.title}</span>
                        <span className="nt-reminder-date">{rem.reminderDate ? formatDate(rem.reminderDate) : formatDate(rem.createdAt)}{rem.reminderTime ? ` • ${rem.reminderTime}` : ''}</span>
                      </div>
                      <div className="nt-reminder-badges">
                        <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                        <span className="nt-status-badge" style={{ background: st.bg, color: st.color }}>• {st.label}</span>
                      </div>
                      {canEdit && <button className="nt-reminder-del" onClick={() => setDeleteTarget(rem)}><Trash2 size={12} /></button>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column — Categories + Pinned */}
          <div className="nt-col-right">
            <div className="nt-section-header"><h2>CATEGORIAS</h2></div>
            <div className="nt-categories-box">
              <div className="nt-cat-row"><span className="nt-cat-dot" style={{ background: '#a78bfa' }} /> Pedagoga <span className="nt-cat-count">{countPedagoga}</span></div>
              <div className="nt-cat-row"><span className="nt-cat-dot" style={{ background: '#34d399' }} /> Psicóloga <span className="nt-cat-count">{countPsicologa}</span></div>
            </div>

            {pinned.length > 0 && (
              <>
                <div className="nt-section-header" style={{ marginTop: 20 }}><h2>FIXADAS</h2></div>
                <div className="nt-pinned-list">
                  {pinned.map(note => {
                    const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
                    return (
                      <div key={note.id} className="nt-pinned-card" onClick={() => setViewNote(note)} style={{ cursor: 'pointer' }}>
                        <div className="nt-pinned-icon" style={{ background: cat.bg, color: cat.color }}>
                          {note.category === 'psicologa' ? <Brain size={16} /> : <BookOpen size={16} />}
                        </div>
                        <div className="nt-pinned-info">
                          <span className="nt-pinned-title">{note.title}</span>
                          <span className="nt-pinned-meta">{formatDate(note.createdAt)} • {note.author}</span>
                        </div>
                        {canEdit && <button className="nt-pin-active" onClick={(e) => { e.stopPropagation(); togglePin(note) }}><Pin size={14} /></button>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {notes.length > 0 && (
        <div className="nt-timeline-section">
          <div className="nt-section-header"><h2>LINHA DO TEMPO DE ACOMPANHAMENTO</h2></div>
          <div className="nt-timeline-scroll">
            {notes.slice(0, 5).map((note, i) => {
              const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
              const time = note.reminderTime || new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={note.id} className="nt-timeline-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="nt-tl-time"><span className="nt-tl-dot" style={{ background: cat.color }} />{time}</div>
                  <h4 className="nt-tl-title">{note.title}</h4>
                  {note.description && <p className="nt-tl-desc">{note.description}</p>}
                  <div className="nt-tl-footer">
                    <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                    {canEdit && <Edit3 size={12} style={{ color: '#4b5563' }} />}
                  </div>
                </div>
              )
            })}
          </div>
          <button className="nt-timeline-view-all" onClick={() => setShowTimeline(true)}>
            Ver toda a linha do tempo <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* New Note Modal */}
      {showModal && (
        <div className="nt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="nt-modal-accent" />
            <div className="nt-modal-head">
              <h3><StickyNote size={18} /> Nova Anotação</h3>
              <button className="nt-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="nt-modal-body">
              {formError && <div className="nt-alert-error"><AlertCircle size={14} />{formError}</div>}
              <div className="nt-form-group">
                <label>Título *</label>
                <input className="nt-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Registro de acolhimento" />
              </div>
              <div className="nt-form-group">
                <label>Descrição</label>
                <textarea className="nt-input nt-textarea" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes da anotação..." />
              </div>
              <div className="nt-form-row">
                <div className="nt-form-group" style={{ flex: 1 }}>
                  <label>Categoria</label>
                  <select className="nt-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="pedagoga">Pedagoga</option>
                    <option value="psicologa">Psicóloga</option>
                  </select>
                </div>
                <div className="nt-form-group" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select className="nt-input" value={form.noteType} onChange={e => setForm(p => ({ ...p, noteType: e.target.value }))}>
                    <option value="note">Anotação</option>
                    <option value="reminder">Lembrete</option>
                  </select>
                </div>
              </div>
              {form.noteType === 'reminder' && (
                <>
                  <div className="nt-form-row">
                    <div className="nt-form-group" style={{ flex: 1 }}>
                      <label>Data</label>
                      <input type="date" className="nt-input" value={form.reminderDate} onChange={e => setForm(p => ({ ...p, reminderDate: e.target.value }))} />
                    </div>
                    <div className="nt-form-group" style={{ flex: 1 }}>
                      <label>Horário</label>
                      <input type="time" className="nt-input" value={form.reminderTime} onChange={e => setForm(p => ({ ...p, reminderTime: e.target.value }))} />
                    </div>
                  </div>
                  <div className="nt-form-group">
                    <label>Status</label>
                    <select className="nt-input" value={form.reminderStatus} onChange={e => setForm(p => ({ ...p, reminderStatus: e.target.value }))}>
                      <option value="agendado">Agendado</option>
                      <option value="urgente">Urgente</option>
                      <option value="hoje">Hoje</option>
                      <option value="confirmado">Confirmado</option>
                    </select>
                  </div>
                </>
              )}
              <button type="submit" className="nt-submit-btn" disabled={isSaving}>
                {isSaving ? <><Loader2 size={16} className="nt-spinner" /> Salvando...</> : <><Plus size={16} /> Salvar Anotação</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm — padrão do sistema */}
      {deleteTarget && (
        <div className="nt-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="nt-modal-card nt-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="nt-modal-accent nt-accent-red" />
            <div className="nt-modal-head">
              <div className="nt-modal-head-left">
                <div className="nt-modal-head-icon nt-icon-red">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3>Confirmar Exclusão</h3>
                  <p className="nt-modal-head-sub">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              <button className="nt-modal-close" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="nt-modal-body">
              <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>Tem certeza que deseja excluir a anotação <strong style={{ color: '#f1f5f9' }}>"{deleteTarget.title}"</strong>?</p>
              <div className="nt-modal-actions">
                <button className="nt-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="nt-btn-danger" onClick={() => handleDelete(deleteTarget.id)}><Trash2 size={14} /> Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal (fixadas) */}
      {viewNote && (() => {
        const cat = CATEGORY_CONFIG[viewNote.category] || CATEGORY_CONFIG.pedagoga
        return (
          <div className="nt-modal-overlay" onClick={() => setViewNote(null)}>
            <div className="nt-modal-card" onClick={e => e.stopPropagation()}>
              <div className="nt-modal-accent" />
              <div className="nt-modal-head">
                <div className="nt-modal-head-left">
                  <div className="nt-modal-head-icon" style={{ background: cat.bg, color: cat.color }}>
                    {viewNote.category === 'psicologa' ? <Brain size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div>
                    <h3>{viewNote.title}</h3>
                    <p className="nt-modal-head-sub">{cat.label} • {viewNote.author}</p>
                  </div>
                </div>
                <button className="nt-modal-close" onClick={() => setViewNote(null)}><X size={16} /></button>
              </div>
              <div className="nt-modal-body">
                {viewNote.description ? (
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.6 }}>{viewNote.description}</p>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.8125rem', fontStyle: 'italic' }}>Sem descrição.</p>
                )}
                <div className="nt-detail-info-grid">
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Categoria</span>
                    <span className="nt-cat-badge" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>{cat.label}</span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Autor</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>👤 {viewNote.author}</span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Tipo</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>{viewNote.noteType === 'reminder' ? '🔔 Lembrete' : '📝 Anotação'}</span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Criado em</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>📅 {formatDateTime(viewNote.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Full Timeline Modal */}
      {showTimeline && (
        <div className="nt-modal-overlay" onClick={() => setShowTimeline(false)}>
          <div className="nt-modal-card nt-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="nt-modal-accent" />
            <div className="nt-modal-head">
              <div className="nt-modal-head-left">
                <div className="nt-modal-head-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3>Linha do Tempo Completa</h3>
                  <p className="nt-modal-head-sub">{notes.length} registro{notes.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button className="nt-modal-close" onClick={() => setShowTimeline(false)}><X size={16} /></button>
            </div>
            <div className="nt-modal-body nt-timeline-modal-body">
              {notes.map((note, i) => {
                const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
                const time = note.reminderTime || new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={note.id} className="nt-tl-modal-row">
                    <div className="nt-tl-modal-line">
                      <span className="nt-tl-dot" style={{ background: cat.color }} />
                      {i < notes.length - 1 && <div className="nt-tl-connector" />}
                    </div>
                    <div className="nt-tl-modal-content">
                      <div className="nt-tl-modal-time">{time} • {formatDate(note.createdAt)}</div>
                      <h4 className="nt-tl-title">{note.title}</h4>
                      {note.description && <p className="nt-tl-desc">{note.description}</p>}
                      <div className="nt-tl-footer">
                        <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                        <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>👤 {note.author}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
