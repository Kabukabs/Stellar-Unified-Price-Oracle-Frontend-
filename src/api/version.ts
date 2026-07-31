/**
 * api/version.ts
 *
 * API versioning support for the Stellar Unified Price Oracle frontend.
 *
 * Strategy:
 * - The frontend declares the API version it targets via `CURRENT_API_VERSION`.
 * - Every REST request includes an `Accept-Version` header so the server can
 *   respond with the closest compatible version it supports.
 * - On startup, `detectApiVersion()` pings the `/api/version` endpoint (or
 *   `/health` as fallback) to read the `X-API-Version` response header. If the
 *   server version is incompatible the UI shows a clear error and gracefully
 *   degrades (no data-fetch errors silently swallowed).
 * - `migrateApiPayload()` applies lightweight shape transformations when the
 *   detected server version differs from the current target.
 *
 * Version numbering follows semver MAJOR.MINOR convention. A MAJOR mismatch
 * is considered breaking (incompatible); a MINOR mismatch is a warning.
 */

import { config } from '../config'

// ── Version constants ────────────────────────────────────────────────────────

/** The API version this frontend build targets. */
export const CURRENT_API_VERSION = '1.0'

/** Minimum server API version this frontend can work with. */
export const MIN_COMPATIBLE_API_VERSION = '1.0'

/** Maximum server API version this frontend has been tested against. */
export const MAX_COMPATIBLE_API_VERSION = '1.99'

// ── Types ────────────────────────────────────────────────────────────────────

export type VersionCompatibility = 'compatible' | 'minor-mismatch' | 'incompatible' | 'unknown'

export interface ApiVersionInfo {
  /** Version reported by the server, or null if the endpoint didn't return one */
  serverVersion: string | null
  /** Version the frontend currently targets */
  clientVersion: string
  compatibility: VersionCompatibility
  /** Human-readable description of the compatibility status */
  message: string
  /** Whether any features should be disabled due to incompatibility */
  degraded: boolean
  detectedAt: number
}

// ── Semver helpers ───────────────────────────────────────────────────────────

function parseMajorMinor(version: string): [number, number] | null {
  const parts = version.trim().split('.')
  const major = parseInt(parts[0], 10)
  const minor = parts[1] !== undefined ? parseInt(parts[1], 10) : 0
  if (isNaN(major) || isNaN(minor)) return null
  return [major, minor]
}

/**
 * Determines compatibility between the reported server version and the
 * version range the frontend supports.
 */
export function checkVersionCompatibility(serverVersion: string): VersionCompatibility {
  const server = parseMajorMinor(serverVersion)
  const min = parseMajorMinor(MIN_COMPATIBLE_API_VERSION)
  const max = parseMajorMinor(MAX_COMPATIBLE_API_VERSION)
  const current = parseMajorMinor(CURRENT_API_VERSION)

  if (!server || !min || !max || !current) return 'unknown'

  const [sMajor, sMinor] = server
  const [minMajor] = min
  const [maxMajor] = max
  const [, currentMinor] = current

  // Major version outside supported range → incompatible
  if (sMajor < minMajor || sMajor > maxMajor) return 'incompatible'

  // Same major, minor differs → warn but allow
  if (sMinor !== currentMinor) return 'minor-mismatch'

  return 'compatible'
}

function buildVersionInfo(serverVersion: string | null): ApiVersionInfo {
  if (serverVersion === null) {
    return {
      serverVersion: null,
      clientVersion: CURRENT_API_VERSION,
      compatibility: 'unknown',
      message:
        'Could not determine the API version. The app will continue but some features may not work correctly.',
      degraded: false,
      detectedAt: Date.now(),
    }
  }

  const compatibility = checkVersionCompatibility(serverVersion)

  const messages: Record<VersionCompatibility, string> = {
    compatible: `API version ${serverVersion} is fully compatible.`,
    'minor-mismatch': `API version ${serverVersion} differs from the expected ${CURRENT_API_VERSION}. Minor version mismatches are usually compatible — if you see unexpected behaviour please update either the frontend or backend.`,
    incompatible: `API version ${serverVersion} is incompatible with this frontend (requires ${MIN_COMPATIBLE_API_VERSION}–${MAX_COMPATIBLE_API_VERSION}). Please update the backend or frontend to a compatible version.`,
    unknown: `Unknown API version format "${serverVersion}". Could not determine compatibility.`,
  }

  return {
    serverVersion,
    clientVersion: CURRENT_API_VERSION,
    compatibility,
    message: messages[compatibility],
    degraded: compatibility === 'incompatible',
    detectedAt: Date.now(),
  }
}

// ── Feature detection ─────────────────────────────────────────────────────────

/**
 * Pings the API version endpoint on startup to detect the server version.
 *
 * Resolution order:
 * 1. GET /api/version   — dedicated version endpoint (returns { version: "..." })
 * 2. GET /health        — reads `X-API-Version` response header
 *
 * Returns an {@link ApiVersionInfo} describing the compatibility status.
 * Never throws — on any error it returns an 'unknown' compatibility info so the
 * app can continue operating.
 */
