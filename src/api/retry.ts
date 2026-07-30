import { config } from '../config'
import { outboundRateLimiter } from './outboundRateLimiter'

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  backoffMultiplier?: number
  maxDelayMs?: number
  jitter?: boolean
}

export type RetryReason = 'network-error' | 'http-5xx' | 'http-429'

export class HttpRetryError extends Error {
  readonly cause: unknown
  readonly attempts: number
  readonly reason: RetryReason | 'non-retryable'

  constructor(message: string, opts: { cause?: unknown; attempts: number; reason: RetryReason | 'non-retryable' }) {
    super(message)
    this.name = 'HttpRetryError'
    this.cause = opts.cause
    this.attempts = opts.attempts
    this.reason = opts.reason
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

function parseRetryAfter(header: string | null, now = Date.now()): number | null {
  if (!header?.trim()) return null
  const trimmed = header.trim()
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.max(0, Math.ceil(parseFloat(trimmed) * 1_000))
  const parsed = Date.parse(trimmed)
  return Number.isNaN(parsed) ? null : Math.max(0, parsed - now)
}

export function computeBackoffDelay(
  attempt: number,
  opts: {
    baseDelayMs: number
    backoffMultiplier: number
    maxDelayMs: number
    jitter: boolean
    retryAfter?: string | null
    random?: () => number
    now?: () => number
  },
): number {
  const { baseDelayMs, backoffMultiplier, maxDelayMs, jitter, retryAfter, random = Math.random, now = Date.now } = opts
  const serverDelay = parseRetryAfter(retryAfter ?? null, now())
  if (serverDelay !== null) return Math.min(serverDelay, maxDelayMs)
  const capped = Math.min(baseDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs)
  return jitter ? Math.floor(random() * capped) : capped
}

function sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {},
): Promise<Response> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? config.retry.maxAttempts)
  const baseDelayMs = options.baseDelayMs ?? config.retry.baseDelayMs
  const backoffMultiplier = options.backoffMultiplier ?? config.retry.backoffMultiplier
  const maxDelayMs = options.maxDelayMs ?? config.retry.maxDelayMs
  const jitter = options.jitter ?? config.retry.jitter
  let attempt = 0

  while (true) {
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    try {
      await outboundRateLimiter.wait(input, init?.signal)
      const response = await fetch(input, init)
      if (response.ok || !isRetryableStatus(response.status)) return response
      if (attempt + 1 >= maxAttempts) {
        throw new HttpRetryError(`HTTP ${response.status} ${response.statusText}`, {
          cause: response,
          attempts: attempt + 1,
          reason: response.status === 429 ? 'http-429' : 'http-5xx',
        })
      }
      const retryAfter = response.headers.get('Retry-After')
      const delay = computeBackoffDelay(attempt, { baseDelayMs, backoffMultiplier, maxDelayMs, jitter, retryAfter })
      if (response.status === 429) outboundRateLimiter.blockFor(delay)
      attempt += 1
      await sleep(delay, init?.signal)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      if (err instanceof HttpRetryError) throw err
      if (attempt + 1 >= maxAttempts) {
        throw new HttpRetryError(reasonMessage('network-error', err), {
          cause: err,
          attempts: attempt + 1,
          reason: 'network-error',
        })
      }
      const delay = computeBackoffDelay(attempt, { baseDelayMs, backoffMultiplier, maxDelayMs, jitter })
      attempt += 1
      await sleep(delay, init?.signal)
    }
  }
}

function reasonMessage(reason: RetryReason, err: unknown): string {
  return err instanceof Error && err.message ? `${reason}: ${err.message}` : reason
}
