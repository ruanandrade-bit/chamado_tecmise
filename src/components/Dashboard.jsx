import { useState } from 'react'
import { Cog, Clock, AlertCircle, ChevronDown, ChevronRight, School, Tag } from 'lucide-react'
import { useTicketsStore } from '../stores/ticketsStore'
import './Dashboard.css'

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
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Visão geral do sistema de atendimento</p>
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
                <ChevronRight size={16} className="dash-resp-chevron" />
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

    </div>
  )
}
