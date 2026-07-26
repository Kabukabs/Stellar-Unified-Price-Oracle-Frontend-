/**
 * Single entry point for browser-persisted user data.
 *
 * ## Policy: nothing sensitive goes in `localStorage`
 *
 * `localStorage` is plain text, readable by any script running on the origin, and it
 * survives indefinitely. A single XSS bug exfiltrates all of it. Therefore **never**
 * persist any of the following through this module or directly:
 *
 * - Auth tokens, session IDs, refresh tokens, API keys
 * - Webhook signing secrets or any other shared secret
 * - Passwords or password-equivalent material
 * - PII beyond what the user typed into a local-only setting (no names, addresses,
 *   government IDs, financial account numbers)
 *
 * Secrets belong in memory for the session, or behind an httpOnly cookie set by the
 * backend. If a feature seems to need a persisted secret, that is a signal the
 * operation belongs on the server, not in the browser.
 *
 * What lives here today is deliberately mundane: alert thresholds, notification
 * routing config, an analytics opt-out flag, and the theme choice.
 *
 * ## Why route through this module
 *
 * Every key is registered in {@link STORAGE_KEYS}, so the full set of persisted data
 * is greppable in one place and {@link clearAllData} can guarantee it removes all of
 * it. Reads and writes are failure-tolerant: Safari private mode and blocked-cookie
 * settings make `localStorage` throw, and a thrown storage error should never take
 * down a render.
 *
 * Swapping backends (sessionStorage, IndexedDB, a server-side profile) means changing
 * the helpers below rather than every call site.
 */

import { idbCache } from '../hooks/useIndexedDB'

/**
 * Every `localStorage` key the app owns.
 *
 * Adding a key here is a deliberate act — re-read the policy above first.
 */
export const STORAGE_KEYS = {
  /** Price alert definitions (asset pair + thresholds). */
  alerts: 'price-alerts',
  /** Notification routing config. Never includes the webhook secret — see the policy above. */
  notificationChannels: 'notification-channels',
  /** `'1'` when the user has opted out of analytics. */
  analyticsOptOut: 'analyticsOptOut',
  /** `'dark'` / `'light'`. Also read by the pre-paint script in `index.html`. */
  theme: 'stellar-oracle-theme',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** IndexedDB stores cleared by {@link clearAllData}. */
const IDB_STORES = ['prices', 'history', 'preferences'] as const

/** Reads a raw string. Returns `null` when absent or when storage is unavailable. */
export function readRaw(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Writes a raw string. No-ops when storage is unavailable. */
export function writeRaw(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode, quota, blocked cookies) */
  }
}

/**
 * Reads and parses JSON, returning `fallback` when the key is absent, storage is
 * unavailable, or the stored value is not valid JSON.
 *
 * Pass `validate` to reject data that parses but has the wrong shape — stored data is
 * untrusted input, since anything on the origin can have written it.
 */
export function readJson<T>(key: StorageKey, fallback: T, validate?: (value: unknown) => value is T): T {
  const raw = readRaw(key)
  if (raw === null) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    if (validate) return validate(parsed) ? parsed : fallback
    return parsed as T
  } catch {
    return fallback
  }
}

/** Serializes and writes JSON. No-ops when storage is unavailable. */
export function writeJson(key: StorageKey, value: unknown): void {
  try {
    writeRaw(key, JSON.stringify(value))
  } catch {
    /* value was not serializable */
  }
}

/** Removes a single key. */
export function remove(key: StorageKey): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Removes every piece of user data the app has persisted — all registered
 * `localStorage` keys plus the IndexedDB caches.
 *
 * Intended for a "clear my data" control and for logout, once auth exists. Only keys
 * in {@link STORAGE_KEYS} are touched, so unrelated data on the origin is left alone.
 */
export async function clearAllData(): Promise<void> {
  for (const key of Object.values(STORAGE_KEYS)) {
    remove(key)
  }
  await Promise.all(IDB_STORES.map((store) => idbCache.clear(store)))
}