export async function detectApiVersion(signal?: AbortSignal): Promise<ApiVersionInfo> {
  // 1. Try dedicated /api/version endpoint
  try {
    const res = await fetch(`${config.apiUrl}/api/version`, {
      signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Version': CURRENT_API_VERSION,
      },
    })
    if (res.ok) {
      // Check response header first (takes precedence over body)
      const headerVersion = res.headers.get('X-API-Version')
      if (headerVersion) return buildVersionInfo(headerVersion)

      // Fall through to parse JSON body
      const json = await res.json().catch(() => null) as Record<string, unknown> | null
      const bodyVersion =
        typeof json?.version === 'string' ? json.version :
        typeof json?.apiVersion === 'string' ? json.apiVersion :
        null
      if (bodyVersion) return buildVersionInfo(bodyVersion)
    }
  } catch {
    // network error or AbortError — try fallback
    if (signal?.aborted) return buildVersionInfo(null)
  }

  // 2. Fall back to /health — read X-API-Version header
  try {
    const res = await fetch(`${config.apiUrl.replace(/\/api$/, '')}/health`, {
      signal,
      headers: { 'Accept-Version': CURRENT_API_VERSION },
    })
    const headerVersion = res.headers.get('X-API-Version')
    if (headerVersion) return buildVersionInfo(headerVersion)
  } catch {
    if (signal?.aborted) return buildVersionInfo(null)
  }

  return buildVersionInfo(null)
}

// ── Accept-Version header value ───────────────────────────────────────────────

/**
 * Returns the `Accept-Version` header value to include on every API request.
 * Uses the current version by default; pass a detected server version to pin
 * requests to that version if the server supports it.
 */
export function getAcceptVersionHeader(serverVersion?: string | null): string {
  // If the server reported a compatible but different minor version, accept that too
  if (serverVersion && checkVersionCompatibility(serverVersion) === 'minor-mismatch') {
    return serverVersion
  }
  return CURRENT_API_VERSION
}

// ── Migration utilities ────────────────────────────────────────────────────────

/**
 * Applies shape transformations to a raw API payload when the server reports
 * a different version from the frontend target. Useful for backwards compatibility
 * when the backend has not yet been updated.
 *
 * Add cases here as the API evolves. Each migration is a pure function that
 * takes the raw payload and returns the normalised shape.
 *
 * @param payload  - Raw object returned by the API
 * @param fromVersion - The server version the payload came from
 * @param toVersion   - The version shape we want (defaults to CURRENT_API_VERSION)
 */
export function migrateApiPayload<T extends Record<string, unknown>>(
  payload: T,
  fromVersion: string,
  toVersion: string = CURRENT_API_VERSION,
): T {
  const from = parseMajorMinor(fromVersion)
  const to = parseMajorMinor(toVersion)
  if (!from || !to) return payload

  let result: Record<string, unknown> = { ...payload }

  // ── v0.x → v1.0 ────────────────────────────────────────────────────────────
  // Example: pre-v1.0 API used `pair` instead of `assetPair`
  if (from[0] === 0 && to[0] >= 1) {
    if ('pair' in result && !('assetPair' in result)) {
      result = { ...result, assetPair: result['pair'] }
    }
    // pre-v1.0 used integer prices multiplied by 1e6
    if (typeof result['price'] === 'number' && result['price'] > 1_000_000) {
      result = { ...result, price: (result['price'] as number) / 1_000_000 }
    }
    // pre-v1.0 confidence was 0-100 not 0-1
    if (typeof result['confidence'] === 'number' && (result['confidence'] as number) > 1) {
      result = { ...result, confidence: (result['confidence'] as number) / 100 }
    }
  }

  return result as T
}

// ── Version state store ────────────────────────────────────────────────────────

/**
 * Module-level singleton holding the most recently detected API version info.
 * Updated by `initApiVersionDetection()` on app startup.
 */
let _currentVersionInfo: ApiVersionInfo | null = null

type VersionListener = (info: ApiVersionInfo) => void
const versionListeners = new Set<VersionListener>()

export function getApiVersionInfo(): ApiVersionInfo | null {
  return _currentVersionInfo
}

export function subscribeApiVersion(listener: VersionListener): () => void {
  versionListeners.add(listener)
  if (_currentVersionInfo) listener(_currentVersionInfo)
  return () => versionListeners.delete(listener)
}

function setVersionInfo(info: ApiVersionInfo): void {
  _currentVersionInfo = info
  versionListeners.forEach((l) => l(info))
}

/**
 * Runs API version detection on startup and updates the global version state.
 * Safe to call multiple times — concurrent calls are coalesced.
 */
let _detectionInFlight: Promise<ApiVersionInfo> | null = null

export async function initApiVersionDetection(signal?: AbortSignal): Promise<ApiVersionInfo> {
  if (_detectionInFlight) return _detectionInFlight
  _detectionInFlight = detectApiVersion(signal).then((info) => {
    setVersionInfo(info)
    _detectionInFlight = null

    if (import.meta.env.DEV) {
      const icon = info.compatibility === 'compatible' ? '✅' : info.compatibility === 'incompatible' ? '❌' : '⚠️'
      console.info(`[API Version] ${icon} Server: ${info.serverVersion ?? 'unknown'} / Client: ${info.clientVersion} — ${info.compatibility}`)
    }

    return info
  })
  return _detectionInFlight
}

// ── CI / testing helper ───────────────────────────────────────────────────────

/**
 * Validates that a given version string is compatible with the current frontend.
 * Throws with a descriptive message if incompatible. Use in CI scripts or tests.
 */
export function assertVersionCompatible(serverVersion: string): void {
  const compat = checkVersionCompatibility(serverVersion)
  if (compat === 'incompatible') {
    throw new Error(
      `API version incompatibility: server reports v${serverVersion}, ` +
      `frontend requires v${MIN_COMPATIBLE_API_VERSION}–${MAX_COMPATIBLE_API_VERSION}. ` +
      `Update the backend or frontend to resolve this.`,
    )
  }
}
