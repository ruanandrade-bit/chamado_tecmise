import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import ToastContainer from '../components/Toast'
import { useToastStore } from '../stores/toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a toast with the correct message', () => {
    useToastStore.getState().addToast('Server error', 'error', 5000)
    render(<ToastContainer />)
    expect(screen.getByText('Server error')).toBeInTheDocument()
  })

  it('renders "Erro" title for error toasts', () => {
    useToastStore.getState().addToast('fail', 'error', 5000)
    render(<ToastContainer />)
    expect(screen.getByText('Erro')).toBeInTheDocument()
  })

  it('renders "Sucesso" title for success toasts', () => {
    useToastStore.getState().addToast('saved!', 'success', 3000)
    render(<ToastContainer />)
    expect(screen.getByText('Sucesso')).toBeInTheDocument()
  })

  it('renders "Atenção" title for warning toasts', () => {
    useToastStore.getState().addToast('watch out', 'warning', 4000)
    render(<ToastContainer />)
    expect(screen.getByText('Atenção')).toBeInTheDocument()
  })

  it('renders "Info" title for info toasts', () => {
    useToastStore.getState().addToast('heads up', 'info', 3500)
    render(<ToastContainer />)
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('removes toast from store when close button is clicked', () => {
    useToastStore.getState().addToast('dismiss me', 'info', 3500)
    render(<ToastContainer />)
    const closeBtn = screen.getByRole('button', { name: /fechar/i })
    fireEvent.click(closeBtn)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('removes toast from store when the toast body is clicked', () => {
    useToastStore.getState().addToast('click to close', 'warning', 4000)
    render(<ToastContainer />)
    const alert = screen.getByRole('alert')
    fireEvent.click(alert)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('renders multiple toasts', () => {
    useToastStore.getState().addToast('first', 'error', 5000)
    useToastStore.getState().addToast('second', 'success', 3000)
    render(<ToastContainer />)
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('uses role="alert" on each toast item', () => {
    useToastStore.getState().addToast('a', 'info', 3500)
    useToastStore.getState().addToast('b', 'info', 3500)
    render(<ToastContainer />)
    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })
})
