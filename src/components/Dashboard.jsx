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
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30'
    },
    {
      label: 'Em Andamento',
      value: stats.inProgress,
      icon: Clock,
      color: 'from-orange-500/20 to-orange-600/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/30'
    },
    {
      label: 'Concluídos',
      value: stats.completed,
      icon: CheckCircle,
      color: 'from-primary-light/20 to-primary/20',
      iconColor: 'text-primary-light',
      borderColor: 'border-primary-light/30'
    }
  ]

  return (
    <div className="space-y-6 animate-slideInUp">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-100 mb-2">Dashboard</h1>
        <p className="text-dark-400">Visão geral do sistema de atendimento</p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`card-base border-2 ${card.borderColor} bg-gradient-to-br ${card.color} hover:shadow-lg hover:shadow-current/20 group`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-400 text-sm font-medium mb-2">{card.label}</p>
                  <p className="text-3xl font-bold text-dark-100">{card.value}</p>
                </div>
                <Icon size={24} className={`${card.iconColor} group-hover:scale-110 transition-transform`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Responsáveis section */}
      <div className="card-base">
        <h2 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary-light rounded-full"></span>
          Chamados por Responsável
        </h2>
        
        <div className="space-y-3">
          {Object.entries(stats.byResponsible).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-dark-750 rounded-lg hover:bg-dark-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-light/30 to-primary/30 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-light">{name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-dark-100">{name}</p>
                  <p className="text-xs text-dark-400">{count} chamado{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-primary-light/20 rounded-lg">
                <span className="text-sm font-bold text-primary-light">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
