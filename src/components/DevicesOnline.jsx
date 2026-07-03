import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Wifi, WifiOff, RefreshCw, Monitor, Loader2, Clock, ChevronDown, ChevronRight, School, AlertTriangle, BookOpen } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'
import './DevicesOnline.css'

function formatLastSeen(dateStr) {
  if (!dateStr) return 'Nunca conectado'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} min`
  if (diffHours < 24) return `Há ${diffHours}h ${diffMin % 60}min`
  if (diffDays === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function isWorkingHours() {
  const now = new Date()
  const h = now.getHours()
  return h >= 7 && h < 18
}

function formatDeviceSuffix(value) {
  const raw = String(value || '').trim()
  
  // Try to match specific pi5-8g pattern first
  const piMatch = raw.match(/pi5-8g-(\d+)/i)
  if (piMatch?.[1]) {
    return piMatch[1].slice(-3).padStart(3, '0')
  }

  // Try to match trailing number
  const trailingMatch = raw.match(/(\d+)\s*$/)
  if (trailingMatch?.[1]) {
    return trailingMatch[1].slice(-3).padStart(3, '0')
  }

  const digits = raw.match(/\d+/g)?.join('') || ''
  if (!digits) return raw
  return digits.slice(-3).padStart(3, '0')
}

export default function DevicesOnline() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'Admin'

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedSchools, setExpandedSchools] = useState({})
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const loadDevices = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const result = await api.get('/devices/status')
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message || 'Erro ao carregar status dos devices.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleForceRefresh = async () => {
    setIsRefreshing(true)
    try {
      const result = await api.post('/devices/refresh')
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message || 'Erro ao atualizar.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadDevices(true)
  }, [loadDevices])

  // Auto-refresh: every 10 minutes during working hours (07-18) when tab is active
  useEffect(() => {
    const setupInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        if (isWorkingHours() && !document.hidden) {
          loadDevices(false)
        }
      }, 10 * 60 * 1000) // 10 minutes
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        setupInterval()
        if (isWorkingHours()) {
          loadDevices(false)
        }
      }
    }

    setupInterval()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadDevices])

  const toggleSchool = (name) => {
    setExpandedSchools(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const expandAll = () => {
    if (!data?.schools) return
    const all = {}
    Object.keys(data.schools).forEach(name => { all[name] = true })
    setExpandedSchools(all)
  }

  const collapseAll = () => {
    setExpandedSchools({})
  }

  // Memoize school statistics to avoid filtering arrays inside loops on every render
  const schoolStats = useMemo(() => {
    if (!data?.schools) return {}
    const stats = {}
    Object.entries(data.schools).forEach(([schoolName, devices]) => {
      const online = devices.filter(d => d.online).length
      stats[schoolName] = { online, total: devices.length }
    })
    return stats
  }, [data])

  const isMissingTailscaleConfig = String(data?.error || '').toLowerCase().includes('chave da api do tailscale não configurada')

  const backendStatusMessage = data?.error
    ? {
      type: isMissingTailscaleConfig ? 'warning' : 'error',
      text: isMissingTailscaleConfig
        ? `${data.error} Configure no Render e clique em "Atualizar".`
        : `Falha ao consultar Tailscale: ${data.error}`
    }
    : data?.warning
      ? { type: 'warning', text: data.warning }
      : data?.stale
        ? { type: 'warning', text: 'Exibindo cache anterior por falha temporária ao consultar o Tailscale.' }
        : null

  return (
    <div className="dvo-container">
      {/* Header */}
      <div className="dvo-page-header">
        <div className="dvo-header-icon">
          <Monitor size={22} style={{ color: '#86efac' }} />
        </div>
        <div className="dvo-header-text">
          <h1 className="dvo-page-title">Devices Online</h1>
          <p className="dvo-page-subtitle">Monitoramento em tempo real via Tailscale</p>
        </div>
      </div>

      {/* Stats Bar */}
      {data && !isLoading && (
        <div className="dvo-stats-bar">
          <div className="dvo-stat-item dvo-stat-online">
            <Wifi size={16} />
            <span className="dvo-stat-value">{data.onlineCount}</span>
            <span className="dvo-stat-label">Online</span>
          </div>
          <div className="dvo-stat-item dvo-stat-offline">
            <WifiOff size={16} />
            <span className="dvo-stat-value">{data.offlineCount}</span>
            <span className="dvo-stat-label">Offline</span>
          </div>
          <div className="dvo-stat-item dvo-stat-total">
            <Monitor size={16} />
            <span className="dvo-stat-value">{data.totalDevices}</span>
            <span className="dvo-stat-label">Total</span>
          </div>

          <div className="dvo-stat-spacer" />

          {/* Last updated + auto-update info */}
          <div className="dvo-stat-meta">
            <Clock size={12} />
            <span>
              {data.lastFetched
                ? `Atualizado ${formatLastSeen(data.lastFetched)}`
                : 'Sem dados'}
            </span>
            {isWorkingHours() && (
              <span className="dvo-auto-badge">Auto 10min</span>
            )}
          </div>

          {/* Actions */}
          <div className="dvo-stat-actions">
            <button onClick={expandAll} className="dvo-mini-btn" title="Expandir todos">
              Expandir
            </button>
            <button onClick={collapseAll} className="dvo-mini-btn" title="Recolher todos">
              Recolher
            </button>
            {isAdmin && (
              <button
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="dvo-refresh-btn"
                title="Forçar atualização"
              >
                <RefreshCw size={14} className={isRefreshing ? 'dvo-spin' : ''} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="dvo-error">
          <WifiOff size={16} />
          <span>{error}</span>
        </div>
      )}

      {!error && backendStatusMessage && (
        <div className={`dvo-api-status dvo-api-status-${backendStatusMessage.type}`}>
          <AlertTriangle size={14} />
          <span>{backendStatusMessage.text}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="dvo-loading">
          <Loader2 size={24} className="dvo-spin" style={{ color: '#86efac' }} />
          <span>Consultando Tailscale...</span>
        </div>
      ) : data?.schools ? (
        <div className="dvo-schools-list">
          {Object.entries(data.schools).map(([schoolName, devices], idx) => {
            const isExpanded = expandedSchools[schoolName] ?? false
            const stats = schoolStats[schoolName] || { online: 0, total: 0 }
            const allOnline = stats.online === stats.total
            const anyOnline = stats.online > 0

            return (
              <div
                key={schoolName}
                className="dvo-school-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* School header - clickable */}
                <button
                  className="dvo-school-header"
                  onClick={() => toggleSchool(schoolName)}
                >
                  <div className="dvo-school-left">
                    <div className={`dvo-school-icon ${allOnline ? 'dvo-all-on' : anyOnline ? 'dvo-some-on' : 'dvo-all-off'}`}>
                      <School size={18} />
                    </div>
                    <div>
                      <h3 className="dvo-school-name">{schoolName}</h3>
                      <p className="dvo-school-stats">
                        <span className="dvo-green">{stats.online}</span> online
                        {stats.online < stats.total && (
                          <> · <span className="dvo-red">{stats.total - stats.online}</span> offline</>
                        )}
                        {' · '}{stats.total} device{stats.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="dvo-school-right">
                    {/* Mini dots */}
                    <div className="dvo-mini-dots">
                      {devices.map(d => (
                        <span
                          key={d.id}
                          className={`dvo-dot ${d.online ? 'dvo-dot-on' : d.found === false ? 'dvo-dot-warn' : 'dvo-dot-off'}`}
                          title={`Device ${d.id}: ${d.online ? 'Online' : 'Offline'}`}
                        />
                      ))}
                    </div>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {/* Expanded device list */}
                {isExpanded && (
                  <div className="dvo-device-list">
                    {devices.map(device => {
                      const turmas = Array.isArray(device.turmas) ? device.turmas : []
                      const displayDeviceCode = formatDeviceSuffix(device.displayHostname || device.hostname || device.id)

                      return (
                        <div
                          key={device.id}
                          className={`dvo-device-item ${device.online ? 'dvo-device-online' : !device.found ? 'dvo-device-notfound' : 'dvo-device-offline'}`}
                        >
                          <div className="dvo-device-status-dot">
                            <span className={`dvo-status-indicator ${device.online ? 'dvo-indicator-on' : 'dvo-indicator-off'}`} />
                          </div>
                          <div className="dvo-device-info">
                            <div className="dvo-device-id">
                              <Monitor size={14} />
                              <span>Device {device.id}</span>
                              {!device.found && !device.online && (
                                <span className="dvo-notfound-badge">
                                  <AlertTriangle size={10} />
                                  Não existe no Tailscale
                                </span>
                              )}
                            </div>
                            <div className="dvo-device-meta">
                              {device.online ? (
                                <span className="dvo-status-text-on">
                                  <Wifi size={11} />
                                  Online agora
                                </span>
                              ) : (
                                <span className="dvo-status-text-off">
                                  <WifiOff size={11} />
                                  {device.found
                                    ? formatLastSeen(device.lastSeen)
                                    : 'Verifique o número do device'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="dvo-device-right">
                            <span className="dvo-device-hostname dvo-device-hostname-full">
                              {displayDeviceCode}
                            </span>
                            <div className="dvo-device-turmas" aria-label={`Turmas do device ${device.id}`}>
                              <BookOpen size={11} />
                              {turmas.length > 0 ? (
                                turmas.map((turma, index) => (
                                  <span key={`${device.id}-${turma}-${index}`} className="dvo-turma-pill">
                                    {turma}
                                  </span>
                                ))
                              ) : (
                                <span className="dvo-turma-empty">Sem turma</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Working hours info */}
      <div className="dvo-info-banner">
        <Clock size={14} />
        <span>
          {isWorkingHours()
            ? 'Atualização automática ativa (07:00 – 18:00, a cada 10 minutos)'
            : 'Fora do horário de atualização automática (07:00 – 18:00)'}
        </span>
      </div>
    </div>
  )
}
