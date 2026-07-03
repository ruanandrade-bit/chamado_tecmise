import '@testing-library/jest-dom'
import { vi } from 'vitest'

function MockIcon() { return null }

vi.mock('lucide-react', () => ({
  AlertCircle:   MockIcon,
  CheckCircle2:  MockIcon,
  AlertTriangle: MockIcon,
  Info:          MockIcon,
  X:             MockIcon,
  Mail:          MockIcon,
  Lock:          MockIcon,
  ArrowRight:    MockIcon,
  Paperclip:     MockIcon,
  Archive:       MockIcon,
  Flame:         MockIcon,
  Gauge:         MockIcon,
  Leaf:          MockIcon,
  RotateCcw:     MockIcon,
  RefreshCw:     MockIcon,
}))

const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' &&
        (args[0].includes('Warning:') || args[0].includes('[ErrorBoundary]'))) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
