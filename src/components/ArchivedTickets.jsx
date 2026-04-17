import { useState } from 'react'
import { Archive, Trash2, AlertTriangle, X } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import TicketDetailsModal from './TicketDetailsModal'

export default function ArchivedTickets() {
  const { getArchivedTickets, deleteTicket } = useTicketsStore()
  const { user } = useAuthStore()
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketToDelete, setTicketToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const archivedTickets = getArchivedTickets()
  const selectedTicket = archivedTickets.find((ticket) => ticket.id === selectedTicketId) || null
  const canDeleteTicket = user?.canDragDrop === true

  const handleDeleteRequest = (ticket) => {
    setTicketToDelete(ticket)
  }

  const handleConfirmDelete = async () => {
    if (!ticketToDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteTicket(ticketToDelete.id)
      if (selectedTicketId === ticketToDelete.id) {
        setSelectedTicketId(null)
      }
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o chamado.')
    } finally {
      setIsDeleting(false)
      setTicketToDelete(null)
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
              onDelete={handleDeleteRequest}
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

      {/* Delete confirmation modal */}
      {ticketToDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4"
          onClick={() => !isDeleting && setTicketToDelete(null)}
        >
          <div
            className="bg-dark-800 border border-dark-600 rounded-2xl max-w-sm w-full animate-slideInUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with warning icon */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-dark-100 text-center">Excluir chamado</h3>
              <p className="text-sm text-dark-400 text-center mt-2">
                Tem certeza que deseja excluir o chamado{' '}
                <span className="font-semibold text-primary-light">{ticketToDelete.id}</span>?
              </p>
              <p className="text-xs text-dark-500 text-center mt-2">
                Essa ação não pode ser desfeita.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-2">
              <button
                onClick={() => setTicketToDelete(null)}
                disabled={isDeleting}
                className="btn-secondary flex-1 py-2.5 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
