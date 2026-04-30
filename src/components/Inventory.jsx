import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Minus, Pencil, Check, X, Loader2, Download,
  Plug, Zap, Battery, Camera, Cpu, HardDrive, Fan, Cable, Printer, CheckCircle2, Usb
} from 'lucide-react'
import { api } from '../services/api'

const ITEM_CONFIG = {
  'tomada-inicial':   { Icon: Plug,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
  'tomada-nova':      { Icon: Zap,          color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.25)' },
  'tomada-original':  { Icon: Battery,      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  'cam-logitech':     { Icon: Camera,       color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)' },
  'usb-cam-logi':     { Icon: Usb,          color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
  'raspberry-pi':     { Icon: Cpu,          color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)' },
  'micro-sd':         { Icon: HardDrive,    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)' },
  'cooler':           { Icon: Fan,          color: '#67e8f9', bg: 'rgba(103,232,249,0.12)', border: 'rgba(103,232,249,0.25)' },
  'cabo-usb':         { Icon: Cable,        color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)' },
  'falta-imprimir':   { Icon: Printer,      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)' },
  'completo':         { Icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)' },
}

function ItemIcon({ itemId }) {
  const config = ITEM_CONFIG[itemId] || { Icon: Package, color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.25)' }
  const { Icon, color, bg, border } = config
  return (
    <div className="inv-icon-circle" style={{ background: bg, borderColor: border, boxShadow: `0 0 16px ${bg}` }}>
      <Icon size={22} style={{ color }} />
    </div>
  )
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const loadInventory = useCallback(async () => {
    try {
      const data = await api.get('/inventory')
      setItems(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar estoque:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const updateQuantity = async (id, quantity) => {
    setUpdatingId(id)
    try {
      const data = await api.patch(`/inventory/${id}`, { quantity })
      setItems(data.items || [])
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleIncrement = (item) => {
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = (item) => {
    if (item.quantity > 0) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditValue(String(item.quantity))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const confirmEdit = (item) => {
    const num = parseInt(editValue, 10)
    if (!isNaN(num) && num >= 0) {
      updateQuantity(item.id, num)
    }
    setEditingId(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e, item) => {
    if (e.key === 'Enter') confirmEdit(item)
    if (e.key === 'Escape') cancelEdit()
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const generatePDF = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const inStock = items.filter(i => i.quantity > 0).length
    const outOfStock = items.filter(i => i.quantity === 0).length

    const rows = items.map((item, i) => {
      const hasStock = item.quantity > 0
      const rowBg = i % 2 === 0 ? '#1e1e3a' : '#16162e'
      const badgeBg = hasStock ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
      const badgeColor = hasStock ? '#4ade80' : '#f87171'
      const badgeBorder = hasStock ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
      const badgeText = hasStock ? 'Em estoque' : 'Zerado'
      const qtyColor = hasStock ? '#4ade80' : '#6b7280'

      return `
        <tr style="background: ${rowBg};">
          <td style="padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #9ca3af; font-size: 11px; font-weight: 600; width: 36px;">${String(i + 1).padStart(2, '0')}</td>
          <td style="padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #e5e7eb; font-size: 12px; font-weight: 600;">${item.name}</td>
          <td style="padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); text-align: center;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 6px; background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; font-size: 10px; font-weight: 600;">${badgeText}</span>
          </td>
          <td style="padding: 7px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); text-align: center; font-size: 16px; font-weight: 800; color: ${qtyColor};">${item.quantity}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Estoque S4S - ${dateStr}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 0; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #0a0a1a; color: #e5e7eb; }
    .page { max-width: 100%; padding: 24px 28px; }
    .header { background: linear-gradient(135deg, #1a1040 0%, #0d0d2b 50%, #0a1628 100%); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; border: 1px solid rgba(139,92,246,0.15); position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -50%; right: -30%; width: 250px; height: 250px; background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%); border-radius: 50%; }
    .header-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
    .logo-s4 { color: #a78bfa; }
    .logo-s { color: #4ade80; }
    .logo-sub { font-size: 10px; font-weight: 500; color: #6b7280; margin-left: 8px; letter-spacing: 1px; text-transform: uppercase; }
    .date-box { text-align: right; padding: 8px 14px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); }
    .date-val { font-size: 14px; font-weight: 700; color: #f3f4f6; }
    .time-val { font-size: 11px; color: #6b7280; }
    .report-info { position: relative; z-index: 1; margin-top: 14px; display: flex; align-items: baseline; gap: 10px; }
    .report-title { font-size: 18px; font-weight: 800; color: #f3f4f6; }
    .report-subtitle { font-size: 11px; color: #6b7280; }
    .summary-grid { display: flex; gap: 10px; margin-bottom: 14px; }
    .summary-card { flex: 1; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .sc-purple { background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.03)); border-color: rgba(139,92,246,0.15); }
    .sc-green { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03)); border-color: rgba(34,197,94,0.15); }
    .sc-red { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03)); border-color: rgba(239,68,68,0.15); }
    .sc-blue { background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03)); border-color: rgba(59,130,246,0.15); }
    .sc-value { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
    .v-purple { color: #c4b5fd; } .v-green { color: #86efac; } .v-red { color: #fca5a5; } .v-blue { color: #93c5fd; }
    .sc-label { font-size: 9px; font-weight: 600; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-wrap { background: #12122a; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 8px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    thead th:first-child { text-align: left; }
    thead th:nth-child(3), thead th:last-child { text-align: center; }
    .footer { text-align: center; padding: 12px; font-size: 10px; color: #4b5563; border-top: 1px solid rgba(255,255,255,0.04); }
    .footer-line { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .footer-dot { display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: #4b5563; }
    .logo-img { width: 44px; height: 44px; border-radius: 10px; }
    .logo-text { display: flex; flex-direction: column; }
    .logo-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .logo-s4 { color: #a78bfa; }
    .logo-s { color: #4ade80; }
    .logo-sub { font-size: 9px; font-weight: 500; color: #6b7280; letter-spacing: 1.2px; text-transform: uppercase; margin-top: -2px; }
    @media print {
      @page { margin: 0; }
      body { background: #0a0a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div style="display:flex;align-items:center;gap:12px;">
          <img class="logo-img" src="data:image/png;base64,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" alt="S4S">
          <div class="logo-text">
            <div class="logo-name"><span class="logo-s4">S4</span><span class="logo-s">S</span> Chamados</div>
            <span class="logo-sub">Sistema de Chamados</span>
          </div>
        </div>
        <div class="date-box">
          <div class="date-val">${dateStr}</div>
          <div class="time-val">${timeStr}</div>
        </div>
      </div>
      <div class="report-info">
        <div class="report-title">\ud83d\udce6 Relat\u00f3rio de Estoque</div>
        <div class="report-subtitle">Invent\u00e1rio completo de componentes e materiais</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card sc-purple"><div class="sc-value v-purple">${items.length}</div><div class="sc-label">Total Itens</div></div>
      <div class="summary-card sc-blue"><div class="sc-value v-blue">${totalItems}</div><div class="sc-label">Em Estoque</div></div>
      <div class="summary-card sc-green"><div class="sc-value v-green">${inStock}</div><div class="sc-label">Dispon\u00edveis</div></div>
      <div class="summary-card sc-red"><div class="sc-value v-red">${outOfStock}</div><div class="sc-label">Zerados</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th style="width:36px">#</th><th style="text-align:left">Item</th><th>Status</th><th style="width:80px">Qtd</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-line">
        <span>S4S Chamados</span><span class="footer-dot"></span>
        <span>Gerado em ${dateStr} \u00e0s ${timeStr}</span><span class="footer-dot"></span>
        <span>Tecmise</span>
      </div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  return (
    <div className="inv-container">
      {/* Header */}
      <div className="inv-page-header">
        <div className="inv-header-icon">
          <Package size={22} style={{ color: '#c084fc' }} />
        </div>
        <div className="inv-header-text">
          <h1 className="inv-page-title">Estoque</h1>
          <p className="inv-page-subtitle">Gerenciamento de componentes e materiais</p>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="inv-stats-bar">
          <div className="inv-stat-item">
            <Package size={15} />
            <span className="inv-stat-value">{items.length}</span>
            <span className="inv-stat-label">Itens</span>
          </div>
          <div className="inv-stat-item inv-stat-total">
            <span className="inv-stat-value">{totalItems}</span>
            <span className="inv-stat-label">Total em estoque</span>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={generatePDF}
            className="inv-pdf-btn"
            title="Baixar PDF do estoque"
          >
            <Download size={15} />
            Baixar PDF
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="inv-loading">
          <Loader2 size={24} className="inv-spin" style={{ color: '#c084fc' }} />
          <span>Carregando estoque...</span>
        </div>
      ) : (
        <div className="inv-grid">
          {items.map((item, idx) => {
            const isEditing = editingId === item.id
            const isUpdating = updatingId === item.id
            const isEmpty = item.quantity === 0

            return (
              <div
                key={item.id}
                className={`inv-card ${isEmpty ? 'inv-card-empty' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Item icon & name */}
                <div className="inv-card-header">
                  <ItemIcon itemId={item.id} />
                  <h3 className="inv-card-name">{item.name}</h3>
                </div>

                {/* Quantity display */}
                <div className="inv-card-qty-section">
                  {isEditing ? (
                    <div className="inv-edit-row">
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, item)}
                        className="inv-edit-input"
                        autoFocus
                      />
                      <button
                        onClick={() => confirmEdit(item)}
                        className="inv-edit-btn inv-edit-confirm"
                        title="Confirmar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inv-edit-btn inv-edit-cancel"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className={`inv-qty-display ${isEmpty ? 'inv-qty-zero' : 'inv-qty-positive'}`}>
                      {isUpdating ? (
                        <Loader2 size={20} className="inv-spin" />
                      ) : (
                        <span className="inv-qty-number">{item.quantity}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!isEditing && (
                  <div className="inv-card-actions">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity === 0 || isUpdating}
                      className="inv-action-btn inv-btn-minus"
                      title="Remover 1"
                    >
                      <Minus size={16} />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      disabled={isUpdating}
                      className="inv-action-btn inv-btn-edit"
                      title="Personalizar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleIncrement(item)}
                      disabled={isUpdating}
                      className="inv-action-btn inv-btn-plus"
                      title="Adicionar 1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .inv-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: invFadeIn 0.5s ease-out;
        }

        @keyframes invFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .inv-spin { animation: invSpin 1s linear infinite; }
        @keyframes invSpin { to { transform: rotate(360deg); } }

        /* ── Header ── */
        .inv-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .inv-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.12), rgba(139, 92, 246, 0.08));
          border: 1px solid rgba(192, 132, 252, 0.2);
          box-shadow: 0 0 20px rgba(192, 132, 252, 0.06);
        }

        .inv-page-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .inv-page-subtitle {
          font-size: 0.9375rem;
          color: #9ca3af;
          margin-top: 2px;
        }

        /* ── Stats ── */
        .inv-stats-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
        }

        .inv-stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: rgba(192, 132, 252, 0.1);
          border: 1px solid rgba(192, 132, 252, 0.2);
          color: #d8b4fe;
        }

        .inv-stat-total {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .inv-stat-value { font-weight: 800; }
        .inv-stat-label { font-weight: 400; opacity: 0.8; }

        .inv-pdf-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1));
          border: 1px solid rgba(139, 92, 246, 0.25);
          color: #c4b5fd;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .inv-pdf-btn:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.18));
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 2px 12px rgba(139, 92, 246, 0.12);
          color: #ddd6fe;
        }

        /* ── Loading ── */
        .inv-loading {
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

        /* ── Grid ── */
        .inv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        /* ── Card ── */
        .inv-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 22px 16px 18px;
          background: rgba(15, 15, 30, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          transition: all 0.3s ease;
          animation: invCardIn 0.4s ease-out both;
        }

        .inv-card:hover {
          border-color: rgba(192, 132, 252, 0.2);
          box-shadow: 0 4px 24px rgba(192, 132, 252, 0.06);
          transform: translateY(-2px);
        }

        .inv-card-empty {
          opacity: 0.65;
        }

        .inv-card-empty:hover {
          opacity: 1;
        }

        @keyframes invCardIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .inv-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .inv-card-icon {
          font-size: 2rem;
          line-height: 1;
        }

        .inv-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid;
          transition: all 0.3s ease;
        }

        .inv-card:hover .inv-icon-circle {
          transform: scale(1.08);
        }

        .inv-card-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #d1d5db;
          text-align: center;
          line-height: 1.3;
        }

        /* ── Quantity display ── */
        .inv-card-qty-section {
          margin: 4px 0;
        }

        .inv-qty-display {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .inv-qty-positive {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.06));
          border: 1.5px solid rgba(34, 197, 94, 0.2);
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.06);
        }

        .inv-qty-zero {
          background: rgba(255, 255, 255, 0.02);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
        }

        .inv-qty-number {
          font-size: 1.5rem;
          font-weight: 800;
          color: #e5e7eb;
          font-variant-numeric: tabular-nums;
        }

        .inv-qty-positive .inv-qty-number {
          color: #86efac;
        }

        /* ── Edit row ── */
        .inv-edit-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .inv-edit-input {
          width: 64px;
          height: 40px;
          border-radius: 10px;
          border: 1.5px solid rgba(192, 132, 252, 0.3);
          background: rgba(15, 15, 30, 0.8);
          color: #e5e7eb;
          font-size: 1rem;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
          -moz-appearance: textfield;
        }

        .inv-edit-input::-webkit-inner-spin-button,
        .inv-edit-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .inv-edit-input:focus {
          border-color: rgba(192, 132, 252, 0.6);
          box-shadow: 0 0 10px rgba(192, 132, 252, 0.15);
        }

        .inv-edit-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .inv-edit-confirm {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .inv-edit-confirm:hover {
          background: rgba(34, 197, 94, 0.25);
        }

        .inv-edit-cancel {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        .inv-edit-cancel:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        /* ── Action buttons ── */
        .inv-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
        }

        .inv-action-btn {
          width: 38px;
          height: 34px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .inv-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .inv-btn-minus {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        .inv-btn-minus:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 2px 10px rgba(239, 68, 68, 0.1);
        }

        .inv-btn-plus {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .inv-btn-plus:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.3);
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.1);
        }

        .inv-btn-edit {
          background: rgba(192, 132, 252, 0.1);
          border: 1px solid rgba(192, 132, 252, 0.15);
          color: #d8b4fe;
        }

        .inv-btn-edit:hover:not(:disabled) {
          background: rgba(192, 132, 252, 0.2);
          border-color: rgba(192, 132, 252, 0.3);
          box-shadow: 0 2px 10px rgba(192, 132, 252, 0.1);
        }

        @media (max-width: 640px) {
          .inv-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .inv-card {
            padding: 16px 12px 14px;
          }

          .inv-qty-display {
            width: 54px;
            height: 54px;
          }

          .inv-qty-number {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}
