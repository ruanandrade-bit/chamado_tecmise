import { useState } from 'react'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

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
          <p className="login-subtitle">Gestão moderna de atendimento educacional</p>
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
                placeholder="usuario@educacao.com.br"
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

      <style>{`
        .login-page {
          min-height: 100vh;
          background: #050510;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 1rem;
        }

        /* ── S4S Watermark ── */
        .login-bg-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
        }

        .login-watermark-text {
          font-size: clamp(20rem, 45vw, 45rem);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.03);
          letter-spacing: -0.02em;
          user-select: none;
          line-height: 1;
          text-shadow: 0 0 80px rgba(34, 197, 94, 0.05);
        }

        /* ── Aurora Background ── */
        .login-aurora {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .login-aurora-beam {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .login-aurora-beam-1 {
          width: 600px;
          height: 200px;
          background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2), transparent);
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          animation: auroraWave 8s ease-in-out infinite;
        }

        .login-aurora-beam-2 {
          width: 400px;
          height: 150px;
          background: linear-gradient(90deg, transparent, rgba(134, 239, 172, 0.15), transparent);
          bottom: 20px;
          left: 30%;
          animation: auroraWave 6s ease-in-out infinite reverse;
        }

        .login-aurora-beam-3 {
          width: 500px;
          height: 120px;
          background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.1), rgba(34, 197, 94, 0.15), transparent);
          bottom: 0;
          right: 10%;
          animation: auroraWave 10s ease-in-out infinite;
        }

        @keyframes auroraWave {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(-50%) scaleX(1.3);
            opacity: 0.5;
          }
        }

        /* ── Glassmorphism Card ── */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(15, 15, 30, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px 40px 36px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.03),
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardAppear {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Header ── */
        .login-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .login-logo-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .login-logo {
          width: 72px;
          height: 72px;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3));
          animation: logoPulse 3s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3));
          }
          50% {
            filter: drop-shadow(0 4px 20px rgba(34, 197, 94, 0.5));
          }
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f3f4f6;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        /* ── Form ── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-input-group {
          display: flex;
          flex-direction: column;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 16px;
          color: #6b7280;
          transition: color 0.2s ease;
          z-index: 1;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #e5e7eb;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .login-input::placeholder {
          color: #6b7280;
        }

        .login-input:focus {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1), 0 0 20px rgba(34, 197, 94, 0.05);
          background: rgba(255, 255, 255, 0.06);
        }

        .login-input:focus + .login-input-icon,
        .login-input:focus ~ .login-input-icon {
          color: #22c55e;
        }

        .login-input-wrapper:focus-within .login-input-icon {
          color: #22c55e;
        }

        /* ── Error ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.85rem;
          animation: shakeError 0.4s ease-in-out;
        }

        .login-error-icon {
          flex-shrink: 0;
          color: #f87171;
        }

        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ── Button ── */
        .login-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 24px;
          margin-top: 8px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 10px rgba(34, 197, 94, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-btn-text {
          position: relative;
          z-index: 2;
        }

        .login-btn-icon-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .login-btn:hover:not(:disabled) .login-btn-icon-wrapper {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(4px);
        }

        .login-btn-icon {
          color: #fff;
          transition: transform 0.3s ease;
        }

        .login-btn:hover:not(:disabled) .login-btn-icon {
          animation: arrowBounce 0.6s ease-in-out infinite;
        }

        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        /* Glow sweep effect */
        .login-btn-glow {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          z-index: 1;
          animation: glowSweep 3s ease-in-out infinite;
        }

        @keyframes glowSweep {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }

        /* Pulse ring animation */
        .login-btn::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          background: linear-gradient(135deg, #22c55e, #86efac, #22c55e);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: ringPulse 2.5s ease-in-out infinite;
        }

        .login-btn:hover::before {
          opacity: 1;
        }

        @keyframes ringPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }

        /* ── Footer ── */
        .login-footer {
          margin-top: 32px;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.75rem;
          color: #6b7280;
          letter-spacing: 0.02em;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .login-card {
            padding: 36px 24px 28px;
            border-radius: 20px;
          }

          .login-watermark-text {
            font-size: 14rem;
          }
        }
      `}</style>
    </div>
  )
}
