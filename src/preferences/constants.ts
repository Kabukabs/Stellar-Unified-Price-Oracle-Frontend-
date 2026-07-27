import type {
  AccessibilityPreferences,
  DataPreferences,
  LayoutPreferences,
  Preferences,
  PrivacyPreferences,
} from './types'

/** Defaults grouped to match the slices in `slices.ts`. */
export const DEFAULT_DATA_PREFERENCES: DataPreferences = {
  refreshInterval: 10000,
  chartTimeRange: '24h',
  staleThresholdMinutes: 5,
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  dashboardView: 'card',
  cardOrder: [],
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
}

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  analyticsOptOut: false,
  chartTimezone: 'UTC',
} as const

export const MAX_UNDO_DEPTH = 20

export const REFRESH_INTERVAL_OPTIONS = [
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
  { value: 30000, label: '30 seconds' },
  { value: 60000, label: '1 minute' },
] as const

export const CHART_RANGE_OPTIONS = [
  { value: '24h' as const, label: '24 Hours' },
  { value: '7d' as const, label: '7 Days' },
  { value: '30d' as const, label: '30 Days' },
] as const

export const STALE_THRESHOLD_OPTIONS = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
] as const

export const CHART_TIMEZONE_OPTIONS = [
  { value: 'UTC' as const, label: 'UTC', abbr: 'UTC' },
  { value: 'Local' as const, label: 'Local', abbr: 'Local' },
  { value: 'America/New_York' as const, label: 'New York (ET)', abbr: 'ET' },
  { value: 'Europe/London' as const, label: 'London (GMT/BST)', abbr: 'London' },
  { value: 'Asia/Tokyo' as const, label: 'Tokyo (JST)', abbr: 'JST' },
] as const
