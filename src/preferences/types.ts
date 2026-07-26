export type ChartTimeRange = '24h' | '7d' | '30d'
export type RefreshInterval = 5000 | 10000 | 30000 | 60000
export type DashboardView = 'card' | 'table'

/** How often and over what window price data is fetched and judged stale. */
export interface DataPreferences {
  refreshInterval: RefreshInterval
  chartTimeRange: ChartTimeRange
  staleThresholdMinutes: number
}

/** How the dashboard arranges what it shows. */
export interface LayoutPreferences {
  dashboardView: DashboardView
  cardOrder: string[]
}

/** Presentation overrides for users with accessibility needs. */
export interface AccessibilityPreferences {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
}

/** User choices about data collection. */
export interface PrivacyPreferences {
  analyticsOptOut?: boolean
}

/**
 * The full preference set, flattened from the slices above.
 *
 * Kept flat so consumers read `preferences.refreshInterval` rather than
 * `preferences.data.refreshInterval`. The slices exist to give each concern an owner —
 * see `slices.ts` for the reducers that enforce it.
 */
export interface Preferences
  extends DataPreferences,
    LayoutPreferences,
    AccessibilityPreferences,
    PrivacyPreferences {}
