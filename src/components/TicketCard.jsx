import { Paperclip, Archive, Trash2 } from 'lucide-react'

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  media: { label: 'Média', bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  baixa: { label: 'Baixa', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' }
}

export default function TicketCard({
  ticket,
  onClick,
  draggable,
  showArchiveAction = false,
  onArchive,
  showDeleteAction = false,
  onDelete
}) {
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('ticketId', ticket.id)
      }}
      className={`
        card-base group
        bg-dark-750 border-dark-600 hover:border-primary-light/50
        transition-all duration-300 mb-3
        ${draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-primary-light/20' : 'cursor-pointer'}
      `}
    >
      {/* Header with code and priority */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-primary-light text-sm group-hover:text-primary transition-colors truncate">
            {ticket.id}
          </h3>
          <p className="text-xs text-dark-400 truncate">{ticket.school}</p>
        </div>
        <div className={`badge-status ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border} border flex-shrink-0`}>
          {ticket.priority === 'high' ? '⚡' : ticket.priority === 'medium' ? '→' : '○'} {priorityConfig.label}
        </div>
      </div>

      {/* Turma and responsible */}
      <div className="space-y-1 mb-3">
        <p className="text-xs text-dark-300">
          <span className="text-dark-500">📚</span> {ticket.classroom} • {ticket.period}
        </p>
        <p className="text-xs text-dark-300">
          <span className="text-dark-500">👤</span> {ticket.responsible}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-dark-300 mb-3 line-clamp-2 group-hover:line-clamp-3 transition-all">
        {ticket.description}
      </p>


      {/* Footer with attachments and date */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-600">
        <div className="flex items-center gap-2">
          {ticket.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-dark-400 hover:text-primary-light transition-colors">
              <Paperclip size={14} />
              <span className="text-xs">{ticket.attachments.length}</span>
            </div>
          )}
          {showArchiveAction && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onArchive?.(ticket)
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-primary-light transition-colors"
              title="Arquivar chamado"
            >
              <Archive size={13} />
              Arquivar
            </button>
          )}
          {showDeleteAction && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete?.(ticket)
              }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
              title="Excluir chamado"
            >
              <Trash2 size={13} />
              Excluir
            </button>
          )}
        </div>
        
        <p className="text-xs text-dark-500">
          {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { 
            month: 'short', 
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  )
}
