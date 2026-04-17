import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'

export default function Dashboard() {
  const { getStatistics } = useTicketsStore()
  const stats = getStatistics()

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
      label: 'Concluídos',
      value: stats.completed,
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.08) 100%)',
      border: 'rgba(34,197,94,0.25)',
      iconColor: '#86efac',
      glowColor: 'rgba(34,197,94,0.1)',
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
            <div
              key={name}
              className="dash-resp-item"
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
              <div className="dash-resp-badge">
                <span>{count}</span>
              </div>
            </div>
          ))}
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

        .dash-resp-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          transition: all 0.3s ease;
          animation: dashItemIn 0.4s ease-out both;
          cursor: default;
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

        .dash-resp-left {
          display: flex;
          align-items: center;
          gap: 14px;
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
      `}</style>
    </div>
  )
}
