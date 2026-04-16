import { create } from 'zustand'
import { api } from '../services/api'

const STATUS_ORDER = {
  'sem-status': 0,
  'recebido': 1,
  'em-analise': 2,
  'aguardando-escola': 3,
  'reprocessando': 4,
  'em-resolucao': 5,
  'resolvido': 6
}

const FALLBACK_STATUSES = [
  { value: 'sem-status', label: 'Sem status', color: 'bg-dark-500' },
  { value: 'recebido', label: 'Recebido', color: 'bg-blue-500' },
  { value: 'em-analise', label: 'Em análise', color: 'bg-yellow-500' },
  { value: 'aguardando-escola', label: 'Aguardando escola', color: 'bg-purple-500' },
  { value: 'reprocessando', label: 'Reprocessando', color: 'bg-indigo-500' },
  { value: 'em-resolucao', label: 'Em resolução', color: 'bg-orange-500' },
  { value: 'resolvido', label: 'Resolvido', color: 'bg-primary-light' }
]

function sortByStatusAndDate(tickets) {
  return [...tickets].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 999) - (STATUS_ORDER[b.status] ?? 999)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

export const useTicketsStore = create((set, get) => ({
  tickets: [],
  selectedTicket: null,
  isLoadingTickets: false,
  filters: {
    status: null,
    responsible: null,
    searchTerm: ''
  },

  STATUSES: FALLBACK_STATUSES,
  STATUS_ORDER,

  loadStatuses: async () => {
    try {
      const { statuses } = await api.get('/tickets/statuses')
      if (Array.isArray(statuses) && statuses.length > 0) {
        set({ STATUSES: statuses })
      }
    } catch {
      set({ STATUSES: FALLBACK_STATUSES })
    }
  },

  loadTickets: async () => {
    set({ isLoadingTickets: true })
    try {
      const { tickets } = await api.get('/tickets')
      const normalized = Array.isArray(tickets) ? sortByStatusAndDate(tickets) : []
      set({ tickets: normalized })
    } finally {
      set({ isLoadingTickets: false })
    }
  },

  bootstrap: async () => {
    await Promise.all([get().loadStatuses(), get().loadTickets()])
  },

  getFilteredTickets: () => {
    const { tickets, filters } = get()
    return tickets.filter((ticket) => {
      if (ticket.archived) return false
      if (filters.status && ticket.status !== filters.status) return false
      if (filters.responsible && ticket.responsible !== filters.responsible) return false
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        return (
          ticket.id.toLowerCase().includes(term)
          || ticket.school.toLowerCase().includes(term)
          || ticket.classroom.toLowerCase().includes(term)
          || String(ticket.device || '').toLowerCase().includes(term)
        )
      }
      return true
    })
  },

  getTicketsByStatus: () => {
    const { STATUSES } = get()
    const grouped = Object.fromEntries(STATUSES.map((status) => [status.value, []]))
    get().getFilteredTickets().forEach((ticket) => {
      if (grouped[ticket.status]) grouped[ticket.status].push(ticket)
    })
    return grouped
  },

  getArchivedTickets: () => {
    const { tickets } = get()
    return tickets
      .filter((ticket) => ticket.archived)
      .sort((a, b) => new Date(b.archivedAt || b.createdAt) - new Date(a.archivedAt || a.createdAt))
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }))
  },

  clearFilters: () => {
    set({ filters: { status: null, responsible: null, searchTerm: '' } })
  },

  updateTicket: async (id, updates) => {
    const { ticket } = await api.patch(`/tickets/${id}`, updates)
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === id ? ticket : item)),
      selectedTicket: state.selectedTicket?.id === id ? ticket : state.selectedTicket
    }))
    return ticket
  },

  moveTicket: async (id, newStatus) => {
    const { ticket } = await api.post(`/tickets/${id}/move`, { status: newStatus })
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === id ? ticket : item)),
      selectedTicket: state.selectedTicket?.id === id ? ticket : state.selectedTicket
    }))
    return ticket
  },

  archiveTicket: async (id) => {
    const { ticket } = await api.patch(`/tickets/${id}`, {
      archived: true,
      archivedAt: new Date().toISOString()
    })

    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === id ? ticket : item)),
      selectedTicket: state.selectedTicket?.id === id ? ticket : state.selectedTicket
    }))

    return ticket
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`)
    set((state) => ({
      tickets: state.tickets.filter((item) => item.id !== id),
      selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket
    }))
  },

  addTicket: async (newTicket) => {
    const { ticket } = await api.post('/tickets', newTicket)
    set((state) => ({ tickets: [ticket, ...state.tickets] }))
    return ticket
  },

  setSelectedTicket: (ticket) => {
    set({ selectedTicket: ticket })
  },

  updateChecklistItem: async (ticketId, itemId, completed) => {
    const { ticket } = await api.patch(`/tickets/${ticketId}/checklist/${itemId}`, { completed })
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === ticketId ? ticket : item)),
      selectedTicket: state.selectedTicket?.id === ticketId ? ticket : state.selectedTicket
    }))
    return ticket
  },

  addChecklistItem: async (ticketId, title) => {
    const { ticket } = await api.post(`/tickets/${ticketId}/checklist`, { title })
    set((state) => ({
      tickets: state.tickets.map((item) => (item.id === ticketId ? ticket : item)),
      selectedTicket: state.selectedTicket?.id === ticketId ? ticket : state.selectedTicket
    }))
    return ticket
  },

  getTicketProgress: (ticket) => {
    if (!ticket?.checklist || ticket.checklist.length === 0) return 0
    const completed = ticket.checklist.filter((item) => item.completed).length
    return Math.round((completed / ticket.checklist.length) * 100)
  },

  getStatistics: () => {
    const { tickets } = get()
    const activeTickets = tickets.filter((ticket) => !ticket.archived)
    const total = activeTickets.length
    const completed = activeTickets.filter((item) => item.status === 'resolvido').length
    const inProgress = activeTickets.filter((item) => (
      item.status !== 'sem-status' && item.status !== 'resolvido'
    )).length

    return {
      total,
      completed,
      inProgress,
      byResponsible: activeTickets.reduce((acc, ticket) => {
        acc[ticket.responsible] = (acc[ticket.responsible] || 0) + 1
        return acc
      }, {})
    }
  }
}))
