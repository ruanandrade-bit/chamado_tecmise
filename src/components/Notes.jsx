import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2, Pin, PinOff, Calendar, CalendarDays, Clock, Bell, BookOpen, Brain, Search, Filter, Loader2, AlertCircle, ShieldCheck, X, Edit3, Check, ArrowRight, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
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
  const [deadlines, setDeadlines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewNote, setViewNote] = useState(null)
  const [showTimeline, setShowTimeline] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isFormCategoryOpen, setIsFormCategoryOpen] = useState(false)
  const [isFormTypeOpen, setIsFormTypeOpen] = useState(false)
  const [isFormStatusOpen, setIsFormStatusOpen] = useState(false)
  const [timelineMonth, setTimelineMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [tlModalMonth, setTlModalMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [editTarget, setEditTarget] = useState(null)

  // Form
  const [form, setForm] = useState({ title: '', description: '', category: 'pedagoga', noteType: 'note', reminderDate: '', reminderTime: '', reminderStatus: 'agendado' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { loadNotes() }, [])

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsCategoryOpen(false)
      setIsTypeOpen(false)
      setIsFormCategoryOpen(false)
      setIsFormTypeOpen(false)
      setIsFormStatusOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const [notesData, deadlinesData] = await Promise.all([
        api.get('/notes'),
        api.get('/deadlines')
      ])
      setNotes(notesData || [])
      setDeadlines(deadlinesData || [])
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Título é obrigatório.')
    setIsSaving(true)
    try {
      if (editTarget) {
        if (editTarget.isDeadline) {
          const deadlineForm = {
            title: form.title,
            description: form.description,
            date: form.reminderDate || new Date().toISOString().split('T')[0],
            time: form.reminderTime || '00:00',
            category: form.category,
            status: form.reminderStatus === 'concluido' ? 'concluido' : (editTarget.status || 'pendente'),
            priority: editTarget.priority || 'media'
          }
          const updated = await api.put(`/deadlines/${editTarget.id}`, deadlineForm)
          setDeadlines(prev => prev.map(d => d.id === updated.id ? updated : d))
        } else {
          const updated = await api.put(`/notes/${editTarget.id}`, form)
          setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        }
        setEditTarget(null)
      } else {
        const newNote = await api.post('/notes', form)
        setNotes(prev => [newNote, ...prev])
      }
      setForm({ title: '', description: '', category: 'pedagoga', noteType: 'note', reminderDate: '', reminderTime: '', reminderStatus: 'agendado' })
      setShowModal(false)
    } catch (err) { setFormError(err.message) }
    finally { setIsSaving(false) }
  }

  const handleEditClick = (note) => {
    setEditTarget(note)
    setForm({
      title: note.title,
      description: note.description || '',
      category: note.category || 'pedagoga',
      noteType: note.noteType || 'note',
      reminderDate: note.reminderDate || '',
      reminderTime: note.reminderTime || '',
      reminderStatus: note.reminderStatus || 'agendado'
    })
    setShowModal(true)
  }

  const togglePin = async (note) => {
    try {
      const updated = await api.put(`/notes/${note.id}`, { isPinned: !note.isPinned })
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try {
      if (String(id).startsWith('DL-')) {
        await api.delete(`/deadlines/${id}`)
        setDeadlines(prev => prev.filter(d => d.id !== id))
      } else {
        await api.delete(`/notes/${id}`)
        setNotes(prev => prev.filter(n => n.id !== id))
      }
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

  const matchSearch = (item, q) => !q || item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || (item.author || '').toLowerCase().includes(q)
  const matchCat = (item, cat) => !cat || item.category === cat

  const q = searchQuery.toLowerCase()

  const notesReminders = notes
    .filter(n => n.noteType === 'reminder')
    .filter(n => matchSearch(n, q) && matchCat(n, filterCategory))

  const mappedDeadlines = deadlines
    .map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category || 'pedagoga',
      noteType: 'reminder',
      author: d.author,
      reminderDate: d.date,
      reminderTime: d.time,
      reminderStatus: d.status === 'concluido' ? 'concluido' : 'agendado',
      createdAt: d.createdAt,
      isDeadline: true,
      priority: d.priority,
      status: d.status
    }))
    .filter(d => matchSearch(d, q) && matchCat(d, filterCategory))

  const reminders = [...notesReminders, ...mappedDeadlines].sort((a, b) => {
    const isCompA = a.reminderStatus === 'concluido'
    const isCompB = b.reminderStatus === 'concluido'
    if (isCompA && !isCompB) return 1
    if (!isCompA && isCompB) return -1
    const dateA = a.reminderDate || a.createdAt
    const dateB = b.reminderDate || b.createdAt
    return new Date(dateA) - new Date(dateB)
  })

  const activeNotes = notes.filter(n => n.noteType === 'note').length
  const pendingReminders = notes.filter(n => n.noteType === 'reminder').length + deadlines.filter(d => d.status !== 'concluido').length

  const allNotesAndDeadlines = [
    ...notes,
    ...deadlines.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category || 'pedagoga',
      noteType: 'reminder',
      author: d.author,
      reminderDate: d.date,
      reminderTime: d.time,
      reminderStatus: d.status === 'concluido' ? 'concluido' : 'agendado',
      createdAt: d.createdAt,
      isDeadline: true,
      priority: d.priority,
      status: d.status
    }))
  ]

  const todayStr = new Date().toISOString().split('T')[0]

  // Timeline helpers
  const getMonthLabel = (ym) => {
    const [y, m] = ym.split('-')
    const d = new Date(+y, +m - 1, 1)
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
  }
  const shiftMonth = (ym, delta) => {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  }
  const filterByMonth = (list, ym) => list.filter(n => {
    const created = (n.createdAt || '').slice(0, 7)
    return created === ym
  })
  const sortByTime = (list) => [...list].sort((a, b) => {
    const tA = a.reminderTime || new Date(a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const tB = b.reminderTime || new Date(b.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return tA.localeCompare(tB)
  })

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
            <button className="nt-new-btn" onClick={() => { setEditTarget(null); setForm({ title: '', description: '', category: 'pedagoga', noteType: 'note', reminderDate: '', reminderTime: '', reminderStatus: 'agendado' }); setShowModal(true) }}>
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
        {/* Custom Category Dropdown */}
        <div className="nt-custom-select-container">
          <button 
            className={`nt-filter-btn ${filterCategory ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsCategoryOpen(!isCategoryOpen)
              setIsTypeOpen(false)
            }}
          >
            <Filter size={14} />
            <span>
              {filterCategory === 'pedagoga' ? 'Pedagoga' : 
               filterCategory === 'psicologa' ? 'Psicóloga' : 'Todos os profissionais'}
            </span>
            <ChevronDown size={14} className={`nt-select-chevron ${isCategoryOpen ? 'open' : ''}`} />
          </button>
          
          {isCategoryOpen && (
            <div className="nt-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`nt-dropdown-option ${filterCategory === '' ? 'selected' : ''}`}
                onClick={() => { setFilterCategory(''); setIsCategoryOpen(false) }}
              >
                Todos os profissionais
              </div>
              <div 
                className={`nt-dropdown-option ${filterCategory === 'pedagoga' ? 'selected' : ''}`}
                onClick={() => { setFilterCategory('pedagoga'); setIsCategoryOpen(false) }}
              >
                <span className="nt-option-dot" style={{ background: '#a78bfa' }} />
                Pedagoga
              </div>
              <div 
                className={`nt-dropdown-option ${filterCategory === 'psicologa' ? 'selected' : ''}`}
                onClick={() => { setFilterCategory('psicologa'); setIsCategoryOpen(false) }}
              >
                <span className="nt-option-dot" style={{ background: '#34d399' }} />
                Psicóloga
              </div>
            </div>
          )}
        </div>

        {/* Custom Type Dropdown */}
        <div className="nt-custom-select-container">
          <button 
            className={`nt-filter-btn ${filterType ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsTypeOpen(!isTypeOpen)
              setIsCategoryOpen(false)
            }}
          >
            <StickyNote size={14} />
            <span>
              {filterType === 'note' ? 'Anotações' : 
               filterType === 'reminder' ? 'Lembretes' : 'Todos os tipos'}
            </span>
            <ChevronDown size={14} className={`nt-select-chevron ${isTypeOpen ? 'open' : ''}`} />
          </button>
          
          {isTypeOpen && (
            <div className="nt-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`nt-dropdown-option ${filterType === '' ? 'selected' : ''}`}
                onClick={() => { setFilterType(''); setIsTypeOpen(false) }}
              >
                Todos os tipos
              </div>
              <div 
                className={`nt-dropdown-option ${filterType === 'note' ? 'selected' : ''}`}
                onClick={() => { setFilterType('note'); setIsTypeOpen(false) }}
              >
                <span className="nt-option-dot" style={{ background: '#a78bfa' }} />
                Anotações
              </div>
              <div 
                className={`nt-dropdown-option ${filterType === 'reminder' ? 'selected' : ''}`}
                onClick={() => { setFilterType('reminder'); setIsTypeOpen(false) }}
              >
                <span className="nt-option-dot" style={{ background: '#fbbf24' }} />
                Lembretes
              </div>
            </div>
          )}
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
                    <div key={note.id} className="nt-note-card" style={{ animationDelay: `${i * 0.06}s`, cursor: 'pointer' }} onClick={() => setViewNote(note)}>
                      <div className="nt-card-top">
                        <div className="nt-card-icon" style={{ background: cat.bg, color: cat.color }}>
                          {note.category === 'psicologa' ? <Brain size={18} /> : <BookOpen size={18} />}
                        </div>
                        {canEdit && (
                          <button className="nt-pin-btn" onClick={(e) => { e.stopPropagation(); togglePin(note); }} title={note.isPinned ? 'Desafixar' : 'Fixar'}>
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
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {canEdit && (
                            <button
                              className="nt-card-edit"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(note)
                              }}
                              title="Editar"
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              className="nt-card-del"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(note)
                              }}
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
                    <div key={rem.id} className="nt-reminder-row" style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }} onClick={() => setViewNote(rem)}>
                      <div className="nt-reminder-dot" style={{ background: cat.color }} />
                      <div className="nt-reminder-info">
                        <span className="nt-reminder-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {rem.isDeadline && <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} title="Data Importante" />}
                          {rem.title}
                        </span>
                        <span className="nt-reminder-date">{rem.reminderDate ? formatDate(rem.reminderDate) : formatDate(rem.createdAt)}{rem.reminderTime ? ` • ${rem.reminderTime}` : ''}</span>
                      </div>
                      <div className="nt-reminder-badges">
                        <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                        <span className="nt-status-badge" style={{ background: st.bg, color: st.color }}>• {st.label}</span>
                      </div>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button
                            className="nt-reminder-edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(rem)
                            }}
                            title="Editar"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className="nt-reminder-del"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(rem)
                            }}
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Timeline */}
      {allNotesAndDeadlines.length > 0 && (() => {
        const getNoteDateStr = (n) => {
          if (n.noteType === 'reminder' && n.reminderDate) {
            return n.reminderDate
          }
          return new Date(n.createdAt).toISOString().split('T')[0]
        }
        const getTodayLocalStr = () => {
          const d = new Date()
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
        const todayStrLocal = getTodayLocalStr()
        const todayNotes = sortByTime(allNotesAndDeadlines.filter(n => getNoteDateStr(n) === todayStrLocal))

        return (
          <div className="nt-timeline-section">
            <div className="nt-tl-header">
              <h2>LINHA DO TEMPO DE ACOMPANHAMENTO (HOJE)</h2>
            </div>
            {todayNotes.length === 0 ? (
              <p className="nt-empty-hint" style={{ textAlign: 'center', padding: 20 }}>Nenhum acompanhamento ou lembrete para o dia de hoje.</p>
            ) : (
              <div className="nt-timeline-scroll">
                {todayNotes.map((note, i) => {
                  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
                  const time = note.reminderTime || new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={note.id} className="nt-timeline-card" style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer' }} onClick={() => setViewNote(note)}>
                      <div className="nt-tl-time"><span className="nt-tl-dot" style={{ background: cat.color }} />{time}</div>
                      <h4 className="nt-tl-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {note.isDeadline && <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} title="Data Importante" />}
                        {note.title}
                      </h4>
                      {note.description && <p className="nt-tl-desc">{note.description}</p>}
                      <div className="nt-tl-footer">
                        <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                        {canEdit && (
                          <button
                            className="nt-tl-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(note)
                            }}
                            title="Editar"
                            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af', borderRadius: '4px', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#a78bfa'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <button className="nt-timeline-view-all" onClick={() => {
              const d = new Date()
              setTlModalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
              setShowTimeline(true)
            }}>
              Ver toda a linha do tempo <ArrowRight size={14} />
            </button>
          </div>
        )
      })()}

      {/* New Note Modal */}
      {showModal && (
        <div className="nt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="nt-modal-accent" />
            <div className="nt-modal-head">
              <h3><StickyNote size={18} /> {editTarget ? 'Editar Registro' : 'Nova Anotação'}</h3>
              <button className="nt-modal-close" onClick={() => { setShowModal(false); setEditTarget(null) }}><X size={16} /></button>
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
                  <label>Profissional</label>
                  <div className="nt-form-select-container">
                    <button 
                      type="button"
                      className={`nt-form-select-btn ${isFormCategoryOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFormCategoryOpen(!isFormCategoryOpen)
                        setIsFormTypeOpen(false)
                        setIsFormStatusOpen(false)
                      }}
                    >
                      <span>{form.category === 'psicologa' ? 'Psicóloga' : 'Pedagoga'}</span>
                      <ChevronDown size={14} className={`nt-select-chevron ${isFormCategoryOpen ? 'open' : ''}`} />
                    </button>
                    {isFormCategoryOpen && (
                      <div className="nt-form-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={`nt-dropdown-option ${form.category === 'pedagoga' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, category: 'pedagoga' })); setIsFormCategoryOpen(false) }}
                        >
                          <span className="nt-option-dot" style={{ background: '#a78bfa' }} />
                          Pedagoga
                        </div>
                        <div 
                          className={`nt-dropdown-option ${form.category === 'psicologa' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, category: 'psicologa' })); setIsFormCategoryOpen(false) }}
                        >
                          <span className="nt-option-dot" style={{ background: '#34d399' }} />
                          Psicóloga
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="nt-form-group" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <div className="nt-form-select-container">
                    <button 
                      type="button"
                      className={`nt-form-select-btn ${isFormTypeOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFormTypeOpen(!isFormTypeOpen)
                        setIsFormCategoryOpen(false)
                        setIsFormStatusOpen(false)
                      }}
                    >
                      <span>{form.noteType === 'reminder' ? 'Lembrete' : 'Anotação'}</span>
                      <ChevronDown size={14} className={`nt-select-chevron ${isFormTypeOpen ? 'open' : ''}`} />
                    </button>
                    {isFormTypeOpen && (
                      <div className="nt-form-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className={`nt-dropdown-option ${form.noteType === 'note' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, noteType: 'note' })); setIsFormTypeOpen(false) }}
                        >
                          <span className="nt-option-dot" style={{ background: '#a78bfa' }} />
                          Anotação
                        </div>
                        <div 
                          className={`nt-dropdown-option ${form.noteType === 'reminder' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, noteType: 'reminder' })); setIsFormTypeOpen(false) }}
                        >
                          <span className="nt-option-dot" style={{ background: '#fbbf24' }} />
                          Lembrete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {form.noteType === 'reminder' && (
                <>
                  <div className="nt-form-row">
                    <div className="nt-form-group" style={{ flex: 1 }}>
                      <label>Data</label>
                      <input type="date" className="nt-input" min={todayStr} value={form.reminderDate} onChange={e => setForm(p => ({ ...p, reminderDate: e.target.value }))} />
                    </div>
                    <div className="nt-form-group" style={{ flex: 1 }}>
                      <label>Horário</label>
                      <input type="time" className="nt-input" value={form.reminderTime} onChange={e => setForm(p => ({ ...p, reminderTime: e.target.value }))} />
                    </div>
                  </div>
                  <div className="nt-form-group">
                    <label>Status</label>
                    <div className="nt-form-select-container">
                      <button 
                        type="button"
                        className={`nt-form-select-btn ${isFormStatusOpen ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsFormStatusOpen(!isFormStatusOpen)
                          setIsFormCategoryOpen(false)
                          setIsFormTypeOpen(false)
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>
                          {form.reminderStatus === 'em_andamento' ? 'Em andamento' : form.reminderStatus}
                        </span>
                        <ChevronDown size={14} className={`nt-select-chevron ${isFormStatusOpen ? 'open' : ''}`} />
                      </button>
                      {isFormStatusOpen && (
                        <div className="nt-form-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div 
                            className={`nt-dropdown-option ${form.reminderStatus === 'agendado' ? 'selected' : ''}`}
                            onClick={() => { setForm(p => ({ ...p, reminderStatus: 'agendado' })); setIsFormStatusOpen(false) }}
                          >
                            <span className="nt-option-dot" style={{ background: '#60a5fa' }} />
                            Agendado
                          </div>
                          <div 
                            className={`nt-dropdown-option ${form.reminderStatus === 'urgente' ? 'selected' : ''}`}
                            onClick={() => { setForm(p => ({ ...p, reminderStatus: 'urgente' })); setIsFormStatusOpen(false) }}
                          >
                            <span className="nt-option-dot" style={{ background: '#f87171' }} />
                            Urgente
                          </div>
                          <div 
                            className={`nt-dropdown-option ${form.reminderStatus === 'hoje' ? 'selected' : ''}`}
                            onClick={() => { setForm(p => ({ ...p, reminderStatus: 'hoje' })); setIsFormStatusOpen(false) }}
                          >
                            <span className="nt-option-dot" style={{ background: '#fbbf24' }} />
                            Hoje
                          </div>
                          <div 
                            className={`nt-dropdown-option ${form.reminderStatus === 'confirmado' ? 'selected' : ''}`}
                            onClick={() => { setForm(p => ({ ...p, reminderStatus: 'confirmado' })); setIsFormStatusOpen(false) }}
                          >
                            <span className="nt-option-dot" style={{ background: '#34d399' }} />
                            Confirmado
                          </div>
                        </div>
                      )}
                    </div>
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
          <div className="nt-modal-card" onClick={e => e.stopPropagation()}>
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
            <div className="nt-modal-card nt-modal-view-note" onClick={e => e.stopPropagation()}>
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
                    <span className="nt-detail-label">Profissional</span>
                    <span className="nt-cat-badge" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>{cat.label}</span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Autor</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>👤 {viewNote.author}</span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Tipo</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {viewNote.isDeadline ? (
                        <>
                          <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>Data Importante</span>
                        </>
                      ) : viewNote.noteType === 'reminder' ? (
                        <>🔔 Lembrete</>
                      ) : (
                        <>📝 Anotação</>
                      )}
                    </span>
                  </div>
                  <div className="nt-detail-info-item">
                    <span className="nt-detail-label">Criado em</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>📅 {formatDateTime(viewNote.createdAt)}</span>
                  </div>
                  {viewNote.noteType === 'reminder' && viewNote.reminderDate && (
                    <div className="nt-detail-info-item">
                      <span className="nt-detail-label">Data Limite</span>
                      <span style={{ color: '#fbbf24', fontSize: '0.8125rem', fontWeight: '600' }}>📅 {formatDate(viewNote.reminderDate)}{viewNote.reminderTime ? ` às ${viewNote.reminderTime}` : ''}</span>
                    </div>
                  )}
                  {viewNote.noteType === 'reminder' && viewNote.reminderStatus && (
                    <div className="nt-detail-info-item">
                      <span className="nt-detail-label">Status Lembrete</span>
                      <span style={{ color: '#e5e7eb', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                        • {viewNote.reminderStatus}
                      </span>
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="nt-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                      className="nt-btn-cancel"
                      onClick={() => {
                        setViewNote(null)
                        handleEditClick(viewNote)
                      }}
                      style={{
                        background: 'rgba(167, 139, 250, 0.1)',
                        color: '#a78bfa',
                        border: '1px solid rgba(167, 139, 250, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(167, 139, 250, 0.18)'
                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.2)'
                      }}
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button
                      className="nt-btn-danger"
                      onClick={() => {
                        setViewNote(null)
                        setDeleteTarget(viewNote)
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Full Timeline Modal */}
      {showTimeline && (() => {
        const modalNotes = sortByTime(filterByMonth(allNotesAndDeadlines, tlModalMonth))
        return (
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
                    <p className="nt-modal-head-sub">{modalNotes.length} registro{modalNotes.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button className="nt-modal-close" onClick={() => setShowTimeline(false)}><X size={16} /></button>
              </div>
              <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <button className="nt-tl-month-btn" onClick={() => setTlModalMonth(m => shiftMonth(m, -1))}><ChevronLeft size={16} /></button>
                <span className="nt-tl-month-label">{getMonthLabel(tlModalMonth)}</span>
                <button className="nt-tl-month-btn" onClick={() => setTlModalMonth(m => shiftMonth(m, 1))}><ChevronRight size={16} /></button>
              </div>
              <div className="nt-modal-body nt-timeline-modal-body">
                {modalNotes.length === 0 ? (
                  <p className="nt-empty-hint" style={{ textAlign: 'center', padding: 20 }}>Nenhum registro neste mês.</p>
                ) : modalNotes.map((note, i) => {
                  const cat = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.pedagoga
                  const time = note.reminderTime || new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={note.id} className="nt-tl-modal-row" style={{ cursor: 'pointer' }} onClick={() => { setShowTimeline(false); setViewNote(note) }}>
                      <div className="nt-tl-modal-line">
                        <span className="nt-tl-dot" style={{ background: cat.color }} />
                        {i < modalNotes.length - 1 && <div className="nt-tl-connector" />}
                      </div>
                      <div className="nt-tl-modal-content">
                        <div className="nt-tl-modal-time">{time} • {formatDate(note.createdAt)}</div>
                        <h4 className="nt-tl-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {note.isDeadline && <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} title="Data Importante" />}
                          {note.title}
                        </h4>
                        {note.description && <p className="nt-tl-desc">{note.description}</p>}
                        <div className="nt-tl-footer">
                          <span className="nt-cat-badge-sm" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>👤 {note.author}</span>
                            {canEdit && (
                              <button
                                className="nt-tl-edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowTimeline(false)
                                  handleEditClick(note)
                                }}
                                title="Editar"
                                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af', borderRadius: '4px', transition: 'all 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#a78bfa'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                              >
                                <Edit3 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
