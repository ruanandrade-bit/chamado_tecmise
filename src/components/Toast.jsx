import { createPortal } from 'react-dom'
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useToastStore } from '../stores/toastStore'
import './Toast.css'

const ICONS = {
  error:   AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info:    Info,
}

const TITLES = {
  error:   'Erro',
  success: 'Sucesso',
  warning: 'Atenção',
  info:    'Info',
}

const DURATIONS = {
  error:   5000,
  success: 3000,
  warning: 4000,
  info:    3500,
}

function ToastItem({ toast, onRemove }) {
  const Icon = ICONS[toast.type] || AlertCircle
  const duration = DURATIONS[toast.type] || 4000

  return (
    <div
      className={`toast-item toast-${toast.type}`}
      onClick={() => onRemove(toast.id)}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-icon">
        <Icon size={16} />
      </div>

      <div className="toast-body">
        <p className="toast-title">{TITLES[toast.type]}</p>
        <p className="toast-message">{toast.message}</p>
      </div>

      <button
        className="toast-close"
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id) }}
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>

      <div
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container" aria-label="Notificações">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  )
}
