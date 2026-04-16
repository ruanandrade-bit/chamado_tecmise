import { STATUSES, TICKETS } from '../data/mockData.js'

const state = {
  tickets: structuredClone(TICKETS),
  notifications: []
}

function nextTicketId() {
  const maxId = state.tickets.reduce((max, ticket) => {
    const numeric = Number.parseInt(ticket.id.split('-')[1], 10)
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, 0)

  return `S4S-${String(maxId + 1).padStart(3, '0')}`
}

function addHistory(ticket, action, by) {
  ticket.history = [...(ticket.history || []), { action, by, date: new Date().toISOString() }]
}

export const memoryStore = {
  getTickets(filters = {}) {
    const { status, responsible, searchTerm } = filters

    return state.tickets.filter((ticket) => {
      if (status && ticket.status !== status) return false
      if (responsible && ticket.responsible !== responsible) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          ticket.id.toLowerCase().includes(term)
          || ticket.school.toLowerCase().includes(term)
          || ticket.classroom.toLowerCase().includes(term)
        )
      }
      return true
    })
  },

  getTicketById(id) {
    return state.tickets.find((ticket) => ticket.id === id) || null
  },

  createTicket(payload, currentUser) {
    const id = nextTicketId()
    const ticket = {
      id,
      school: payload.school,
      classroom: payload.classroom,
      device: String(payload.device),
      period: payload.period || 'Matutino',
      problemType: payload.problemType || '',
      description: payload.description,
      responsible: currentUser.name,
      priority: payload.priority || 'media',
      status: 'sem-status',
      createdAt: new Date().toISOString(),
      attachments: payload.attachments || [],
      checklist: [],
      notes: '',
      history: [{ action: 'Criado', by: currentUser.name, date: new Date().toISOString() }]
    }

    state.tickets.unshift(ticket)

    memoryStore.pushNotification({
      title: '🆕 Novo Chamado',
      message: `${ticket.id} criado por ${currentUser.name}`,
      type: 'success',
      targetUserEmail: 'ruan@s4s.com'
    })

    return ticket
  },

  updateTicket(id, updates, by = 'Sistema') {
    const ticket = memoryStore.getTicketById(id)
    if (!ticket) return null

    Object.assign(ticket, updates)
    addHistory(ticket, 'Atualizado', by)
    return ticket
  },

  moveTicket(id, status, by = 'Sistema') {
    const ticket = memoryStore.getTicketById(id)
    if (!ticket) return null

    const actorName = typeof by === 'object' ? by.name : by
    const actorEmail = typeof by === 'object' ? by.email : null

    ticket.status = status
    const label = STATUSES.find((s) => s.value === status)?.label || status
    addHistory(ticket, `Movido para ${label}`, actorName || 'Sistema')

    if (status === 'resolvido') {
      memoryStore.pushNotification({
        title: '✅ Chamado Resolvido',
        message: `${ticket.id} foi movido para resolvido`,
        type: 'success',
        targetUserEmail: actorEmail || null
      })
    }

    return ticket
  },

  toggleChecklist(ticketId, itemId, completed) {
    const ticket = memoryStore.getTicketById(ticketId)
    if (!ticket) return null

    ticket.checklist = ticket.checklist.map((item) => (
      item.id === itemId ? { ...item, completed } : item
    ))

    return ticket
  },

  addChecklistItem(ticketId, title) {
    const ticket = memoryStore.getTicketById(ticketId)
    if (!ticket) return null

    const nextId = Math.max(0, ...ticket.checklist.map((item) => item.id)) + 1
    const item = { id: nextId, title, completed: false }
    ticket.checklist = [...ticket.checklist, item]

    return ticket
  },

  deleteTicket(id) {
    const index = state.tickets.findIndex((ticket) => ticket.id === id)
    if (index === -1) return false
    state.tickets.splice(index, 1)
    return true
  },

  getStats() {
    const total = state.tickets.length
    const resolved = state.tickets.filter((t) => t.status === 'resolvido').length
    const inProgress = state.tickets.filter((t) => (
      t.status !== 'sem-status' && t.status !== 'resolvido' && t.status !== 'recebido'
    )).length

    return {
      total,
      resolved,
      inProgress,
      pending: total - resolved - inProgress,
      byResponsible: state.tickets.reduce((acc, ticket) => {
        acc[ticket.responsible] = (acc[ticket.responsible] || 0) + 1
        return acc
      }, {})
    }
  },

  getGroupedByStatus(filters = {}) {
    const grouped = Object.fromEntries(STATUSES.map((status) => [status.value, []]))

    memoryStore.getTickets(filters).forEach((ticket) => {
      if (grouped[ticket.status]) grouped[ticket.status].push(ticket)
    })

    return grouped
  },

  pushNotification(notification) {
    state.notifications.push({
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...notification
    })
  },

  consumeNotifications(userEmail) {
    const visible = []
    const remaining = []

    state.notifications.forEach((note) => {
      const isForUser = !note.targetUserEmail || note.targetUserEmail === userEmail
      if (isForUser) visible.push(note)
      else remaining.push(note)
    })

    state.notifications = remaining
    return visible
  },

  statuses: STATUSES
}
