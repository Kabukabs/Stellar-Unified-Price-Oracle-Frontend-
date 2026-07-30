import { rateLimitManager } from './rateLimit'

export type EndpointGroup = 'prices' | 'history' | 'health' | 'default'

export const OUTBOUND_RATE_LIMITS: Record<EndpointGroup, { capacity: number; refillMs: number }> = {
  prices: { capacity: 12, refillMs: 1_000 },
  history: { capacity: 4, refillMs: 1_000 },
  health: { capacity: 2, refillMs: 1_000 },
  default: { capacity: 6, refillMs: 1_000 },
}

interface QueueEntry {
  resolve: () => void
  reject: (reason: DOMException) => void
  signal?: AbortSignal
}

interface Bucket {
  tokens: number
  updatedAt: number
  blockedUntil: number
  queue: QueueEntry[]
  timer: ReturnType<typeof setTimeout> | null
}

function groupForUrl(input: RequestInfo | URL): EndpointGroup {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
  if (value.includes('/history')) return 'history'
  if (value.includes('/health')) return 'health'
  if (value.includes('/prices')) return 'prices'
  return 'default'
}

export class OutboundRateLimiter {
  private buckets = new Map<EndpointGroup, Bucket>()

  wait(input: RequestInfo | URL, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))

    const group = groupForUrl(input)
    const bucket = this.getBucket(group)
    this.refill(bucket, group)

    if (bucket.tokens >= 1 && bucket.queue.length === 0 && Date.now() >= bucket.blockedUntil) {
      bucket.tokens -= 1
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = { resolve, reject, signal }
      const onAbort = () => {
        const index = bucket.queue.indexOf(entry)
        if (index >= 0) bucket.queue.splice(index, 1)
        this.publishQueueState()
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      bucket.queue.push(entry)
      this.publishQueueState()
      this.scheduleDrain(bucket, group)
    })
  }

  blockFor(retryAfterMs: number): void {
    const until = Date.now() + Math.max(0, retryAfterMs)
    for (const [group, bucket] of this.buckets) {
      bucket.blockedUntil = Math.max(bucket.blockedUntil, until)
      this.scheduleDrain(bucket, group)
    }
    rateLimitManager.setRateLimited(Math.max(1, Math.ceil(retryAfterMs / 1_000)))
  }

  private getBucket(group: EndpointGroup): Bucket {
    const existing = this.buckets.get(group)
    if (existing) return existing
    const config = OUTBOUND_RATE_LIMITS[group]
    const bucket: Bucket = { tokens: config.capacity, updatedAt: Date.now(), blockedUntil: 0, queue: [], timer: null }
    this.buckets.set(group, bucket)
    return bucket
  }

  private refill(bucket: Bucket, group: EndpointGroup): void {
    const config = OUTBOUND_RATE_LIMITS[group]
    const elapsed = Date.now() - bucket.updatedAt
    const tokens = Math.floor(elapsed / config.refillMs)
    if (tokens > 0) {
      bucket.tokens = Math.min(config.capacity, bucket.tokens + tokens)
      bucket.updatedAt += tokens * config.refillMs
    }
  }

  private scheduleDrain(bucket: Bucket, group: EndpointGroup): void {
    if (bucket.timer || bucket.queue.length === 0) return
    this.refill(bucket, group)
    const config = OUTBOUND_RATE_LIMITS[group]
    const waitForToken = bucket.tokens >= 1 ? 0 : Math.max(1, config.refillMs - (Date.now() - bucket.updatedAt))
    const wait = Math.max(waitForToken, bucket.blockedUntil - Date.now(), 0)
    bucket.timer = setTimeout(() => this.drain(bucket, group), wait)
  }

  private drain(bucket: Bucket, group: EndpointGroup): void {
    bucket.timer = null
    this.refill(bucket, group)
    if (Date.now() >= bucket.blockedUntil) {
      while (bucket.tokens >= 1 && bucket.queue.length > 0) {
        bucket.tokens -= 1
        bucket.queue.shift()?.resolve()
      }
    }
    this.publishQueueState()
    this.scheduleDrain(bucket, group)
  }

  private publishQueueState(): void {
    const queued = [...this.buckets.values()].reduce((total, bucket) => total + bucket.queue.length, 0)
    if (queued === 0) return
    rateLimitManager.setRateLimited(1)
  }
}

export const outboundRateLimiter = new OutboundRateLimiter()
