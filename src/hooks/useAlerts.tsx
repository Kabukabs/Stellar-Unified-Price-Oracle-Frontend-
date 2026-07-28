import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react'
import type { Alert, AlertsContextType, AlertSnoozeDuration } from '../types'
import { usePriceContext } from '../context/PriceContext'
import { AlertsArraySchema } from '../api/schemas'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'

/** Compute snooze expiry timestamp from a duration string */
function snoozeDurationMs(duration: AlertSnoozeDuration): number {
  const now = Date.now()
  switch (duration) {
    case '15min':
      return now + 15 * 60 * 1000
    case '1hr':
      return now + 60 * 60 * 1000
    case '4hr':
      return now + 4 * 60 * 60 * 1000
    case '24hr':
      return now + 24 * 60 * 60 * 1000
    case 'tomorrow': {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      return tomorrow.getTime()
    }
  }
}

/** Returns the window duration in milliseconds for a percentage alert window */
function windowMs(window: string): number {
  switch (window) {
    case '5min':  return 5 * 60 * 1000
    case '15min': return 15 * 60 * 1000
    case '1hr':   return 60 * 60 * 1000
    case '24hr':  return 24 * 60 * 60 * 1000
    default:      return 60 * 60 * 1000
  }
}

function loadAlerts(): Alert[] {
  const raw = readJson<unknown>(STORAGE_KEYS.alerts, [])
  const result = AlertsArraySchema.safeParse(raw)
  if (!result.success) {
    console.warn('[useAlerts] Invalid alerts in localStorage, resetting:', result.error.issues)
    return []
  }
  // Zod fills in defaults for new fields on legacy data
  return result.data as Alert[]
}

function saveAlerts(alerts: Alert[]): void {
  writeJson(STORAGE_KEYS.alerts, alerts)
}

const AlertsContext = createContext<AlertsContextType | null>(null)

