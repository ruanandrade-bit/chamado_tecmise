import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Trash2, Send, CalendarDays, ClipboardList, Loader2, Ticket } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useTicketsStore } from '../stores/ticketsStore'
import { api } from '../services/api'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function MonthlyReport() {
  const { user } = useAuthStore()
  const isAdmin = user?.canDragDrop === true
  const { tickets } = useTicketsStore()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = MONTH_NAMES[currentMonth - 1]

  // Count tickets opened in the current month
  const ticketsThisMonth = tickets.filter((t) => {
    if (!t.createdAt) return false
    const d = new Date(t.createdAt)
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
  }).length

  const [observations, setObservations] = useState([])
  const [newObservation, setNewObservation] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadReport = useCallback(async () => {
    try {
      const data = await api.get(`/reports/monthly?month=${currentMonth}&year=${currentYear}`)
      setObservations(data.observations || [])
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  // Polling every 10s
  useEffect(() => {
    const interval = setInterval(loadReport, 10000)
    return () => clearInterval(interval)
  }, [loadReport])

  const handleAddObservation = async () => {
    if (!newObservation.trim() || isSending) return
    setIsSending(true)
    try {
      const data = await api.post('/reports/monthly', {
        month: currentMonth,
        year: currentYear,
        observation: newObservation
      })
      setObservations(data.observations || [])
      setNewObservation('')
    } catch (err) {
      alert(err.message || 'Erro ao adicionar observação.')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteObservation = async (observationId) => {
    if (deletingId) return
    setDeletingId(observationId)
    try {
      const data = await api.delete(`/reports/monthly/${currentMonth}/${currentYear}/${observationId}`)
      setObservations(data.observations || [])
    } catch (err) {
      alert(err.message || 'Erro ao remover observação.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 animate-slideInUp">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-light/20 flex items-center justify-center">
          <FileText size={20} className="text-primary-light" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-dark-100">Relatório Mensal</h1>
          <p className="text-dark-400">Observações e acompanhamento mensal</p>
        </div>
      </div>

      {/* Month Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(6, 182, 212, 0.06) 100%)',
          borderColor: 'rgba(34, 197, 94, 0.2)',
        }}
      >
        {/* Decorative background circles */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
              border: '1px solid rgba(34,197,94,0.3)'
            }}
          >
            <CalendarDays size={26} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-100">
              Relatório de Devices do Mês de {monthName}
            </h2>
            <p className="text-sm text-dark-400 mt-0.5">
              {currentYear} • {observations.length} observação{observations.length !== 1 ? 'ões' : ''} registrada{observations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tickets opened this month */}
      <div
        className="flex items-center gap-4 rounded-2xl border p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
        }}
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.15) 100%)',
            border: '1px solid rgba(59,130,246,0.3)'
          }}
        >
          <Ticket size={22} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <p className="text-lg font-bold text-dark-100">
            Neste mês, <span style={{ color: '#60a5fa' }}>{ticketsThisMonth}</span> chamado{ticketsThisMonth !== 1 ? 's foram abertos' : ' foi aberto'}.
          </p>
          <p className="text-xs text-dark-500 mt-0.5">
            Atualizado automaticamente a cada novo chamado
          </p>
        </div>
      </div>

      {/* Admin: Add observation */}
      {isAdmin && (
        <div className="card-base space-y-3">
          <div className="flex items-center gap-2 text-dark-300">
            <Plus size={16} className="text-primary-light" />
            <span className="text-sm font-medium">Nova Observação</span>
          </div>
          <div className="flex gap-3">
            <textarea
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Descreva a observação do mês..."
              rows={3}
              className="input-base flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddObservation()
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-500">Ctrl + Enter para enviar</span>
            <button
              onClick={handleAddObservation}
              disabled={!newObservation.trim() || isSending}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Observations list */}
      {isLoading ? (
        <div className="card-base flex items-center justify-center py-16">
          <Loader2 size={24} className="text-primary-light animate-spin" />
          <span className="ml-3 text-dark-400">Carregando relatório...</span>
        </div>
      ) : observations.length === 0 ? (
        <div className="card-base text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-dark-700/50 flex items-center justify-center">
            <ClipboardList size={28} className="text-dark-500" />
          </div>
          <p className="text-dark-400 font-medium">Nenhuma observação registrada</p>
          <p className="text-dark-500 text-sm">
            {isAdmin
              ? 'Adicione a primeira observação do mês acima.'
              : 'As observações do mês aparecerão aqui quando forem registradas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map((obs, index) => (
            <div
              key={obs.id}
              className="card-base group hover:border-primary-light/30"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Observation number badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)',
                        color: '#86efac',
                        border: '1px solid rgba(34,197,94,0.25)'
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs text-dark-500">
                      por <strong className="text-dark-400">{obs.author}</strong> • {formatDate(obs.createdAt)}
                    </span>
                  </div>

                  {/* Observation text */}
                  <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap pl-8">
                    {obs.text}
                  </p>
                </div>

                {/* Delete button — admin only */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteObservation(obs.id)}
                    disabled={deletingId === obs.id}
                    className="flex-shrink-0 p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Remover observação"
                  >
                    {deletingId === obs.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Non-admin info */}
      {!isAdmin && (
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.15)',
          }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99, 102, 241, 0.12)' }}
          >
            <FileText size={16} style={{ color: '#818cf8' }} />
          </div>
          <p className="text-sm" style={{ color: '#a5b4fc' }}>
            Apenas administradores podem adicionar observações ao relatório mensal.
          </p>
        </div>
      )}
    </div>
  )
}
