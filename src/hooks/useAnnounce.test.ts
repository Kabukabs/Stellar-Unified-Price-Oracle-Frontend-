import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnnounce } from './useAnnounce'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  // Clean up any created live regions
  const region = document.getElementById('sr-announcer')
  if (region) region.remove()
})

describe('useAnnounce', () => {
  it('creates a live region on first announce', () => {
    const { result } = renderHook(() => useAnnounce())

    act(() => {
      result.current('Price updated')
    })

    // Need to advance past requestAnimationFrame
    act(() => {
      vi.advanceTimersByTime(100)
    })

    const region = document.getElementById('sr-announcer')
    expect(region).not.toBeNull()
    expect(region!.getAttribute('role')).toBe('status')
    expect(region!.getAttribute('aria-live')).toBe('polite')
    expect(region!.getAttribute('aria-atomic')).toBe('true')
    expect(region!.textContent).toBe('Price updated')
  })

  it('throttles announcements', () => {
    const { result } = renderHook(() => useAnnounce({ throttleMs: 5000 }))

    act(() => {
      result.current('First message')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const region = document.getElementById('sr-announcer')
    expect(region!.textContent).toBe('First message')

    // Try to announce again within throttle window
    act(() => {
      result.current('Second message')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Should still be the first message (throttled)
    expect(region!.textContent).toBe('First message')
  })

  it('allows announcement after throttle period', () => {
    const { result } = renderHook(() => useAnnounce({ throttleMs: 1000 }))

    act(() => {
      result.current('First message')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const region = document.getElementById('sr-announcer')
    expect(region!.textContent).toBe('First message')

    // Advance past throttle period
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    act(() => {
      result.current('Second message')
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(region!.textContent).toBe('Second message')
  })
})
