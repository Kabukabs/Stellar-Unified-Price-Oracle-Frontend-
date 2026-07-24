export interface PriceData {
  assetPair: string
  price: number
  timestamp: number
  confidence: number
  sources: string[]
}

export type PriceSyncState = 'optimistic' | 'confirmed' | 'rollback' | 'synced'

export interface LivePriceEntry {
  data: PriceData
  syncState: PriceSyncState
  flashVersion: number
}

export interface PriceHistoryEntry {
  price: number
  timestamp: number
  confidence: number
  sources: string[]
}

export interface PriceHistoryResponse {
  pair: string
  history: PriceHistoryEntry[]
}

export type SourceName = 'chainlink' | 'redstone' | 'band' | 'reflector'

export interface SourceHealth {
  source: SourceName
  status: 'healthy' | 'degraded' | 'down'
  lastUpdate: number | null
  latency: number | null
}

export interface WsSubscribeMessage {
  action: 'subscribe'
  assetPairs: string[]
}

export interface WsUnsubscribeMessage {
  action: 'unsubscribe'
  assetPairs: string[]
}

export interface WsPriceUpdate {
  type: 'price_update'
  assetPair: string
  price: number
  timestamp: number
  confidence: number
  sources: string[]
}

export type WsMessage = WsPriceUpdate

export interface Alert {
  id: string
  assetPair: string
  upperThreshold: number | null
  lowerThreshold: number | null
  triggerOnce: boolean
  active: boolean
  createdAt: number
  lastTriggeredAt: number | null
}

export interface AlertFormData {
  assetPair: string
  upperThreshold: string
  lowerThreshold: string
  triggerOnce: boolean
}

export interface AlertsContextType {
  alerts: Alert[]
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'lastTriggeredAt'>) => Alert
  updateAlert: (id: string, updates: Partial<Omit<Alert, 'id' | 'createdAt'>>) => void
  removeAlert: (id: string) => void
  getAlertsForPair: (assetPair: string) => Alert[]
  hasAlertsForPair: (assetPair: string) => boolean
  activeCount: number
  isPanelOpen: boolean
  togglePanel: () => void
  markAsRead: (id: string) => void
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
}

// ---------------------------------------------------------------------------
// Known asset pairs
// ---------------------------------------------------------------------------

/**
 * The list of known valid asset pairs recognised by the Oracle.
 * Route parameters like `/prices/:pair` are validated against this list
 * to prevent invalid or malicious inputs from reaching API calls.
 */
export const VALID_PAIRS: readonly string[] = [
  'XLM/USD',
  'BTC/USD',
  'ETH/USD',
  'USDC/USD',
]

/**
 * Checks whether a decoded pair name (e.g. `"BTC/USD"`) is a known valid
 * asset pair. Performs a case-sensitive, exact-match comparison against
 * {@link VALID_PAIRS}.
 */
export function isValidAssetPair(pair: string): boolean {
  return VALID_PAIRS.includes(pair)
}
