import { Component } from 'react'
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { label = 'esta página' } = this.props
    const message = this.state.error?.message || 'Erro desconhecido.'

    return (
      <div className="eb-wrapper">
        <div className="eb-card">
          <div className="eb-icon">
            <AlertTriangle size={30} style={{ color: 'var(--red-400)' }} />
          </div>

          <div>
            <h2 className="eb-title">Algo deu errado</h2>
            <p className="eb-subtitle">
              Ocorreu um erro inesperado em {label}.<br />
              Tente novamente ou recarregue a página.
            </p>
          </div>

          <div className="eb-detail">{message}</div>

          <div className="eb-actions">
            <button className="eb-btn-retry" onClick={this.reset}>
              <RotateCcw size={15} />
              Tentar novamente
            </button>
            <button className="eb-btn-reload" onClick={() => window.location.reload()}>
              <RefreshCw size={15} />
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    )
  }
}
