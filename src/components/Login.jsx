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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary-light/5 rounded-full -top-20 -right-20 blur-3xl"></div>
        <div className="absolute w-96 h-96 bg-primary/5 rounded-full -bottom-20 -left-20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-slideInUp">
        {/* Logo and title */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Logo S4S" className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-bold mb-2 text-dark-100">S4S Chamados</h1>
          <p className="text-dark-400">Gestão moderna de atendimento educacional</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-8">
          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-slideInUp">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-dark-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input-base w-full !pl-11"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-dark-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base w-full !pl-11"
                required
              />
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-dark-500">
          <p>S4S Chamados © 2026 • Versão 1.0</p>
        </div>
      </div>
    </div>
  )
}
