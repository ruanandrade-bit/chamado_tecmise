import { useState } from 'react'
import { Archive } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import TicketDetailsModal from './TicketDetailsModal'

export default function ArchivedTickets() {
  const { getArchivedTickets, deleteTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const archivedTickets = getArchivedTickets()
  const selectedTicket = archivedTickets.find((ticket) => ticket.id === selectedTicketId) || null
  const canDeleteTicket = user?.canDragDrop === true

  const handleDeleteTicket = async (ticket) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o chamado ${ticket.id}?`)
    if (!confirmed) return

    try {
      await deleteTicket(ticket.id)
      if (selectedTicketId === ticket.id) {
        setSelectedTicketId(null)
      }
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o chamado.')
    }
  }

  return (
    <div className="space-y-6 animate-slideInUp">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-light/20 flex items-center justify-center">
          <Archive size={20} className="text-primary-light" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-dark-100">Chamados Resolvidos</h1>
          <p className="text-dark-400">Chamados arquivados após resolução</p>
        </div>
      </div>

      {archivedTickets.length === 0 ? (
        <div className="card-base text-center py-16">
          <p className="text-dark-400">Nenhum chamado arquivado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {archivedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicketId(ticket.id)}
              draggable={false}
              showDeleteAction={canDeleteTicket}
              onDelete={handleDeleteTicket}
            />
          ))}
        </div>
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  )
}
