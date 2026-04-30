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
          <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #9ca3af; font-size: 12px; font-weight: 600; width: 40px;">${String(i + 1).padStart(2, '0')}</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #e5e7eb; font-size: 14px; font-weight: 600;">${item.name}</td>
          <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 8px; background: ${badgeBg}; border: 1px solid ${badgeBorder}; color: ${badgeColor}; font-size: 11px; font-weight: 600;">${badgeText}</span>
          </td>
          <td style="padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); text-align: center; font-size: 20px; font-weight: 800; color: ${qtyColor}; letter-spacing: -0.5px;">${item.quantity}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Estoque S4S - ${dateStr}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #0a0a1a; color: #e5e7eb; min-height: 100vh; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { background: linear-gradient(135deg, #1a1040 0%, #0d0d2b 50%, #0a1628 100%); border-radius: 20px; padding: 32px; margin-bottom: 28px; border: 1px solid rgba(139,92,246,0.15); position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -50%; right: -30%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%); border-radius: 50%; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .logo-s4 { color: #a78bfa; }
    .logo-s { color: #4ade80; }
    .logo-sub { display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
    .date-box { text-align: right; padding: 10px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .date-val { font-size: 16px; font-weight: 700; color: #f3f4f6; }
    .time-val { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .report-title { position: relative; z-index: 1; margin-top: 24px; font-size: 22px; font-weight: 800; color: #f3f4f6; letter-spacing: -0.3px; }
    .report-subtitle { position: relative; z-index: 1; font-size: 13px; color: #6b7280; margin-top: 6px; }
    .summary-grid { display: flex; gap: 12px; margin-bottom: 24px; }
    .summary-card { flex: 1; padding: 18px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .sc-purple { background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.03)); border-color: rgba(139,92,246,0.15); }
    .sc-green { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03)); border-color: rgba(34,197,94,0.15); }
    .sc-red { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03)); border-color: rgba(239,68,68,0.15); }
    .sc-blue { background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03)); border-color: rgba(59,130,246,0.15); }
    .sc-value { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .v-purple { color: #c4b5fd; } .v-green { color: #86efac; } .v-red { color: #fca5a5; } .v-blue { color: #93c5fd; }
    .sc-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-wrap { background: #12122a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 14px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    thead th:first-child { text-align: left; }
    thead th:nth-child(3), thead th:last-child { text-align: center; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #4b5563; border-top: 1px solid rgba(255,255,255,0.04); }
    .footer-line { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .footer-dot { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: #4b5563; }
    @media print { body { background: #0a0a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div>
          <div class="logo"><span class="logo-s4">S4</span><span class="logo-s">S</span></div>
          <span class="logo-sub">Sistema de Chamados</span>
        </div>
        <div class="date-box">
          <div class="date-val">${dateStr}</div>
          <div class="time-val">${timeStr}</div>
        </div>
      </div>
      <div class="report-title">📦 Relatório de Estoque</div>
      <div class="report-subtitle">Inventário completo de componentes e materiais</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card sc-purple"><div class="sc-value v-purple">${items.length}</div><div class="sc-label">Total Itens</div></div>
      <div class="summary-card sc-blue"><div class="sc-value v-blue">${totalItems}</div><div class="sc-label">Em Estoque</div></div>
      <div class="summary-card sc-green"><div class="sc-value v-green">${inStock}</div><div class="sc-label">Disponíveis</div></div>
      <div class="summary-card sc-red"><div class="sc-value v-red">${outOfStock}</div><div class="sc-label">Zerados</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th style="width:50px">#</th><th style="text-align:left">Item</th><th>Status</th><th style="width:100px">Qtd</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-line">
        <span>S4S Chamados</span><span class="footer-dot"></span>
        <span>Relatório gerado em ${dateStr} às ${timeStr}</span><span class="footer-dot"></span>
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
