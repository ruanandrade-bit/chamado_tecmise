import { Paperclip, Archive, Flame, Gauge, Leaf } from 'lucide-react'

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', icon: Flame, tone: 'high' },
  media: { label: 'Média', icon: Gauge, tone: 'medium' },
  baixa: { label: 'Baixa', icon: Leaf, tone: 'low' }
}

export default function TicketCard({
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
          <p className="tk-card-date" style={{ marginLeft: 'auto' }}>
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
          animation: tkCardIn 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--tk-enter-delay, 0ms);
        }

        .tk-card-wrapper:hover {
          border-color: rgba(134, 239, 172, 0.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 20px rgba(34, 197, 94, 0.05);
          transform: translateY(-2px);
        }

        .tk-card-wrapper:active {
          cursor: grabbing;
        }

        .tk-priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 6px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          flex-shrink: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .tk-card-wrapper:hover .tk-priority-badge {
          transform: translateY(-1px);
        }

        .tk-priority-icon-wrap {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          flex-shrink: 0;
        }

        .tk-priority-label {
          line-height: 1;
        }

        .tk-priority-high {
          color: #fda4af;
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.16), rgba(190, 24, 93, 0.12));
          border-color: rgba(244, 63, 94, 0.35);
          box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.09) inset;
        }

        .tk-priority-high .tk-priority-icon-wrap {
          color: #fda4af;
          background: rgba(244, 63, 94, 0.14);
          border-color: rgba(244, 63, 94, 0.35);
        }

        .tk-priority-medium {
          color: #fcd34d;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.16), rgba(202, 138, 4, 0.12));
          border-color: rgba(234, 179, 8, 0.35);
          box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.08) inset;
        }

        .tk-priority-medium .tk-priority-icon-wrap {
          color: #fcd34d;
          background: rgba(234, 179, 8, 0.12);
          border-color: rgba(234, 179, 8, 0.32);
        }

        .tk-priority-low {
          color: #93c5fd;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1));
          border-color: rgba(59, 130, 246, 0.32);
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.08) inset;
        }

        .tk-priority-low .tk-priority-icon-wrap {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
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
          flex-wrap: wrap;
          gap: 8px;
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

        .tk-card-footer-dates {
          display: flex;
          justify-content: space-between;
          flex: 1;
        }

        .tk-card-date {
          font-size: 0.75rem;
          color: #6b7280;
        }

        @keyframes tkCardIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tk-card-wrapper {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
