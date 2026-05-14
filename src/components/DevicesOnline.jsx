import { useState, useEffect, useCallback, useRef } from 'react'
import { Wifi, WifiOff, RefreshCw, Monitor, Loader2, Clock, ChevronDown, ChevronRight, School, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../services/api'

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

export default function DevicesOnline() {
  const { user } = useAuthStore()
  const isAdmin = user?.canDragDrop === true

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

  // Auto-refresh: every 10 minutes during working hours (07-18)
  useEffect(() => {
    const setupInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        if (isWorkingHours()) {
          loadDevices(false)
        }
      }, 10 * 60 * 1000) // 10 minutes
    }

    setupInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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

  const getSchoolStats = (devices) => {
    const online = devices.filter(d => d.online).length
    return { online, total: devices.length }
  }

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
            const stats = getSchoolStats(devices)
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
                    {devices.map(device => (
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
                            {device.hostname && (
                              <span className="dvo-device-hostname">{device.hostname}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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

      <style>{`
        .dvo-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: dvoFadeIn 0.5s ease-out;
        }

        @keyframes dvoFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dvo-spin { animation: dvoSpin 1s linear infinite; }
        @keyframes dvoSpin { to { transform: rotate(360deg); } }

        /* ── Header ── */
        .dvo-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dvo-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.08));
          border: 1px solid rgba(34,197,94,0.2);
          box-shadow: 0 0 20px rgba(34,197,94,0.06);
        }

        .dvo-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .dvo-page-subtitle {
          font-size: 0.9375rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* ── Stats Bar ── */
        .dvo-stats-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          flex-wrap: wrap;
        }

        .dvo-stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .dvo-stat-online {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .dvo-stat-offline {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .dvo-stat-total {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }

        .dvo-stat-value { font-weight: 800; }
        .dvo-stat-label { font-weight: 400; opacity: 0.8; }
        .dvo-stat-spacer { flex: 1; }

        .dvo-stat-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          color: #6b7280;
        }

        .dvo-match-badge {
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.35);
          background: rgba(37, 99, 235, 0.16);
          color: #bfdbfe;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .dvo-auto-badge {
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #86efac;
          font-size: 0.625rem;
          font-weight: 600;
        }

        .dvo-stat-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dvo-mini-btn {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.6875rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dvo-mini-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #d1d5db;
        }

        .dvo-refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1));
          border: 1px solid rgba(34,197,94,0.25);
          color: #86efac;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dvo-refresh-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.18));
          box-shadow: 0 2px 12px rgba(34,197,94,0.1);
        }

        .dvo-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Loading / Error ── */
        .dvo-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 20px;
          background: rgba(15, 15, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          color: #9ca3af;
          font-size: 0.9375rem;
        }

        .dvo-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.8125rem;
        }

        .dvo-api-status {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid;
          font-size: 0.8125rem;
          line-height: 1.35;
        }

        .dvo-api-status-warning {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.35);
          color: #fcd34d;
        }

        .dvo-api-status-error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        /* ── Schools List ── */
        .dvo-schools-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dvo-school-card {
          background: rgba(15, 15, 30, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: dvoCardIn 0.4s ease-out both;
        }

        .dvo-school-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        @keyframes dvoCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dvo-school-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          transition: background 0.2s ease;
        }

        .dvo-school-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .dvo-school-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dvo-school-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .dvo-all-on {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #86efac;
        }

        .dvo-some-on {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          color: #fde68a;
        }

        .dvo-all-off {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .dvo-school-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #e5e7eb;
          text-align: left;
        }

        .dvo-school-stats {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
          text-align: left;
        }

        .dvo-green { color: #86efac; font-weight: 700; }
        .dvo-red { color: #fca5a5; font-weight: 700; }

        .dvo-school-right {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6b7280;
        }

        /* ── Mini dots ── */
        .dvo-mini-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .dvo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dvo-dot-on {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
        }

        .dvo-dot-off {
          background: #6b7280;
          opacity: 0.5;
        }

        .dvo-dot-warn {
          background: #f59e0b;
          opacity: 0.7;
        }

        /* ── Device list ── */
        .dvo-device-list {
          padding: 0 16px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: dvoFadeIn 0.3s ease-out;
        }

        .dvo-device-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .dvo-device-online {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.1);
        }

        .dvo-device-online:hover {
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .dvo-device-offline {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .dvo-device-offline:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .dvo-device-notfound {
          background: rgba(245, 158, 11, 0.04);
          border: 1px dashed rgba(245, 158, 11, 0.2);
        }

        .dvo-device-notfound:hover {
          background: rgba(245, 158, 11, 0.07);
        }

        .dvo-notfound-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.2);
          margin-left: 6px;
        }

        .dvo-device-status-dot {
          flex-shrink: 0;
        }

        .dvo-status-indicator {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dvo-indicator-on {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
          animation: dvoPulse 2s ease-in-out infinite;
        }

        @keyframes dvoPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 14px rgba(34, 197, 94, 0.7); }
        }

        .dvo-indicator-off {
          background: #6b7280;
        }

        .dvo-device-info {
          flex: 1;
          min-width: 0;
        }

        .dvo-device-id {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e5e7eb;
        }

        .dvo-device-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 3px;
          flex-wrap: wrap;
        }

        .dvo-status-text-on {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #86efac;
        }

        .dvo-status-text-off {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6875rem;
          color: #9ca3af;
        }

        .dvo-device-hostname {
          font-size: 0.625rem;
          color: #4b5563;
          padding: 1px 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          font-family: monospace;
        }

        /* ── Info banner ── */
        .dvo-info-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(15, 15, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          font-size: 0.75rem;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .dvo-stats-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .dvo-stat-spacer { display: none; }

          .dvo-stat-actions {
            justify-content: center;
            margin-top: 8px;
          }

          .dvo-stat-meta {
            justify-content: center;
          }

          .dvo-mini-dots { display: none; }
        }
      `}</style>
    </div>
  )
}
