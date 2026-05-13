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
      value: stats.inProgress,
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
          {Object.entries(stats.byResponsible).map(([name, count], index) => {
            const isOpen = expandedPerson === name
            const personTickets = isOpen ? getTicketsForPerson(name) : []
            return (
              <div key={name} style={{ animationDelay: `${index * 0.08}s` }} className="dash-resp-wrapper">
                <button
                  className={`dash-resp-item ${isOpen ? 'dash-resp-active' : ''}`}
                  onClick={() => setExpandedPerson(isOpen ? null : name)}
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
                    {isOpen ? <ChevronDown size={16} style={{color:'#6b7280'}} /> : <ChevronRight size={16} style={{color:'#6b7280'}} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="dash-person-tickets">
                    {personTickets.length === 0 ? (
                      <p className="dash-no-tickets">Nenhum chamado em aberto.</p>
                    ) : (
                      personTickets.map(t => (
                        <div key={t.id} className="dash-ticket-mini">
                          <div className="dash-ticket-mini-top">
                            <span className="dash-ticket-id">{t.id}</span>
                            <span className="dash-ticket-status">{t.status.replace(/-/g,' ')}</span>
                          </div>
                          <div className="dash-ticket-mini-info">
                            <span><School size={11}/> {t.school}</span>
                            <span><Tag size={11}/> {t.problemType || 'Sem tipo'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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

        .dash-resp-wrapper {
          animation: dashItemIn 0.4s ease-out both;
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

        .dash-resp-active {
          background: rgba(134, 239, 172, 0.05);
          border-color: rgba(134, 239, 172, 0.2);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        @keyframes dashItemIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .dash-resp-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dash-resp-right-side {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dash-resp-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(134, 239, 172, 0.2), rgba(34, 197, 94, 0.15));
          border: 1px solid rgba(134, 239, 172, 0.2);
          transition: all 0.3s ease;
        }

        .dash-resp-item:hover .dash-resp-avatar {
          background: linear-gradient(135deg, rgba(134, 239, 172, 0.3), rgba(34, 197, 94, 0.25));
          box-shadow: 0 0 16px rgba(34, 197, 94, 0.15);
        }

        .dash-resp-avatar span {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #86efac;
        }

        .dash-resp-name {
          font-weight: 600;
          color: #e5e7eb;
          font-size: 0.9375rem;
        }

        .dash-resp-count-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
        }

        .dash-resp-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0 12px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15));
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .dash-resp-item:hover .dash-resp-badge {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.25));
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.15);
        }

        .dash-resp-badge span {
          font-size: 0.875rem;
          font-weight: 700;
          color: #86efac;
        }

        /* ── Expanded Tickets Panel ── */
        .dash-person-tickets {
          padding: 12px 16px 16px;
          background: rgba(15, 15, 30, 0.4);
          border: 1px solid rgba(134, 239, 172, 0.1);
          border-top: none;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: dashFadeIn 0.25s ease-out;
        }

        .dash-no-tickets {
          font-size: 0.8125rem;
          color: #6b7280;
          text-align: center;
          padding: 12px;
        }

        .dash-ticket-mini {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .dash-ticket-mini:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .dash-ticket-mini-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .dash-ticket-id {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #60a5fa;
          font-family: 'JetBrains Mono', monospace;
        }

        .dash-ticket-status {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(139, 92, 246, 0.1);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.15);
          text-transform: capitalize;
        }

        .dash-ticket-mini-info {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .dash-ticket-mini-info span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
