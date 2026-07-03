import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore, toast } from '../stores/toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('toastStore', () => {
  it('adds a toast with correct message and type', () => {
    useToastStore.getState().addToast('Test message', 'success', 3000)
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Test message')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeDefined()
  })

  it('removes a toast by id', () => {
    useToastStore.getState().addToast('To remove', 'info', 3000)
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().removeToast(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('only keeps the last 5 toasts', () => {
    for (let i = 0; i < 7; i++) {
      useToastStore.getState().addToast(`msg ${i}`, 'info', 99999)
    }
    expect(useToastStore.getState().toasts).toHaveLength(5)
  })

  it('toast.error adds error-type toast', () => {
    toast.error('something broke')
    const { toasts } = useToastStore.getState()
    expect(toasts[0].type).toBe('error')
    expect(toasts[0].message).toBe('something broke')
  })

  it('toast.success adds success-type toast', () => {
    toast.success('saved!')
    expect(useToastStore.getState().toasts[0].type).toBe('success')
  })

  it('toast.warning adds warning-type toast', () => {
    toast.warning('watch out')
    expect(useToastStore.getState().toasts[0].type).toBe('warning')
  })

  it('toast.info adds info-type toast', () => {
    toast.info('heads up')
    expect(useToastStore.getState().toasts[0].type).toBe('info')
  })

  it('auto-removes toast after duration', async () => {
    vi.useFakeTimers()
    useToastStore.getState().addToast('short lived', 'info', 100)
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(150)
    expect(useToastStore.getState().toasts).toHaveLength(0)
    vi.useRealTimers()
  })

  it('each toast has a unique id', () => {
    useToastStore.getState().addToast('a', 'info', 3000)
    useToastStore.getState().addToast('b', 'info', 3000)
    const { toasts } = useToastStore.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })
})
