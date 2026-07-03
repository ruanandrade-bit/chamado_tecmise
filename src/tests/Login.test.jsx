import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import Login from '../components/Login'
import { useAuthStore } from '../stores/authStore'

describe('Login', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue({ login: vi.fn().mockResolvedValue(true) })
  })

  it('renders email and password inputs', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('usuario@s4s.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders the login button', () => {
    render(<Login />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
  })

  it('shows the app title', () => {
    render(<Login />)
    expect(screen.getByText('S4S Chamados')).toBeInTheDocument()
  })

  it('shows error message when login returns false', async () => {
    useAuthStore.mockReturnValue({ login: vi.fn().mockResolvedValue(false) })
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('usuario@s4s.com'), {
      target: { value: 'test@s4s.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpassword' }
    })
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Email ou senha incorretos. Tente novamente.')).toBeInTheDocument()
    })
  })

  it('does not show error message on initial render', () => {
    render(<Login />)
    expect(screen.queryByText('Email ou senha incorretos. Tente novamente.')).not.toBeInTheDocument()
  })

  it('disables button and shows "Entrando..." while submitting', async () => {
    let resolveLogin
    const pendingLogin = new Promise(resolve => { resolveLogin = resolve })
    useAuthStore.mockReturnValue({ login: vi.fn().mockReturnValue(pendingLogin) })

    render(<Login />)
    fireEvent.change(screen.getByPlaceholderText('usuario@s4s.com'), {
      target: { value: 'user@s4s.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass' }
    })
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Entrando...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    resolveLogin(true)
  })

  it('calls login with the typed email and password', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true)
    useAuthStore.mockReturnValue({ login: mockLogin })
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('usuario@s4s.com'), {
      target: { value: 'ruan@s4s.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'MyPass123!' }
    })
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ruan@s4s.com', 'MyPass123!')
    })
  })
})