/**
 * Provides the {@link AlertsContextType} to its subtree.
 *
 * Persists alerts to `localStorage` and evaluates them against live prices from
 * {@link usePriceContext}. Handles:
 *  - Absolute threshold alerts (upper/lower)
 *  - Percentage-based movement alerts (#307)
 *  - One-time vs persistent alerts with fire counts (#312)
 *  - Alert snooze with auto-unsnooze (#313)
 *
 * Must be rendered inside `PriceProvider`.
 */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const { livePrices } = usePriceContext()

  // Auto-unsnooze expired snoozes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setAlerts((prev) => {
        const changed = prev.some((a) => a.snoozedUntil !== null && a.snoozedUntil <= now)
        if (!changed) return prev
        return prev.map((a) =>
          a.snoozedUntil !== null && a.snoozedUntil <= now
            ? { ...a, snoozedUntil: null }
            : a,
        )
      })
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Evaluate alerts against live prices
  useEffect(() => {
    let changed = false
    const now = Date.now()

    const newAlerts = alerts.map((alert) => {
      // Skip inactive alerts
      if (!alert.active) return alert

      // Skip snoozed alerts
      if (alert.snoozedUntil !== null && alert.snoozedUntil > now) return alert

      const livePriceData = livePrices.get(alert.assetPair)
      if (!livePriceData) return alert

      const currentPrice = livePriceData.data.price
      let triggered = false
      let updatedAlert = { ...alert }

      if (alert.percentageMode) {
        // ── Percentage-based alert evaluation (#307) ──────────────────────
        const threshold = alert.percentageThreshold ?? 0
        const window = alert.percentageWindow ?? '1hr'
        const direction = alert.percentageDirection ?? 'either'
        const windowDuration = windowMs(window)

        // Initialise or refresh baseline if it's expired
        if (
          alert.percentageBaselinePrice === null ||
          alert.percentageBaselineTimestamp === null ||
          now - alert.percentageBaselineTimestamp >= windowDuration
        ) {
          // Set new baseline; don't trigger on the same tick as baseline reset
          changed = true
          updatedAlert = {
            ...updatedAlert,
            percentageBaselinePrice: currentPrice,
            percentageBaselineTimestamp: now,
            lastTriggeredAt: null,
          }
          return updatedAlert
        }

        const baseline = alert.percentageBaselinePrice
        const pctChange = baseline !== 0 ? ((currentPrice - baseline) / baseline) * 100 : 0
        const absPctChange = Math.abs(pctChange)

        if (direction === 'up' && pctChange >= threshold) triggered = true
        else if (direction === 'down' && pctChange <= -threshold) triggered = true
        else if (direction === 'either' && absPctChange >= threshold) triggered = true
      } else {
        // ── Absolute threshold evaluation ─────────────────────────────────
        if (alert.upperThreshold !== null && currentPrice >= alert.upperThreshold) {
          triggered = true
        } else if (alert.lowerThreshold !== null && currentPrice <= alert.lowerThreshold) {
          triggered = true
        }
      }

      if (triggered) {
        // For persistent alerts: re-trigger every time the condition is met
        // For one-time alerts: only trigger if not yet triggered
        const shouldFire = alert.triggerOnce
          ? alert.lastTriggeredAt === null
          : alert.lastTriggeredAt === null // reset after going out-of-range

        if (shouldFire) {
          changed = true
          const newFireCount = (updatedAlert.fireCount ?? 0) + 1

          // Show browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const body = alert.percentageMode
              ? `${alert.assetPair} moved ${alert.percentageThreshold ?? 0}% in ${alert.percentageWindow ?? '1hr'}! Current: $${currentPrice.toFixed(4)}`
              : `${alert.assetPair} crossed your threshold! Current price: $${currentPrice.toFixed(4)}`
            new Notification('Price Alert Triggered', { body })
          }

          return {
            ...updatedAlert,
            fireCount: newFireCount,
            lastTriggeredAt: now,
            // One-time: auto-disable. Persistent: stays active.
            active: !alert.triggerOnce,
          }
        }
      } else {
        // Reset lastTriggeredAt when price goes back out-of-range (for persistent re-trigger)
        if (!alert.triggerOnce && alert.lastTriggeredAt !== null) {
          changed = true
          return { ...updatedAlert, lastTriggeredAt: null }
        }
      }

      return updatedAlert
    })

    if (changed) {
      setAlerts(newAlerts)
    }
  }, [livePrices, alerts])

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    saveAlerts(alerts)
  }, [alerts])

  const addAlert = useCallback(
    (alert: Omit<Alert, 'id' | 'createdAt' | 'lastTriggeredAt' | 'fireCount' | 'snoozedUntil' | 'percentageBaselinePrice' | 'percentageBaselineTimestamp'>) => {
      const newAlert: Alert = {
        ...alert,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        lastTriggeredAt: null,
        fireCount: 0,
        snoozedUntil: null,
        percentageBaselinePrice: null,
        percentageBaselineTimestamp: null,
      }
      setAlerts((prev) => [...prev, newAlert])
      return newAlert
    },
    [],
  )

  const updateAlert = useCallback((id: string, updates: Partial<Omit<Alert, 'id' | 'createdAt'>>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const getAlertsForPair = useCallback(
    (assetPair: string) => alerts.filter((a) => a.assetPair === assetPair && a.active),
    [alerts],
  )

  const activeCount = alerts.filter((a) => a.active && (a.snoozedUntil === null || a.snoozedUntil <= Date.now())).length

  const hasAlertsForPair = useCallback(
    (assetPair: string) => alerts.some((a) => a.assetPair === assetPair && a.active),
    [alerts],
  )

  const togglePanel = useCallback(() => setIsPanelOpen((p) => !p), [])

  const markAsRead = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lastTriggeredAt: a.lastTriggeredAt ?? Date.now() } : a)),
    )
  }, [])

  /** Snooze an alert for a given duration (#313) */
  const snoozeAlert = useCallback((id: string, duration: AlertSnoozeDuration) => {
    const until = snoozeDurationMs(duration)
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, snoozedUntil: until, lastTriggeredAt: null } : a,
      ),
    )
  }, [])

  /** Remove snooze from an alert immediately (#313) */
  const unsnoozeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, snoozedUntil: null } : a)))
  }, [])

  /** Re-enable a fired one-time alert so it can fire again (#312) */
  const reEnableAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, active: true, lastTriggeredAt: null, fireCount: 0, snoozedUntil: null }
          : a,
      ),
    )
  }, [])

  const value: AlertsContextType = {
    alerts,
    addAlert,
    updateAlert,
    removeAlert,
    getAlertsForPair,
    hasAlertsForPair,
    activeCount,
    isPanelOpen,
    togglePanel,
    markAsRead,
    snoozeAlert,
    unsnoozeAlert,
    reEnableAlert,
  }

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

/**
 * Returns the alerts context value.
 * Must be called inside a component that is a descendant of {@link AlertsProvider}.
 * Throws if called outside of that tree.
 */
export function useAlerts() {
  const context = useContext(AlertsContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider')
  }
  return context
}
