import { useState } from 'react'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(email, password)

    if (success) {
      setEmail('')
      setPassword('')
    } else {
      setError('Email ou senha incorretos. Tente novamente.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* S4S watermark background */}
      <div className="login-bg-watermark">
        <span className="login-watermark-text">S4S</span>
      </div>

      {/* Aurora glow effects */}
      <div className="login-aurora">
        <div className="login-aurora-beam login-aurora-beam-1"></div>
        <div className="login-aurora-beam login-aurora-beam-2"></div>
        <div className="login-aurora-beam login-aurora-beam-3"></div>
      </div>

      {/* Glassmorphism login card */}
      <div className="login-card">
        {/* Logo and title */}
        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src="/logo.png" alt="Logo S4S" className="login-logo" />
          </div>
          <h1 className="login-title">S4S Chamados</h1>
          <p className="login-subtitle">Sistema interno de gestão de chamados</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Error alert */}
          {error && (
            <div className="login-error">
              <AlertCircle size={18} className="login-error-icon" />
              <p>{error}</p>
            </div>
          )}

          {/* Email input */}
          <div className="login-input-group">
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@s4s.com"
                className="login-input"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="login-input-group">
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                required
              />
            </div>
          </div>

          {/* Login button with animation */}
          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            <span className="login-btn-text">
              {loading ? 'Entrando...' : 'Entrar'}
            </span>
            <span className="login-btn-icon-wrapper">
              <ArrowRight size={18} className="login-btn-icon" />
            </span>
            <span className="login-btn-glow"></span>
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>S4S Chamados © 2026</p>
        </div>
      </div>

    </div>
  )
}
