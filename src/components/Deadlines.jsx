import { useState, useEffect, useRef } from 'react'
import { Calendar, Plus, Trash2, CalendarDays, Clock, CheckCircle2, AlertTriangle, AlertCircle, Search, Filter, Loader2, ShieldCheck, X, Edit3, ChevronRight, Tag, ChevronDown, ExternalLink, UserPlus, Check } from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Deadlines.css'

const generateGoogleCalendarUrl = (item) => {
  const title = encodeURIComponent(item.title)
  const description = encodeURIComponent(item.description || '')
  const formattedDate = String(item.date).replace(/-/g, '')
  
  let datesParam = ''
  if (item.time) {
    const timeClean = String(item.time).replace(/:/g, '')
    const startHour = parseInt(timeClean.substring(0, 2), 10)
    const startMinute = parseInt(timeClean.substring(2, 4), 10)
    
    let endHour = startHour + 1
    let endDayOffset = 0
    if (endHour >= 24) {
      endHour = endHour - 24
      endDayOffset = 1
    }
    
    const pad = (n) => String(n).padStart(2, '0')
    const startTimeStr = `${pad(startHour)}${pad(startMinute)}00`
    const endTimeStr = `${pad(endHour)}${pad(startMinute)}00`
    
    if (endDayOffset === 0) {
      datesParam = `${formattedDate}T${startTimeStr}/${formattedDate}T${endTimeStr}`
    } else {
      const dateObj = new Date(item.date + 'T00:00:00')
      dateObj.setDate(dateObj.getDate() + 1)
      const nextDayStr = dateObj.toISOString().split('T')[0].replace(/-/g, '')
      datesParam = `${formattedDate}T${startTimeStr}/${nextDayStr}T${endTimeStr}`
    }
  } else {
    const dateObj = new Date(item.date + 'T00:00:00')
    dateObj.setDate(dateObj.getDate() + 1)
    const nextDayStr = dateObj.toISOString().split('T')[0].replace(/-/g, '')
    datesParam = `${formattedDate}/${nextDayStr}`
  }
  
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&dates=${datesParam}`
  if (item.companyEmail) {
    const emails = String(item.companyEmail).split(',').map(e => e.trim()).filter(Boolean)
    emails.forEach(email => {
      url += `&add=${encodeURIComponent(email)}`
    })
  }
  return url
}

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
  const currentUserName = String(user?.name || '').trim().toLowerCase()
  const currentUserEmail = String(user?.email || '').trim().toLowerCase()

  const isCreatedByCurrentUser = (item) => {
    if (!item) return false
    if (item.authorEmail) return String(item.authorEmail).trim().toLowerCase() === currentUserEmail
    return String(item.author || '').trim().toLowerCase() === currentUserName
  }

  const [deadlines, setDeadlines] = useState([])
  const [notes, setNotes] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewDeadline, setViewDeadline] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAuthor, setFilterAuthor] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isAuthorOpen, setIsAuthorOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isFormPriorityOpen, setIsFormPriorityOpen] = useState(false)
  const [isFormStatusOpen, setIsFormStatusOpen] = useState(false)

  // Form state
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const guestDropdownRef = useRef(null)

  // Google Calendar states
  const [wantGoogleCalendar, setWantGoogleCalendar] = useState(false)
  const [googleCalendarOpened, setGoogleCalendarOpened] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState('')
  const [showCalendarConfirm, setShowCalendarConfirm] = useState(false)
  const [pendingSaveData, setPendingSaveData] = useState(null)
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false)

  useEffect(() => { loadDeadlines() }, [])

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsAuthorOpen(false)
      setIsPriorityOpen(false)
      setIsStatusOpen(false)
      setIsFormPriorityOpen(false)
      setIsFormStatusOpen(false)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  useEffect(() => {
    const handleGuestOutsideClick = (event) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setIsGuestDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleGuestOutsideClick, true)
    return () => document.removeEventListener('mousedown', handleGuestOutsideClick, true)
  }, [])

  const loadDeadlines = async () => {
    setIsLoading(true)
    try {
      const [deadlinesData, notesData, profsData] = await Promise.all([
        api.get('/deadlines'),
        api.get('/notes'),
        api.get('/professionals').catch(() => ({ professionals: [] }))
      ])
      setDeadlines(deadlinesData || [])
      setNotes(notesData || [])
      setProfessionals(profsData?.professionals || [])
    } catch (e) { console.error('Error fetching deadlines:', e) }
    finally { setIsLoading(false) }
  }

  const resetCalendarStates = () => {
    setWantGoogleCalendar(false)
    setGoogleCalendarOpened(false)
    setSelectedGuest('')
    setShowCalendarConfirm(false)
    setPendingSaveData(null)
    setIsGuestDropdownOpen(false)
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setEditTarget(null)
    setForm({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
    setFormError('')
    resetCalendarStates()
  }

  // Professionals that have a companyEmail (for guest selection)
  const guestProfessionals = professionals.filter(p =>
    p.companyEmail &&
    String(p.name || '').trim().toLowerCase() !== String(user?.name || '').trim().toLowerCase()
  )

  const selectedGuestList = selectedGuest ? selectedGuest.split(',').filter(Boolean) : []

  const toggleGuest = (email) => {
    let list = selectedGuest ? selectedGuest.split(',').filter(Boolean) : []
    if (list.includes(email)) {
      list = list.filter(e => e !== email)
    } else {
      list.push(email)
    }
    setSelectedGuest(list.join(','))
  }

  const doSaveDeadline = async (calendarConfirmed = false) => {
    setIsSaving(true)
    try {
      const payload = { ...form }
      if (calendarConfirmed) {
        payload.googleCalendarConfirmed = true
        payload.googleCalendarUser = user?.name || ''
        payload.googleCalendarGuest = selectedGuest || ''
      } else {
        payload.googleCalendarConfirmed = false
        payload.googleCalendarUser = ''
        payload.googleCalendarGuest = ''
      }

      if (editTarget) {
        if (editTarget.isReminder) {
          const noteForm = {
            title: form.title,
            description: form.description,
            category: editTarget.category || 'pedagoga',
            noteType: 'reminder',
            reminderDate: form.date,
            reminderTime: form.time,
            reminderStatus: form.status === 'concluido' ? 'concluido' : 'agendado'
          }
          const updated = await api.put(`/notes/${editTarget.id}`, noteForm)
          setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        } else {
          const updated = await api.put(`/deadlines/${editTarget.id}`, payload)
          setDeadlines(prev => prev.map(d => d.id === updated.id ? updated : d))
        }
        setEditTarget(null)
      } else {
        const newDeadline = await api.post('/deadlines', payload)
        setDeadlines(prev => [newDeadline, ...prev])
      }

      setForm({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
      setIsFormPriorityOpen(false)
      setIsFormStatusOpen(false)
      setShowAddModal(false)
      resetCalendarStates()
    } catch (err) { setFormError(err.message || 'Falha ao salvar.') }
    finally { setIsSaving(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) return setFormError('Título é obrigatório.')
    if (!form.date) return setFormError('Data é obrigatória.')
    const todayCheck = new Date().toISOString().split('T')[0]
    if (!editTarget && form.date < todayCheck) return setFormError('Não é permitido cadastrar prazos com data no passado.')

    // Google Calendar validation
    if (wantGoogleCalendar && !googleCalendarOpened) {
      return setFormError('Você marcou "Agendar no Google Agenda" mas ainda não abriu a agenda. Clique no botão para abrir primeiro.')
    }

    // If calendar was used, show confirmation modal instead of saving directly
    if (wantGoogleCalendar && googleCalendarOpened) {
      setPendingSaveData({ date: form.date, time: form.time })
      setShowCalendarConfirm(true)
      return
    }

    // Normal save without calendar
    await doSaveDeadline(false)
  }

  const handleCalendarConfirm = async (confirmed) => {
    setShowCalendarConfirm(false)
    await doSaveDeadline(confirmed)
  }

  const handleEditClick = (d) => {
    if (d.status === 'concluido') return
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
    // Load existing calendar state for editing
    setWantGoogleCalendar(!!d.googleCalendarConfirmed)
    setGoogleCalendarOpened(!!d.googleCalendarConfirmed)
    setSelectedGuest(d.googleCalendarGuest || '')
    setIsFormPriorityOpen(false)
    setIsFormStatusOpen(false)
    setShowAddModal(true)
  }

  const handleDelete = async (id) => {
    try {
      const target = allDeadlinesAndReminders.find(d => d.id === id)
      if (!isCreatedByCurrentUser(target)) {
        alert('Apenas o criador pode excluir este item.')
        return
      }

      if (String(id).startsWith('AN-')) {
        await api.delete(`/notes/${id}`)
        setNotes(prev => prev.filter(n => n.id !== id))
      } else {
        await api.delete(`/deadlines/${id}`)
        setDeadlines(prev => prev.filter(d => d.id !== id))
      }
      setDeleteTarget(null)
    } catch (e) { alert('Falha ao deletar.') }
  }

  const toggleStatus = async (d) => {
    if (!canEdit) return
    if (d.status === 'concluido') return
    try {
      if (String(d.id).startsWith('AN-')) {
        const newStatus = d.status === 'concluido' ? 'agendado' : 'concluido'
        const updated = await api.put(`/notes/${d.id}`, { reminderStatus: newStatus })
        setNotes(prev => prev.map(item => item.id === updated.id ? updated : item))
      } else {
        const nextStatusMap = {
          pendente: 'em_andamento',
          em_andamento: 'concluido',
          concluido: 'pendente'
        }
        const nextStatus = nextStatusMap[d.status || 'pendente']
        const updated = await api.put(`/deadlines/${d.id}`, { status: nextStatus })
        setDeadlines(prev => prev.map(item => item.id === updated.id ? updated : item))
      }
    } catch (e) { console.error('Error changing status:', e) }
  }

  // Derived filter
  const mappedReminders = notes
    .filter(n => n.noteType === 'reminder')
    .map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      date: n.reminderDate || n.createdAt.split('T')[0],
      time: n.reminderTime || '00:00',
      category: n.category || 'pedagoga',
      status: n.reminderStatus === 'concluido' ? 'concluido' : 'pendente',
      priority: 'media',
      author: n.author,
      authorEmail: n.authorEmail,
      createdAt: n.createdAt,
      isReminder: true
    }))

  const allDeadlinesAndReminders = [...deadlines, ...mappedReminders]

  const filtered = allDeadlinesAndReminders.filter(d => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
    const matchAuthor = !filterAuthor || d.author === filterAuthor
    const matchPriority = !filterPriority || d.priority === filterPriority
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchAuthor && matchPriority && matchStatus
  })

  // Sort deadlines: concluidos at the bottom, others sorted by date (closer first)
  const sortedDeadlines = [...filtered].sort((a, b) => {
    if (a.status === 'concluido' && b.status !== 'concluido') return 1
    if (a.status !== 'concluido' && b.status === 'concluido') return -1
    return new Date(a.date) - new Date(b.date)
  })

  // Stats
  const total = allDeadlinesAndReminders.length
  const pending = allDeadlinesAndReminders.filter(d => d.status !== 'concluido').length
  const completed = allDeadlinesAndReminders.filter(d => d.status === 'concluido').length
  const urgent = allDeadlinesAndReminders.filter(d => d.status !== 'concluido' && d.priority === 'alta').length

  const uniqueAuthors = Array.from(new Set(allDeadlinesAndReminders.map(d => d.author).filter(Boolean)))

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
            <button className="dl-new-btn" onClick={() => {
              setEditTarget(null)
              setForm({ title: '', description: '', date: '', time: '', category: 'pedagoga', priority: 'media', status: 'pendente' })
              setFormError('')
              resetCalendarStates()
              setIsFormPriorityOpen(false)
              setIsFormStatusOpen(false)
              setShowAddModal(true)
            }}>
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
        {/* Custom Author / Responsible Dropdown */}
        <div className="dl-custom-select-container">
          <button 
            className={`dl-filter-btn ${filterAuthor ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsAuthorOpen(!isAuthorOpen)
              setIsPriorityOpen(false)
              setIsStatusOpen(false)
            }}
          >
            <Filter size={14} />
            <span>
              {filterAuthor ? `Responsável: ${filterAuthor}` : 'Todos responsáveis'}
            </span>
            <ChevronDown size={14} className={`dl-select-chevron ${isAuthorOpen ? 'open' : ''}`} />
          </button>
          
          {isAuthorOpen && (
            <div className="dl-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`dl-dropdown-option ${filterAuthor === '' ? 'selected' : ''}`}
                onClick={() => { setFilterAuthor(''); setIsAuthorOpen(false) }}
              >
                Todos responsáveis
              </div>
              {uniqueAuthors.map(authorName => (
                <div 
                  key={authorName}
                  className={`dl-dropdown-option ${filterAuthor === authorName ? 'selected' : ''}`}
                  onClick={() => { setFilterAuthor(authorName); setIsAuthorOpen(false) }}
                >
                  <span className="dl-option-dot" style={{ background: '#a78bfa' }} />
                  {authorName}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Priority Dropdown */}
        <div className="dl-custom-select-container">
          <button 
            className={`dl-filter-btn ${filterPriority ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsPriorityOpen(!isPriorityOpen)
              setIsCategoryOpen(false)
              setIsStatusOpen(false)
            }}
          >
            <Tag size={14} />
            <span>
              {filterPriority === 'alta' ? 'Alta' : 
               filterPriority === 'media' ? 'Média' : 
               filterPriority === 'baixa' ? 'Baixa' : 'Todas prioridades'}
            </span>
            <ChevronDown size={14} className={`dl-select-chevron ${isPriorityOpen ? 'open' : ''}`} />
          </button>
          
          {isPriorityOpen && (
            <div className="dl-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`dl-dropdown-option ${filterPriority === '' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority(''); setIsPriorityOpen(false) }}
              >
                Todas prioridades
              </div>
              <div 
                className={`dl-dropdown-option ${filterPriority === 'alta' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('alta'); setIsPriorityOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#f87171' }} />
                Alta
              </div>
              <div 
                className={`dl-dropdown-option ${filterPriority === 'media' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('media'); setIsPriorityOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#fbbf24' }} />
                Média
              </div>
              <div 
                className={`dl-dropdown-option ${filterPriority === 'baixa' ? 'selected' : ''}`}
                onClick={() => { setFilterPriority('baixa'); setIsPriorityOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#9ca3af' }} />
                Baixa
              </div>
            </div>
          )}
        </div>

        {/* Custom Status Dropdown */}
        <div className="dl-custom-select-container">
          <button 
            className={`dl-filter-btn ${filterStatus ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsStatusOpen(!isStatusOpen)
              setIsCategoryOpen(false)
              setIsPriorityOpen(false)
            }}
          >
            <CheckCircle2 size={14} />
            <span>
              {filterStatus === 'pendente' ? 'Pendente' : 
               filterStatus === 'em_andamento' ? 'Em Andamento' : 
               filterStatus === 'concluido' ? 'Concluído' : 'Todos status'}
            </span>
            <ChevronDown size={14} className={`dl-select-chevron ${isStatusOpen ? 'open' : ''}`} />
          </button>
          
          {isStatusOpen && (
            <div className="dl-custom-dropdown" onClick={(e) => e.stopPropagation()}>
              <div 
                className={`dl-dropdown-option ${filterStatus === '' ? 'selected' : ''}`}
                onClick={() => { setFilterStatus(''); setIsStatusOpen(false) }}
              >
                Todos status
              </div>
              <div 
                className={`dl-dropdown-option ${filterStatus === 'pendente' ? 'selected' : ''}`}
                onClick={() => { setFilterStatus('pendente'); setIsStatusOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#f87171' }} />
                Pendente
              </div>
              <div 
                className={`dl-dropdown-option ${filterStatus === 'em_andamento' ? 'selected' : ''}`}
                onClick={() => { setFilterStatus('em_andamento'); setIsStatusOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#fbbf24' }} />
                Em Andamento
              </div>
              <div 
                className={`dl-dropdown-option ${filterStatus === 'concluido' ? 'selected' : ''}`}
                onClick={() => { setFilterStatus('concluido'); setIsStatusOpen(false) }}
              >
                <span className="dl-option-dot" style={{ background: '#34d399' }} />
                Concluído
              </div>
            </div>
          )}
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
            const prio = PRIORITY_CONFIG[dl.priority] || PRIORITY_CONFIG.media
            const st = STATUS_CONFIG[dl.status] || STATUS_CONFIG.pendente
            const overdue = isOverdue(dl.date, dl.status)
            const canModifyDeadline = canEdit && dl.status !== 'concluido'

            return (
              <div key={dl.id} className={`dl-row-card ${dl.status === 'concluido' ? 'dl-completed-card' : ''}`} style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setViewDeadline(dl)}>
                {/* Status Toggle Box */}
                <div className="dl-status-box" onClick={(e) => { e.stopPropagation(); if (canModifyDeadline) toggleStatus(dl) }} title={canModifyDeadline ? "Alterar status" : ""}>
                  {dl.status === 'concluido' ? (
                    <CheckCircle2 size={22} className="dl-status-check-active" />
                  ) : (
                    <div className={`dl-status-ring ring-${dl.status}`} />
                  )}
                </div>

                <div className="dl-main-info">
                  <div className="dl-title-row">
                    <span className="dl-title-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!dl.isReminder && <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} title="Data Importante" />}
                      {dl.title}
                    </span>
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
                  <span className="dl-tag-badge" style={{ background: 'rgba(167, 139, 250, 0.08)', color: '#a78bfa', borderColor: 'rgba(167, 139, 250, 0.15)' }}>👤 {dl.author}</span>
                  <span className="dl-tag-badge" style={{ background: prio.bg, color: prio.color, borderColor: prio.border }}>{prio.label}</span>
                  <span className="dl-tag-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  {dl.googleCalendarConfirmed && (
                    <span className="dl-tag-badge" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
                      📅 {dl.googleCalendarUser || dl.author} agendou
                    </span>
                  )}
                </div>

                {((dl.status !== 'concluido' && canEdit) || isCreatedByCurrentUser(dl)) && (
                  <div className="dl-actions-group" onClick={e => e.stopPropagation()}>
                    {dl.status !== 'concluido' && canEdit && (
                      <button className="dl-action-btn" onClick={() => handleEditClick(dl)} title="Editar prazo"><Edit3 size={14} /></button>
                    )}
                    {isCreatedByCurrentUser(dl) && (
                      <button className="dl-action-btn dl-btn-del" onClick={() => setDeleteTarget(dl)} title="Excluir prazo"><Trash2 size={14} /></button>
                    )}
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
        <div className="dl-modal-overlay" onClick={handleCloseAddModal}>
          <div className="dl-modal-card dl-modal-deadline-form" onClick={e => e.stopPropagation()}>
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
              <button className="dl-modal-close" onClick={handleCloseAddModal}><X size={16} /></button>
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
                  <label>Data *</label>
                  <input
                    type="date"
                    className="dl-input"
                    min={editTarget ? undefined : new Date().toISOString().split('T')[0]}
                    max="9999-12-31"
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
                  />
                </div>
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Horário</label>
                  <input type="time" className="dl-input" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="dl-form-row">
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Responsável</label>
                  <input
                    type="text"
                    className="dl-input"
                    value={editTarget ? editTarget.author : (user?.name || '')}
                    disabled
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: '#9ca3af',
                      cursor: 'not-allowed',
                      borderColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                  />
                </div>
                <div className="dl-form-group" style={{ flex: 1 }}>
                  <label>Prioridade</label>
                  <div className="dl-form-select-container">
                    <button
                      type="button"
                      className={`dl-form-select-btn ${isFormPriorityOpen ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsFormPriorityOpen(!isFormPriorityOpen)
                        setIsFormStatusOpen(false)
                      }}
                    >
                      <span>
                        {form.priority === 'alta' ? 'Alta' :
                         form.priority === 'media' ? 'Média' : 'Baixa'}
                      </span>
                      <ChevronDown size={14} className={`dl-select-chevron ${isFormPriorityOpen ? 'open' : ''}`} />
                    </button>
                    {isFormPriorityOpen && (
                      <div className="dl-form-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div
                          className={`dl-form-option ${form.priority === 'alta' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'alta' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="dl-option-dot" style={{ background: '#f87171' }} />
                          Alta
                        </div>
                        <div
                          className={`dl-form-option ${form.priority === 'media' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'media' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="dl-option-dot" style={{ background: '#fbbf24' }} />
                          Média
                        </div>
                        <div
                          className={`dl-form-option ${form.priority === 'baixa' ? 'selected' : ''}`}
                          onClick={() => { setForm(p => ({ ...p, priority: 'baixa' })); setIsFormPriorityOpen(false) }}
                        >
                          <span className="dl-option-dot" style={{ background: '#9ca3af' }} />
                          Baixa
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="dl-form-group">
                <label>Status</label>
                <div className="dl-form-select-container">
                  <button
                    type="button"
                    className={`dl-form-select-btn ${isFormStatusOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFormStatusOpen(!isFormStatusOpen)
                      setIsFormCategoryOpen(false)
                      setIsFormPriorityOpen(false)
                    }}
                  >
                    <span>
                      {form.status === 'pendente' ? 'Pendente' :
                       form.status === 'em_andamento' ? 'Em Andamento' : 'Concluído'}
                    </span>
                    <ChevronDown size={14} className={`dl-select-chevron ${isFormStatusOpen ? 'open' : ''}`} />
                  </button>
                  {isFormStatusOpen && (
                    <div className="dl-form-dropdown up" onClick={(e) => e.stopPropagation()}>
                      <div
                        className={`dl-form-option ${form.status === 'pendente' ? 'selected' : ''}`}
                        onClick={() => { setForm(p => ({ ...p, status: 'pendente' })); setIsFormStatusOpen(false) }}
                      >
                        <span className="dl-option-dot" style={{ background: '#f87171' }} />
                        Pendente
                      </div>
                      <div
                        className={`dl-form-option ${form.status === 'em_andamento' ? 'selected' : ''}`}
                        onClick={() => { setForm(p => ({ ...p, status: 'em_andamento' })); setIsFormStatusOpen(false) }}
                      >
                        <span className="dl-option-dot" style={{ background: '#fbbf24' }} />
                        Em Andamento
                      </div>
                      <div
                        className={`dl-form-option ${form.status === 'concluido' ? 'selected' : ''}`}
                        onClick={() => { setForm(p => ({ ...p, status: 'concluido' })); setIsFormStatusOpen(false) }}
                      >
                        <span className="dl-option-dot" style={{ background: '#34d399' }} />
                        Concluído
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Calendar Section */}
              {!editTarget?.isReminder && (
                <div style={{
                  padding: '14px',
                  background: wantGoogleCalendar ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${wantGoogleCalendar ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                  borderRadius: '14px',
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} style={{ color: wantGoogleCalendar ? '#fbbf24' : '#6b7280' }} />
                      <span style={{ color: wantGoogleCalendar ? '#fbbf24' : '#9ca3af', fontSize: '0.8125rem', fontWeight: 600 }}>
                        Agendar no Google Agenda
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (wantGoogleCalendar) { resetCalendarStates() }
                        else { setWantGoogleCalendar(true) }
                      }}
                      style={{
                        width: '40px', height: '22px',
                        borderRadius: '11px',
                        border: 'none',
                        background: wantGoogleCalendar
                          ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                          : 'rgba(255, 255, 255, 0.1)',
                        cursor: (!form.date || !form.time) ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                        opacity: (!form.date || !form.time) ? 0.4 : 1
                      }}
                      disabled={!form.date || !form.time}
                      title={(!form.date || !form.time) ? 'Preencha data e hora primeiro' : ''}
                    >
                      <div style={{
                        width: '16px', height: '16px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '3px',
                        left: wantGoogleCalendar ? '21px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }} />
                    </button>
                  </div>

                  {(!form.date || !form.time) && (
                    <p style={{ color: '#6b7280', fontSize: '0.7rem', margin: 0, fontStyle: 'italic' }}>
                      Preencha a data e o horário para habilitar o Google Agenda
                    </p>
                  )}

                  {wantGoogleCalendar && form.date && form.time && (
                    <>
                      {/* Show existing calendar status when editing */}
                      {editTarget?.googleCalendarConfirmed && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px',
                          background: 'rgba(52, 211, 153, 0.08)',
                          border: '1px solid rgba(52, 211, 153, 0.2)',
                          borderRadius: '10px'
                        }}>
                          <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                          <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                            {editTarget.googleCalendarUser || 'Usuário'} já agendou no Google Agenda
                          </span>
                        </div>
                      )}

                      {/* Guest selection */}
                      {guestProfessionals.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserPlus size={12} /> Convidar profissional (opcional)
                          </label>
                          <div className="dl-form-select-container dl-guest-select-container" ref={guestDropdownRef}>
                            <button
                              type="button"
                              className={`dl-form-select-btn ${isGuestDropdownOpen ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsGuestDropdownOpen(!isGuestDropdownOpen)
                              }}
                              style={{ fontSize: '0.8125rem', padding: '6px 12px', minHeight: '38px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                            >
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', textAlign: 'left' }}>
                                {selectedGuestList.length === 0 ? (
                                  <span style={{ color: '#6b7280' }}>Nenhum convidado</span>
                                ) : (
                                  selectedGuestList.map(email => {
                                    const prof = guestProfessionals.find(p => p.companyEmail === email)
                                    return (
                                      <span
                                        key={email}
                                        style={{
                                          background: 'rgba(251, 191, 36, 0.15)',
                                          color: '#fbbf24',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          border: '1px solid rgba(251, 191, 36, 0.25)'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleGuest(email)
                                        }}
                                      >
                                        {prof ? prof.name : email}
                                        <X size={10} style={{ cursor: 'pointer', opacity: 0.8 }} />
                                      </span>
                                    )
                                  })
                                )}
                              </div>
                              <ChevronDown size={14} className={`dl-select-chevron ${isGuestDropdownOpen ? 'open' : ''}`} />
                            </button>
                            {isGuestDropdownOpen && (
                              <div className="dl-form-dropdown dl-guest-dropdown" onClick={(e) => e.stopPropagation()}>
                                <div
                                  className="dl-form-option"
                                  onClick={() => setSelectedGuest('')}
                                  style={{ color: '#ef4444', fontWeight: '500' }}
                                >
                                  Limpar todos
                                </div>
                                {guestProfessionals.map(p => {
                                  const isSelected = selectedGuestList.includes(p.companyEmail)
                                  return (
                                    <div
                                      key={p.id}
                                      className={`dl-form-option ${isSelected ? 'selected' : ''}`}
                                      onClick={() => toggleGuest(p.companyEmail)}
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <span>{p.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{p.companyEmail}</span>
                                      </div>
                                      {isSelected && <Check size={14} style={{ color: '#fbbf24' }} />}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Open Google Calendar button */}
                      {(() => {
                        const loggedInProfessional = professionals.find(p =>
                          String(p.name || '').trim().toLowerCase() === String(user?.name || '').trim().toLowerCase() ||
                          String(p.email || '').trim().toLowerCase() === String(user?.email || '').trim().toLowerCase()
                        )
                        const emails = [loggedInProfessional?.companyEmail, selectedGuest].filter(Boolean).join(',')
                        const calUrl = generateGoogleCalendarUrl({
                          title: form.title || 'Novo Prazo',
                          description: form.description || '',
                          date: form.date,
                          time: form.time,
                          companyEmail: emails
                        })
                        return (
                          <a
                            href={calUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setGoogleCalendarOpened(true)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              padding: '10px 16px',
                              background: googleCalendarOpened
                                ? 'rgba(52, 211, 153, 0.12)'
                                : 'linear-gradient(135deg, #fbbf24, #d97706)',
                              color: googleCalendarOpened ? '#34d399' : '#000',
                              border: googleCalendarOpened ? '1px solid rgba(52, 211, 153, 0.3)' : 'none',
                              borderRadius: '12px',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {googleCalendarOpened ? (
                              <><CheckCircle2 size={15} /> Agenda aberta — clique novamente se precisar</>
                            ) : (
                              <><ExternalLink size={15} /> Abrir Google Agenda</>
                            )}
                          </a>
                        )
                      })()}

                      {googleCalendarOpened && (
                        <p style={{ color: '#9ca3af', fontSize: '0.7rem', margin: 0, textAlign: 'center' }}>
                          Após confirmar no Google Agenda, clique em "Salvar Prazo" abaixo
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <button type="submit" className="dl-submit-btn" disabled={isSaving}>
                {isSaving ? <><Loader2 size={16} className="dl-spinner" /> Salvando...</> : <><Plus size={16} /> Salvar Prazo</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Google Calendar Confirmation Modal */}
      {showCalendarConfirm && pendingSaveData && (
        <div className="dl-modal-overlay" onClick={() => setShowCalendarConfirm(false)}>
          <div className="dl-modal-card dl-modal-sm" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="dl-modal-accent" style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)' }} />
            <div className="dl-modal-head">
              <div className="dl-modal-head-left">
                <div className="dl-modal-head-icon" style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3>Confirmar Agendamento</h3>
                  <p className="dl-modal-head-sub">Google Agenda</p>
                </div>
              </div>
              <button className="dl-modal-close" onClick={() => setShowCalendarConfirm(false)}><X size={16} /></button>
            </div>
            <div className="dl-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Tem certeza que você já confirmou no <strong style={{ color: '#fbbf24' }}>Google Agenda</strong> para o dia <strong style={{ color: '#f1f5f9' }}>{formatDateDisplay(pendingSaveData.date)}</strong> às <strong style={{ color: '#f1f5f9' }}>{pendingSaveData.time}</strong>?
              </p>
              {selectedGuest && (
                <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>
                  Convites enviados para:{' '}
                  <strong style={{ color: '#a78bfa' }}>
                    {selectedGuest
                      .split(',')
                      .map(email => guestProfessionals.find(p => p.companyEmail === email)?.name || email)
                      .join(', ')}
                  </strong>
                </p>
              )}
              <div className="dl-modal-actions" style={{ marginTop: '6px', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCalendarConfirm(true)}
                  disabled={isSaving}
                  style={{
                    width: '100%', padding: '11px 16px',
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                    color: '#000', fontWeight: 700, fontSize: '0.8125rem',
                    border: 'none', borderRadius: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <CheckCircle2 size={15} /> Sim, confirmei no Google Agenda
                </button>
                <button
                  type="button"
                  className="dl-btn-cancel"
                  onClick={() => handleCalendarConfirm(false)}
                  disabled={isSaving}
                  style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
                >
                  Não confirmei, salvar sem agenda
                </button>
              </div>
            </div>
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
        const prio = PRIORITY_CONFIG[viewDeadline.priority] || PRIORITY_CONFIG.media
        const st = STATUS_CONFIG[viewDeadline.status] || STATUS_CONFIG.pendente
        return (
          <div className="dl-modal-overlay" onClick={() => setViewDeadline(null)}>
            <div className="dl-modal-card" onClick={e => e.stopPropagation()}>
              <div className="dl-modal-accent" />
              <div className="dl-modal-head">
                <div className="dl-modal-head-left">
                  <div className="dl-modal-head-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h3>{viewDeadline.title}</h3>
                    <p className="dl-modal-head-sub">Responsável: {viewDeadline.author}</p>
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
                    <span className="dl-detail-label">Tipo</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {!viewDeadline.isReminder ? (
                        <>
                          <CalendarDays size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>Data Importante</span>
                        </>
                      ) : (
                        <>🔔 Lembrete</>
                      )}
                    </span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Data</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>📅 {formatDateDisplay(viewDeadline.date)} {viewDeadline.time && ` às ${viewDeadline.time}`}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Responsável</span>
                    <span style={{ color: '#e5e7eb', fontSize: '0.8125rem' }}>👤 {viewDeadline.author}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Prioridade</span>
                    <span className="dl-tag-badge" style={{ background: prio.bg, color: prio.color, borderColor: prio.border, alignSelf: 'flex-start' }}>{prio.label}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Status</span>
                    <span className="dl-tag-badge" style={{ background: st.bg, color: st.color, alignSelf: 'flex-start' }}>{st.label}</span>
                  </div>
                  <div className="dl-detail-info-item">
                    <span className="dl-detail-label">Google Agenda</span>
                    {viewDeadline.googleCalendarConfirmed ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#34d399', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> Confirmado por {viewDeadline.googleCalendarUser || viewDeadline.author}
                        </span>
                        {viewDeadline.googleCalendarGuest && (
                          <span style={{ color: '#a78bfa', fontSize: '0.75rem' }}>
                            Convidados:{' '}
                            {viewDeadline.googleCalendarGuest
                              .split(',')
                              .map(email => professionals.find(p => p.companyEmail === email)?.name || email)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>❌ Não agendado</span>
                    )}
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
