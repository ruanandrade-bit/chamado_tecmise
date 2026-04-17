import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import { useAuthStore } from '../stores/authStore'
import TicketCard from './TicketCard'
import CreateTicketModal from './CreateTicketModal'
import TicketDetailsModal from './TicketDetailsModal'

export default function Kanban() {
  const { tickets, getTicketsByStatus, moveTicket, archiveTicket, STATUSES } = useTicketsStore()
  const { user } = useAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const ticketsByStatus = getTicketsByStatus()
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null
  const canDragDrop = user?.canDragDrop

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, statusValue) => {
    if (!canDragDrop) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const ticketId = e.dataTransfer.getData('ticketId')
    if (ticketId) {
      moveTicket(ticketId, statusValue).catch((error) => {
        alert(error.message || 'Não foi possível mover o chamado.')
      })
    }
  }

  const handleTicketClick = (ticket) => {
    setSelectedTicketId(ticket.id)
  }

  const handleArchiveTicket = async (ticket) => {
    try {
      await archiveTicket(ticket.id)
    } catch (error) {
      alert(error.message || 'Não foi possível arquivar o chamado.')
    }
  }

  return (
    <div className="space-y-6 animate-slideInUp">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-100 mb-1">Kanban Board</h1>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> Novo Chamado
        </button>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 h-[calc(100vh-200px)]">
        <div className="flex gap-6 min-w-min h-full">
          {STATUSES.map(status => (
            <div
              key={status.value}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.value)}
              className={`flex-shrink-0 w-72 bg-dark-800 border border-dark-700 rounded-2xl p-4 flex flex-col transition-colors duration-300 ${
                canDragDrop ? 'hover:border-primary-light/30' : ''
              }`}
            >
              {/* Column header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-dark-100 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                    {status.label}
                  </h2>
                  <span className="px-2 py-1 bg-dark-700 rounded text-xs font-semibold text-primary-light">
                    {ticketsByStatus[status.value].length}
                  </span>
                </div>
                <div className="h-1 bg-gradient-to-r from-dark-600 to-transparent rounded-full"></div>
              </div>

              {/* Cards container */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {ticketsByStatus[status.value].length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-dark-500 text-sm">Nenhum chamado neste status</p>
                  </div>
                ) : (
                  ticketsByStatus[status.value].map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      draggable={canDragDrop}
                    >
                      <TicketCard
                        ticket={ticket}
                        onClick={() => handleTicketClick(ticket)}
                        draggable={true}
                        showArchiveAction={status.value === 'resolvido' && canDragDrop}
                        onArchive={handleArchiveTicket}
                      />
                    </div>
                  ))
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTicketModal onClose={() => setIsCreateModalOpen(false)} />
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
