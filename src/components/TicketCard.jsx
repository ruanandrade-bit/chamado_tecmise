import { memo } from 'react'
import './TicketCard.css'
import { Paperclip, Archive, Flame, Gauge, Leaf } from 'lucide-react'

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', icon: Flame, tone: 'high' },
  media: { label: 'Média', icon: Gauge, tone: 'medium' },
  baixa: { label: 'Baixa', icon: Leaf, tone: 'low' }
}

export default memo(function TicketCard({
  ticket,
  onClick,
  draggable,
  showArchiveAction = false,
  onArchive
}) {
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.media
  const PriorityIcon = priorityConfig.icon
  const enterDelay = `${(Number.parseInt(String(ticket.id).replace(/\D/g, ''), 10) || 0) % 8 * 20}ms`

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('ticketId', ticket.id)
      }}
      className="tk-card-wrapper"
      style={{ cursor: draggable ? 'grab' : 'pointer', '--tk-enter-delay': enterDelay }}
    >
      {/* Header with code and priority */}
      <div className="tk-card-header">
        <div className="tk-card-title-area">
          <h3 className="tk-card-id">{ticket.id}</h3>
          <p className="tk-card-school">{ticket.school}</p>
        </div>
        <div className={`tk-priority-badge tk-priority-${priorityConfig.tone}`}>
          <span className="tk-priority-icon-wrap">
            <PriorityIcon size={12} />
          </span>
          <span className="tk-priority-label">{priorityConfig.label}</span>
        </div>
      </div>

      {/* Turma and responsible */}
      <div className="tk-card-meta">
        <p className="tk-card-meta-line">
          <span className="tk-card-meta-icon">📚</span> {ticket.classroom} • {ticket.period}
        </p>
        <p className="tk-card-meta-line">
          <span className="tk-card-meta-icon">👤</span> {ticket.responsible}
        </p>
      </div>

      {/* Description */}
      <p className="tk-card-desc">{ticket.description}</p>

      {/* Footer with attachments and date */}
      <div className="tk-card-footer">
        {ticket.attachments.length > 0 && (
          <div className="tk-card-attach">
            <Paperclip size={14} />
            <span>({ticket.attachments.length})</span>
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
            className="tk-card-action-btn tk-card-action-archive"
            title="Arquivar chamado"
          >
            <Archive size={13} />
            Arquivar
          </button>
        )}

        {ticket.archived && ticket.resolvedAt ? (
          <div className="tk-card-footer-dates">
            <p className="tk-card-date">
              Aberto em {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
            <p className="tk-card-date">
              Resolvido em {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR', {
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        ) : (
          <p className="tk-card-date tk-card-date-right">
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
              month: 'short',
              day: 'numeric'
            })}
          </p>
        )}
      </div>
    </div>
  )
})
