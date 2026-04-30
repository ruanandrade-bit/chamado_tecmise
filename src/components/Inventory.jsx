import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Minus, Pencil, Check, X, Loader2 } from 'lucide-react'
import { api } from '../services/api'

const ITEM_ICONS = {
  'tomada-inicial': '🔌',
  'tomada-nova': '⚡',
  'tomada-original': '🔋',
  'cam-logitech': '📷',
  'raspberry-pi': '🖥️',
  'micro-sd': '💾',
  'cooler': '❄️',
  'cabo-usb': '🔗',
  'falta-imprimir': '🖨️',
  'completo': '✅',
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
            const icon = ITEM_ICONS[item.id] || '📦'
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
                  <span className="inv-card-icon">{icon}</span>
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
