import { afterEach, describe, expect, it, vi } from 'vitest'
import { OutboundRateLimiter } from './outboundRateLimiter'

afterEach(() => {
  vi.useRealTimers()
})

describe('OutboundRateLimiter', () => {
  it('queues requests beyond an endpoint group bucket and releases them on refill', async () => {
    vi.useFakeTimers()
    const limiter = new OutboundRateLimiter()

    await Promise.all(Array.from({ length: 12 }, () => limiter.wait('/api/prices')))
    const queued = limiter.wait('/api/prices')
    let released = false
    void queued.then(() => {
      released = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(released).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await queued
    expect(released).toBe(true)
  })

  it('removes an aborted queued request without consuming a future token', async () => {
    vi.useFakeTimers()
    const limiter = new OutboundRateLimiter()
    await Promise.all(Array.from({ length: 12 }, () => limiter.wait('/api/prices')))

    const controller = new AbortController()
    const queued = limiter.wait('/api/prices', controller.signal)
    controller.abort()

    await expect(queued).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('holds queued work for a server-directed backoff window', async () => {
    vi.useFakeTimers()
    const limiter = new OutboundRateLimiter()
    await limiter.wait('/api/prices')
    limiter.blockFor(2_000)

    const queued = limiter.wait('/api/prices')
    let released = false
    void queued.then(() => {
      released = true
    })

    await vi.advanceTimersByTimeAsync(1_999)
    expect(released).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await queued
    expect(released).toBe(true)
  })
})
