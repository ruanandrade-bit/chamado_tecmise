import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from '../components/ErrorBoundary'

let bombActive = true

function Bomb() {
  if (bombActive) throw new Error('Test crash')
  return <div>child content</div>
}

function Safe() {
  return <div>safe child</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(<ErrorBoundary><Safe /></ErrorBoundary>)
    expect(screen.getByText('safe child')).toBeInTheDocument()
  })

  it('shows fallback UI when a child throws', () => {
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('displays the error message in the detail block', () => {
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText('Test crash')).toBeInTheDocument()
  })

  it('shows custom label inside the error subtitle', () => {
    bombActive = true
    render(<ErrorBoundary label="o Kanban"><Bomb /></ErrorBoundary>)
    expect(screen.getByText(/o Kanban/)).toBeInTheDocument()
  })

  it('uses default label when no label prop is provided', () => {
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText(/esta página/)).toBeInTheDocument()
  })

  it('shows retry and reload buttons in error state', () => {
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
    expect(screen.getByText('Recarregar página')).toBeInTheDocument()
  })

  it('reload button calls window.location.reload', () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    })
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    fireEvent.click(screen.getByText('Recarregar página'))
    expect(reload).toHaveBeenCalledOnce()
  })

  it('retry button resets state so children can render again', () => {
    bombActive = true
    render(<ErrorBoundary><Bomb /></ErrorBoundary>)
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()

    bombActive = false
    fireEvent.click(screen.getByText('Tentar novamente'))

    expect(screen.getByText('child content')).toBeInTheDocument()
  })
})
