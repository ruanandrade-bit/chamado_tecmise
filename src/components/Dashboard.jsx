import { useState } from 'react'
import { Cog, Clock, AlertCircle, ChevronDown, ChevronRight, School, Tag } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'

export default function Dashboard() {
  const { tickets, getStatistics } = useTicketsStore()
  const stats = getStatistics()
  const [expandedPerson, setExpandedPerson] = useState(null)

  // Get active (non-archived) tickets for a specific person
  const getTicketsForPerson = (name) => {
    return tickets.filter(t => !t.archived && t.responsible === name && t.status !== 'resolvido')
  }

  const statCards = [
    {
      label: 'Total de Chamados',
      value: stats.total,
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.08) 100%)',
      border: 'rgba(59,130,246,0.25)',
      iconColor: '#60a5fa',
      glowColor: 'rgba(59,130,246,0.1)',
    },
    {
      label: 'Em Andamento',
      value: stats.inProgress,
      icon: Clock,
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)',
      border: 'rgba(249,115,22,0.25)',
      iconColor: '#fb923c',
      glowColor: 'rgba(249,115,22,0.1)',
    },
    {
      label: 'Processamento',
      value: stats.processing,
      icon: Cog,
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.08) 100%)',
      border: 'rgba(139,92,246,0.25)',
      iconColor: '#c4b5fd',
      glowColor: 'rgba(139,92,246,0.1)',
    }
  ]

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-page-header">
        <h1 className="dash-page-title">Dashboard</h1>
        <p className="dash-page-subtitle">Visão geral do sistema de atendimento</p>
      </div>

      {/* Statistics cards */}
      <div className="dash-stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="dash-stat-card"
              style={{
                background: card.gradient,
                borderColor: card.border,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="dash-stat-card-inner">
                <div>
                  <p className="dash-stat-label">{card.label}</p>
                  <p className="dash-stat-value">{card.value}</p>
                </div>
                <div
                  className="dash-stat-icon-wrapper"
                  style={{
                    background: `linear-gradient(135deg, ${card.glowColor}, transparent)`,
                    border: `1px solid ${card.border}`,
                  }}
                >
                  <Icon size={24} style={{ color: card.iconColor }} />
                </div>
              </div>
              {/* Bottom glow line */}
              <div
                className="dash-stat-glow-line"
                style={{ background: `linear-gradient(90deg, transparent, ${card.iconColor}, transparent)` }}
              />
            </div>
          )
        })}
      </div>

      {/* Responsáveis section */}
      <div className="dash-section-card">
        <h2 className="dash-section-title">
          <span className="dash-section-accent" />
          Chamados por Responsável
        </h2>
        
        <div className="dash-resp-list">
          {Object.entries(stats.byResponsible).map(([name, count], index) => (
            <button
              key={name}
              className="dash-resp-item"
              onClick={() => setExpandedPerson(name)}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="dash-resp-left">
                <div className="dash-resp-avatar">
                  <span>{name[0]}</span>
                </div>
                <div>
                  <p className="dash-resp-name">{name}</p>
                  <p className="dash-resp-count-text">{count} chamado{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="dash-resp-right-side">
                <div className="dash-resp-badge"><span>{count}</span></div>
                <ChevronRight size={16} style={{color:'#6b7280'}} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de chamados da pessoa */}
      {expandedPerson && (() => {
        const personTickets = getTicketsForPerson(expandedPerson)
        const priorityMap = { alta: { label: 'Alta', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }, media: { label: 'Média', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' }, baixa: { label: 'Baixa', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' } }
        return (
          <div className="dash-modal-overlay" onClick={() => setExpandedPerson(null)}>
            <div className="dash-modal-card" onClick={e => e.stopPropagation()}>
              <div className="dash-modal-accent" />
              <div className="dash-modal-header">
                <div className="dash-modal-avatar"><span>{expandedPerson[0]}</span></div>
                <div>
                  <h3 className="dash-modal-title">Chamados de {expandedPerson}</h3>
                  <p className="dash-modal-sub">{personTickets.length} chamado{personTickets.length !== 1 ? 's' : ''} em aberto</p>
                </div>
                <button className="dash-modal-close" onClick={() => setExpandedPerson(null)}>✕</button>
              </div>
              <div className="dash-modal-body">
                {personTickets.length === 0 ? (
                  <p className="dash-no-tickets">Nenhum chamado em aberto.</p>
                ) : (
                  personTickets.map(t => {
                    const pr = priorityMap[t.priority] || priorityMap.media
                    return (
                      <div key={t.id} className="dash-ticket-card">
                        <div className="dash-ticket-top-row">
                          <span className="dash-ticket-id">{t.id}</span>
                          <span className="dash-ticket-status">{t.status.replace(/-/g, ' ')}</span>
                        </div>
                        <p className="dash-ticket-desc">{t.description || 'Sem descrição'}</p>
                        <div className="dash-ticket-footer">
                          <span className="dash-ticket-priority" style={{color: pr.color, background: pr.bg, borderColor: pr.border}}>
                            {pr.label}
                          </span>
                          <span className="dash-ticket-date">
                            {new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        .dash-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: dashFadeIn 0.5s ease-out;
        }

        @keyframes dashFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Page Header ── */
        .dash-page-header {
          margin-bottom: 4px;
        }

        .dash-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .dash-page-subtitle {
          color: #9ca3af;
          font-size: 0.9375rem;
        }

        /* ── Stats Grid ── */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        @media (min-width: 640px) {
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .dash-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ── Stat Card ── */
        .dash-stat-card {
          position: relative;
          border: 1px solid;
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: dashCardIn 0.5s ease-out both;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .dash-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        @keyframes dashCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dash-stat-card-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .dash-stat-label {
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .dash-stat-value {
          font-size: 2.25rem;
          font-weight: 800;
          color: #f3f4f6;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .dash-stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .dash-stat-card:hover .dash-stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .dash-stat-glow-line {
          position: absolute;
          bottom: 0;
          left: 20%;
          right: 20%;
          height: 1px;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .dash-stat-card:hover .dash-stat-glow-line {
          opacity: 1;
          left: 10%;
          right: 10%;
        }

        /* ── Section Card (Responsáveis) ── */
        .dash-section-card {
          position: relative;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          padding: 28px;
          box-shadow:
            0 4px 20px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: dashCardIn 0.5s ease-out 0.3s both;
        }

        .dash-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dash-section-accent {
          width: 4px;
          height: 24px;
          background: linear-gradient(180deg, #86efac, #22c55e);
          border-radius: 99px;
          flex-shrink: 0;
        }

        /* ── Responsible List ── */
        .dash-resp-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dash-resp-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          transition: all 0.3s ease;
          animation: dashItemIn 0.4s ease-out both;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
          text-align: left;
        }

        .dash-resp-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(134, 239, 172, 0.15);
          transform: translateX(4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        @keyframes dashItemIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .dash-resp-left { display: flex; align-items: center; gap: 14px; }
        .dash-resp-right-side { display: flex; align-items: center; gap: 10px; }

        .dash-resp-avatar {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(134,239,172,0.2), rgba(34,197,94,0.15));
          border: 1px solid rgba(134,239,172,0.2);
          transition: all 0.3s ease;
        }
        .dash-resp-item:hover .dash-resp-avatar {
          background: linear-gradient(135deg, rgba(134,239,172,0.3), rgba(34,197,94,0.25));
          box-shadow: 0 0 16px rgba(34,197,94,0.15);
        }
        .dash-resp-avatar span { font-size: 0.9375rem; font-weight: 700; color: #86efac; }
        .dash-resp-name { font-weight: 600; color: #e5e7eb; font-size: 0.9375rem; }
        .dash-resp-count-text { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }

        .dash-resp-badge {
          display: flex; align-items: center; justify-content: center;
          min-width: 36px; height: 36px; padding: 0 12px;
          background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.15));
          border: 1px solid rgba(34,197,94,0.25); border-radius: 12px;
          transition: all 0.3s ease;
        }
        .dash-resp-item:hover .dash-resp-badge {
          background: linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.25));
          box-shadow: 0 0 12px rgba(34,197,94,0.15);
        }
        .dash-resp-badge span { font-size: 0.875rem; font-weight: 700; color: #86efac; }

        /* ── Modal ── */
        .dash-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.65); backdrop-filter: blur(8px);
          animation: dashFadeIn 0.15s ease-out;
        }
        .dash-modal-card {
          width: 100%; max-width: 560px; max-height: 80vh; margin: 0 16px;
          border-radius: 20px; overflow: hidden;
          background: linear-gradient(145deg, rgba(30,35,50,0.97), rgba(18,22,34,0.99));
          border: 1px solid rgba(134,239,172,0.15);
          box-shadow: 0 25px 80px rgba(0,0,0,0.6);
          display: flex; flex-direction: column;
          animation: dashSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes dashSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dash-modal-accent {
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(34,197,94,0.5), rgba(134,239,172,0.7), rgba(34,197,94,0.5), transparent);
        }
        .dash-modal-header {
          display: flex; align-items: center; gap: 14px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dash-modal-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(134,239,172,0.2), rgba(34,197,94,0.15));
          border: 1px solid rgba(134,239,172,0.2); flex-shrink: 0;
        }
        .dash-modal-avatar span { font-size: 1rem; font-weight: 700; color: #86efac; }
        .dash-modal-title { font-size: 1.0625rem; font-weight: 700; color: #f1f5f9; }
        .dash-modal-sub { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
        .dash-modal-close {
          margin-left: auto; width: 32px; height: 32px; border-radius: 8px;
          border: none; background: rgba(255,255,255,0.04); color: #6b7280;
          cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .dash-modal-close:hover { background: rgba(239,68,68,0.1); color: #f87171; }
        .dash-modal-body {
          padding: 16px 24px 24px;
          overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
        }
        .dash-no-tickets {
          font-size: 0.8125rem; color: #6b7280; text-align: center; padding: 24px;
        }

        /* ── Ticket Cards ── */
        .dash-ticket-card {
          padding: 14px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
        }
        .dash-ticket-card:hover {
          background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1);
        }
        .dash-ticket-top-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
        }
        .dash-ticket-id {
          font-size: 0.875rem; font-weight: 700; color: #60a5fa;
          font-family: 'JetBrains Mono', monospace;
        }
        .dash-ticket-status {
          font-size: 0.6875rem; font-weight: 600; padding: 3px 10px;
          border-radius: 6px; background: rgba(139,92,246,0.1);
          color: #c4b5fd; border: 1px solid rgba(139,92,246,0.15);
          text-transform: capitalize;
        }
        .dash-ticket-desc {
          font-size: 0.8125rem; color: #d1d5db; line-height: 1.5;
          margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .dash-ticket-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
        }
        .dash-ticket-priority {
          font-size: 0.6875rem; font-weight: 600; padding: 3px 10px;
          border-radius: 6px; border: 1px solid;
        }
        .dash-ticket-date {
          font-size: 0.6875rem; color: #6b7280;
        }
      `}</style>
    </div>
  )
}
