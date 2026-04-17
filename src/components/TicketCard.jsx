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
      className="tk-card-wrapper"
      style={{ cursor: draggable ? 'grab' : 'pointer' }}
    >
      {/* Header with code and priority */}
      <div className="tk-card-header">
        <div className="tk-card-title-area">
          <h3 className="tk-card-id">{ticket.id}</h3>
          <p className="tk-card-school">{ticket.school}</p>
        </div>
        <div className={`badge-status ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border} border flex-shrink-0`}>
          {ticket.priority === 'high' ? '⚡' : ticket.priority === 'medium' ? '→' : '○'} {priorityConfig.label}
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
        <div className="tk-card-footer-left">
          {ticket.attachments.length > 0 && (
            <div className="tk-card-attach">
              <Paperclip size={14} />
              <span>{ticket.attachments.length}</span>
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
          {showDeleteAction && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete?.(ticket)
              }}
              className="tk-card-action-btn tk-card-action-delete"
              title="Excluir chamado"
            >
              <Trash2 size={13} />
              Excluir
            </button>
          )}
        </div>
        
        {ticket.archived && ticket.resolvedAt ? (
          <div style={{ textAlign: 'right' }}>
            <p className="tk-card-date">
              Resolvido em {new Date(ticket.resolvedAt).toLocaleDateString('pt-BR', { 
                month: 'short', 
                day: 'numeric'
              })}
            </p>
            {(() => {
              const daysLeft = Math.max(0, 14 - Math.floor((Date.now() - new Date(ticket.resolvedAt).getTime()) / (1000 * 60 * 60 * 24)))
              return (
                <p className={`tk-card-days-left ${daysLeft <= 3 ? 'tk-days-danger' : daysLeft <= 7 ? 'tk-days-warn' : ''}`}>
                  {daysLeft === 0 ? 'Será excluído em breve' : `${daysLeft}d restantes`}
                </p>
              )
            })()}
          </div>
        ) : (
          <p className="tk-card-date">
            {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { 
              month: 'short', 
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      <style>{`
        .tk-card-wrapper {
          position: relative;
          background: rgba(15, 15, 30, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .tk-card-wrapper:hover {
          border-color: rgba(134, 239, 172, 0.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 20px rgba(34, 197, 94, 0.05);
          transform: translateY(-2px);
        }

        .tk-card-wrapper:active {
          cursor: grabbing;
        }

        .tk-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 8px;
        }

        .tk-card-title-area {
          flex: 1;
          min-width: 0;
        }

        .tk-card-id {
          font-weight: 700;
          font-size: 0.875rem;
          color: #86efac;
          transition: color 0.2s;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tk-card-wrapper:hover .tk-card-id {
          color: #22c55e;
        }

        .tk-card-school {
          font-size: 0.75rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tk-card-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .tk-card-meta-line {
          font-size: 0.75rem;
          color: #d1d5db;
        }

        .tk-card-meta-icon {
          color: #6b7280;
        }

        .tk-card-desc {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .tk-card-wrapper:hover .tk-card-desc {
          -webkit-line-clamp: 3;
        }

        .tk-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .tk-card-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tk-card-attach {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #6b7280;
          font-size: 0.75rem;
          transition: color 0.2s;
        }

        .tk-card-wrapper:hover .tk-card-attach {
          color: #86efac;
        }

        .tk-card-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tk-card-action-archive {
          background: rgba(255, 255, 255, 0.04);
          color: #9ca3af;
        }

        .tk-card-action-archive:hover {
          background: rgba(134, 239, 172, 0.1);
          color: #86efac;
        }

        .tk-card-action-delete {
          background: rgba(239, 68, 68, 0.08);
          color: #fca5a5;
        }

        .tk-card-action-delete:hover {
          background: rgba(239, 68, 68, 0.18);
          color: #f87171;
        }

        .tk-card-date {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .tk-card-days-left {
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 2px;
          color: #6b7280;
        }

        .tk-days-danger { color: #f87171; }
        .tk-days-warn { color: #fbbf24; }
      `}</style>
    </div>
  )
}
