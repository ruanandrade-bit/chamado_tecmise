import { useState, useEffect, useCallback } from 'react'
import {
  Package, Plus, Minus, Pencil, Check, X, Loader2, Download, Boxes, Trash2,
  Plug, Zap, Battery, Camera, Cpu, HardDrive, Fan, Cable, Printer, CheckCircle2, Usb
} from 'lucide-react'
import { api } from '../services/api'
import { S4S_LOGO_BASE64 } from '../utils/logoBase64'

const ITEM_CONFIG = {
  'tomada-inicial': { Icon: Plug, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  'tomada-nova': { Icon: Zap, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)' },
  'tomada-original': { Icon: Battery, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  'cam-logitech': { Icon: Camera, color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)' },
  'usb-cam-logi': { Icon: Usb, color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
  'raspberry-pi': { Icon: Cpu, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  'micro-sd': { Icon: HardDrive, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  'cooler': { Icon: Fan, color: '#67e8f9', bg: 'rgba(103,232,249,0.12)', border: 'rgba(103,232,249,0.25)' },
  'cabo-usb': { Icon: Cable, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)' },
  'falta-imprimir': { Icon: Printer, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
  'completo': { Icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)' },
}

const NEW_ITEM_ICON_CONFIG = {
  Icon: Boxes,
  color: '#2dd4bf',
  bg: 'rgba(45,212,191,0.12)',
  border: 'rgba(45,212,191,0.25)'
}

function ItemIcon({ itemId }) {
  const config = ITEM_CONFIG[itemId] || NEW_ITEM_ICON_CONFIG
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
  const [editNameValue, setEditNameValue] = useState('')
  const [editValue, setEditValue] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('0')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const isCustomItem = (itemId) => itemId.startsWith('custom-')

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
    setEditNameValue(item.name)
    setEditValue(String(item.quantity))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditNameValue('')
    setEditValue('')
  }

  const confirmEdit = async (item) => {
    const trimmedName = editNameValue.trim()
    const num = parseInt(editValue, 10)

    if (isCustomItem(item.id) && trimmedName.length < 2) {
      window.alert('Digite um nome com pelo menos 2 caracteres.')
      return
    }

    if (isNaN(num) || num < 0) {
      window.alert('A quantidade precisa ser 0 ou maior.')
      return
    }

    const shouldRename = isCustomItem(item.id) && trimmedName !== item.name
    const shouldUpdateQty = num !== item.quantity

    if (!shouldRename && !shouldUpdateQty) {
      cancelEdit()
      return
    }

    setUpdatingId(item.id)
    try {
      if (shouldRename) {
        const renamed = await api.patch(`/inventory/${item.id}/name`, { name: trimmedName })
        setItems(renamed.items || [])
      }

      if (shouldUpdateQty) {
        const updated = await api.patch(`/inventory/${item.id}`, { quantity: num })
        setItems(updated.items || [])
      }

      cancelEdit()
    } catch (err) {
      console.error('Erro ao editar item:', err)
      window.alert(err.message || 'Não foi possível editar o item.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleEditKeyDown = (e, item) => {
    if (e.key === 'Enter') confirmEdit(item)
    if (e.key === 'Escape') cancelEdit()
  }

  const resetCreateForm = () => {
    setNewItemName('')
    setNewItemQty('0')
    setCreateError('')
  }

  const openCreateForm = () => {
    resetCreateForm()
    setIsCreateOpen(true)
  }

  const closeCreateForm = () => {
    setIsCreateOpen(false)
    resetCreateForm()
  }

  const createInventoryItem = async () => {
    const trimmedName = newItemName.trim()
    const parsedQty = parseInt(newItemQty, 10)

    if (trimmedName.length < 2) {
      setCreateError('Digite um nome com pelo menos 2 caracteres.')
      return
    }
    if (isNaN(parsedQty) || parsedQty < 0) {
      setCreateError('A quantidade inicial precisa ser 0 ou maior.')
      return
    }

    setCreateError('')
    setIsCreating(true)
    try {
      const data = await api.post('/inventory', { name: trimmedName, quantity: parsedQty })
      setItems(data.items || [])
      closeCreateForm()
    } catch (err) {
      console.error('Erro ao criar item:', err)
      setCreateError(err.message || 'Não foi possível criar o item.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateKeyDown = (e) => {
    if (e.key === 'Enter') createInventoryItem()
    if (e.key === 'Escape') closeCreateForm()
  }

  const handleDeleteItem = async (item) => {
    if (!isCustomItem(item.id)) return

    const confirmed = window.confirm(`Remover o item "${item.name}" do estoque?`)
    if (!confirmed) return

    setUpdatingId(item.id)
    try {
      const data = await api.delete(`/inventory/${item.id}`)
      setItems(data.items || [])
    } catch (err) {
      console.error('Erro ao remover item:', err)
      window.alert(err.message || 'Não foi possível remover o item.')
    } finally {
      setUpdatingId(null)
    }
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
    .logo-s4 { color: #4ade80; }
    .logo-s { color: #4ade80; }
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
          <img class="logo-img" src="${S4S_LOGO_BASE64}" alt="S4S">
          <div class="logo-text">
            <div class="logo-name"><span class="logo-s4">S4</span><span class="logo-s">S</span> Estoque</div>
          </div>
        </div>
        <div class="date-box">
          <div class="date-val">${dateStr}</div>
          <div class="time-val">${timeStr}</div>
        </div>
      </div>
      <div class="report-info">
        <div class="report-title">Relat\u00f3rio de Estoque</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card sc-purple"><div class="sc-value v-purple">${items.length}</div><div class="sc-label">Total Itens</div></div>
      <div class="summary-card sc-blue"><div class="sc-value v-blue">${totalItems}</div><div class="sc-label">Em Estoque</div></div>
      <div class="summary-card sc-green"><div class="sc-value v-green">${inStock}</div><div class="sc-label">Dispon\u00edveis</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th style="width:36px">#</th><th style="text-align:left">Item</th><th>Status</th><th style="width:80px">Qtd</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-line">
        <span>S4S Estoque</span><span class="footer-dot"></span>
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
          <div className="inv-stats-spacer" />
          <button
            onClick={openCreateForm}
            className="inv-add-item-btn"
            title="Adicionar novo item no estoque"
          >
            <Plus size={15} />
            Novo item
          </button>
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

      {isCreateOpen && (
        <div className="inv-create-panel">
          <div className="inv-create-panel-title">
            <Boxes size={16} />
            Adicionar novo item
          </div>
          <div className="inv-create-grid">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              className="inv-create-input"
              placeholder="Nome do item"
              maxLength={48}
              autoFocus
            />
            <input
              type="number"
              min="0"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              className="inv-create-input inv-create-qty"
              placeholder="0"
            />
            <div className="inv-create-actions">
              <button
                onClick={createInventoryItem}
                disabled={isCreating}
                className="inv-create-btn inv-create-confirm"
                title="Salvar novo item"
              >
                {isCreating ? <Loader2 size={15} className="inv-spin" /> : <Check size={15} />}
                Salvar
              </button>
              <button
                onClick={closeCreateForm}
                disabled={isCreating}
                className="inv-create-btn inv-create-cancel"
                title="Cancelar criação"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
          {createError && <p className="inv-create-error">{createError}</p>}
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
                    <div className="inv-edit-stack">
                      {isCustomItem(item.id) && (
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, item)}
                          className="inv-edit-name-input"
                          maxLength={48}
                          autoFocus
                        />
                      )}
                      <div className="inv-edit-row">
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, item)}
                          className="inv-edit-input"
                          autoFocus={!isCustomItem(item.id)}
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
                    {isCustomItem(item.id) && (
                      <button
                        onClick={() => handleDeleteItem(item)}
                        disabled={isUpdating}
                        className="inv-action-btn inv-btn-delete"
                        title="Excluir item"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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

        .inv-stats-spacer { flex: 1; }

        .inv-stat-value { font-weight: 800; }
        .inv-stat-label { font-weight: 400; opacity: 0.8; }

        .inv-add-item-btn,
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

        .inv-add-item-btn {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.14), rgba(20, 184, 166, 0.08));
          border: 1px solid rgba(45, 212, 191, 0.3);
          color: #5eead4;
        }

        .inv-add-item-btn:hover {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.25), rgba(20, 184, 166, 0.15));
          border-color: rgba(45, 212, 191, 0.45);
          box-shadow: 0 2px 12px rgba(20, 184, 166, 0.16);
          color: #99f6e4;
        }

        .inv-pdf-btn:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.18));
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 2px 12px rgba(139, 92, 246, 0.12);
          color: #ddd6fe;
        }

        .inv-create-panel {
          padding: 16px;
          background: rgba(15, 15, 30, 0.5);
          border: 1px solid rgba(45, 212, 191, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: invCardIn 0.25s ease-out both;
        }

        .inv-create-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #99f6e4;
          margin-bottom: 12px;
        }

        .inv-create-grid {
          display: grid;
          grid-template-columns: minmax(200px, 1fr) 110px auto;
          gap: 10px;
          align-items: center;
        }

        .inv-create-input {
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(45, 212, 191, 0.24);
          background: rgba(12, 12, 28, 0.9);
          color: #f3f4f6;
          padding: 0 12px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .inv-create-qty {
          text-align: center;
          -moz-appearance: textfield;
        }

        .inv-create-qty::-webkit-inner-spin-button,
        .inv-create-qty::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .inv-create-input:focus {
          border-color: rgba(45, 212, 191, 0.45);
          box-shadow: 0 0 12px rgba(45, 212, 191, 0.12);
        }

        .inv-create-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .inv-create-btn {
          height: 38px;
          border-radius: 10px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .inv-create-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .inv-create-confirm {
          color: #99f6e4;
          border-color: rgba(45, 212, 191, 0.35);
          background: rgba(20, 184, 166, 0.15);
        }

        .inv-create-confirm:hover:not(:disabled) {
          background: rgba(20, 184, 166, 0.24);
          border-color: rgba(45, 212, 191, 0.5);
        }

        .inv-create-cancel {
          color: #fbcfe8;
          border-color: rgba(236, 72, 153, 0.35);
          background: rgba(236, 72, 153, 0.1);
        }

        .inv-create-cancel:hover:not(:disabled) {
          background: rgba(236, 72, 153, 0.2);
          border-color: rgba(236, 72, 153, 0.45);
        }

        .inv-create-error {
          margin-top: 10px;
          color: #fda4af;
          font-size: 0.8125rem;
          font-weight: 600;
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
        .inv-edit-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .inv-edit-name-input {
          width: 160px;
          height: 34px;
          border-radius: 9px;
          border: 1.5px solid rgba(45, 212, 191, 0.3);
          background: rgba(15, 15, 30, 0.85);
          color: #e5e7eb;
          font-size: 0.8125rem;
          font-weight: 600;
          text-align: center;
          padding: 0 10px;
          outline: none;
          transition: border-color 0.2s;
        }

        .inv-edit-name-input:focus {
          border-color: rgba(45, 212, 191, 0.55);
          box-shadow: 0 0 10px rgba(45, 212, 191, 0.14);
        }

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
          flex-wrap: wrap;
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

        .inv-btn-delete {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: #fda4af;
        }

        .inv-btn-delete:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.2);
          border-color: rgba(244, 63, 94, 0.35);
          box-shadow: 0 2px 10px rgba(244, 63, 94, 0.12);
        }

        @media (max-width: 860px) {
          .inv-stats-bar {
            flex-wrap: wrap;
          }

          .inv-stats-spacer {
            display: none;
          }

          .inv-add-item-btn,
          .inv-pdf-btn {
            flex: 1;
            justify-content: center;
          }

          .inv-create-grid {
            grid-template-columns: 1fr;
          }

          .inv-create-actions {
            justify-content: stretch;
          }

          .inv-create-btn {
            flex: 1;
            justify-content: center;
          }
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
