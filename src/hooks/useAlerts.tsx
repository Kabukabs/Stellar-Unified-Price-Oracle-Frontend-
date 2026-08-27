import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react'
import type { Alert, AlertHistoryEntry, AlertsContextType, AlertSnoozeDuration } from '../types'
import { usePriceContext } from '../context/PriceContext'
import { AlertsArraySchema } from '../api/schemas'
import { createBroadcastChannel } from '../utils/broadcastChannel'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'
import { playAlertSound, unlockAudioContext } from '../utils/alertSound'
import { loadSoundPreferences } from '../utils/soundPreferences'
import { useRateLimit } from './useRateLimit'

/** Cap on the fired-alert history log (#309), oldest entries dropped first. */
const HISTORY_LIMIT = 500

const alertsChannel = createBroadcastChannel<Alert[]>('kiro-alerts')
const alertsHistoryChannel = createBroadcastChannel<AlertHistoryEntry[]>('kiro-alerts-history')

// ---------------------------------------------------------------------------
// #315 – Notification channel types (mirrors NotificationChannelsModal)
// ---------------------------------------------------------------------------
interface NotifConfig {
  email: { address: string; enabled: boolean }
  webPush: { enabled: boolean }
  webhook: { url: string; enabled: boolean }
}

/** Load the persisted (secret-free) notification config. */
function loadNotifConfig(): NotifConfig {
  return readJson<NotifConfig>(STORAGE_KEYS.notificationChannels, {
    email: { address: '', enabled: false },
    webPush: { enabled: false },
    webhook: { url: '', enabled: false },
  })
}

/**
 * #315 – Fire all enabled notification channels for a triggered alert.
 * Browser push is fired in-process; email/webhook are best-effort fetch calls
 * (the backend or a serverless function should handle delivery — here we POST
 * the payload to the configured URL so the wiring is complete end-to-end).
 */
async function dispatchNotifications(alert: Alert, currentPrice: number): Promise<void> {
  const cfg = loadNotifConfig()
  const body = alert.percentageMode
    ? `${alert.assetPair} moved ${alert.percentageThreshold ?? 0}% in ${alert.percentageWindow ?? '1hr'}! Current: $${currentPrice.toFixed(4)}`
    : `${alert.assetPair} crossed your threshold! Current price: $${currentPrice.toFixed(4)}`

  // Web Push – browser Notification API
  if (cfg.webPush.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('Price Alert Triggered', { body })
  }

  // Email – POST to a backend endpoint if one is configured
  if (cfg.email.enabled && cfg.email.address) {
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cfg.email.address,
          subject: 'Price Alert Triggered',
          message: body,
          assetPair: alert.assetPair,
          price: currentPrice,
        }),
      })
    } catch {
      // Best-effort; don't let a network error break the alert system
    }
  }

  // Webhook – POST alert payload to configured URL
  if (cfg.webhook.enabled && cfg.webhook.url) {
    try {
      await fetch(cfg.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert_triggered',
          assetPair: alert.assetPair,
          price: currentPrice,
          message: body,
          alertId: alert.id,
          timestamp: Date.now(),
        }),
      })
    } catch {
      // Best-effort
    }
  }
}

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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.alerts)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const result = AlertsArraySchema.safeParse(parsed)
    if (!result.success) {
      console.warn('[useAlerts] Invalid alerts in localStorage, resetting:', result.error.issues)
      return []
    }
    // Zod fills in defaults for new fields on legacy data
    return result.data as Alert[]
  } catch {
    return []
  }
  // Zod fills in defaults for new fields on legacy data
  return result.data as Alert[]
}

function saveAlerts(alerts: Alert[]): void {
  writeJson(STORAGE_KEYS.alerts, alerts)
}

/** Loads the fired-alert history log (#309), tolerating legacy/invalid data. */
function loadHistory(): AlertHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.alertHistory)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const result = AlertHistoryArraySchema.safeParse(parsed)
    if (!result.success) {
      console.warn('[useAlerts] Invalid alert history in localStorage, resetting:', result.error.issues)
      return []
    }
    return result.data as AlertHistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(history: AlertHistoryEntry[]): void {
  writeJson(STORAGE_KEYS.alertHistory, history)
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
 *  - Cooldown between re-fires of a persistent alert (#310)
 *  - A capped history log of fired alerts (#309)
 *
 * Must be rendered inside `PriceProvider`.
 */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts)
  const [history, setHistory] = useState<AlertHistoryEntry[]>(loadHistory)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const { livePrices } = usePriceContext()

  // Rate limiter for alert creation (max 5 per minute)
  const alertRateLimit = useRateLimit('alertCreate')

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
    const firedEntries: AlertHistoryEntry[] = []

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

      // Minimum time between re-fires of a persistent alert (#310) — prevents
      // notification spam when the price oscillates around the threshold.
      const cooldownMs = Math.max(0, alert.cooldownMinutes ?? 5) * 60_000

      if (triggered) {
        // One-time alerts: only ever fire once.
        // Persistent alerts: re-fire once the cooldown window has elapsed.
        const shouldFire = alert.triggerOnce
          ? alert.lastTriggeredAt === null
          : alert.lastTriggeredAt === null || now - alert.lastTriggeredAt >= cooldownMs

        if (shouldFire) {
          changed = true
          const newFireCount = (updatedAlert.fireCount ?? 0) + 1

          // #315 – Dispatch to all enabled notification channels (push, email, webhook)
          void dispatchNotifications(alert, currentPrice)

          // #308 – Play an alert sound, respecting the mute/volume preference.
          // No-ops silently if the user hasn't interacted with the page yet
          // (autoplay policy) or sound is muted.
          const soundPrefs = loadSoundPreferences()
          if (soundPrefs.enabled) {
            playAlertSound(soundPrefs.volume)
          }

          firedEntries.push({
            id: crypto.randomUUID(),
            alertId: alert.id,
            assetPair: alert.assetPair,
            triggeredAt: now,
            price: currentPrice,
            triggerOnce: alert.triggerOnce,
            percentageMode: alert.percentageMode,
            upperThreshold: alert.upperThreshold,
            lowerThreshold: alert.lowerThreshold,
            percentageThreshold: alert.percentageThreshold,
            percentageWindow: alert.percentageWindow,
            percentageDirection: alert.percentageDirection,
          })

          return {
            ...updatedAlert,
            fireCount: newFireCount,
            lastTriggeredAt: now,
            // One-time: auto-disable. Persistent: stays active.
            active: !alert.triggerOnce,
          }
        }
      } else {
        // Re-arm a persistent alert once its cooldown window has elapsed (#310),
        // so it can fire again next time the condition is met.
        if (!alert.triggerOnce && alert.lastTriggeredAt !== null && now - alert.lastTriggeredAt >= cooldownMs) {
          changed = true
          return { ...updatedAlert, lastTriggeredAt: null }
        }
      }

      return updatedAlert
    })

    if (changed) {
      setAlerts(newAlerts)
    }
    if (firedEntries.length > 0) {
      // Newest first, capped to HISTORY_LIMIT (#309)
      setHistory((prev) => [...firedEntries.reverse(), ...prev].slice(0, HISTORY_LIMIT))
    }
  }, [livePrices, alerts])

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // #308 – Unlock the alert-sound AudioContext on the first user interaction,
  // since browsers block audio playback until a gesture has occurred.
  useEffect(() => {
    function handleFirstInteraction() {
      unlockAudioContext()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)
    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  useEffect(() => {
    saveAlerts(alerts)
    // Broadcast alerts change to other tabs
    alertsChannel.broadcast('alerts-update', alerts)
  }, [alerts])

  useEffect(() => {
    saveHistory(history)
    // Broadcast history change to other tabs
    alertsHistoryChannel.broadcast('alerts-history-update', history)
  }, [history])

  // Listen for alerts changes from other tabs
  useEffect(() => {
    const unsubscribe = alertsChannel.subscribe((msg) => {
      if (msg.type === 'alerts-update') {
        setAlerts(msg.payload)
      }
    })
    return unsubscribe
  }, [])

  // Listen for history changes from other tabs
  useEffect(() => {
    const unsubscribe = alertsHistoryChannel.subscribe((msg) => {
      if (msg.type === 'alerts-history-update') {
        setHistory(msg.payload)
      }
    })
    return unsubscribe
  }, [])

  const addAlert = useCallback(
    (alert: Omit<Alert, 'id' | 'createdAt' | 'lastTriggeredAt' | 'fireCount' | 'snoozedUntil' | 'percentageBaselinePrice' | 'percentageBaselineTimestamp'>) => {
      // Rate-limit alert creation: max 5 per minute.
      if (!alertRateLimit.consume()) {
        return null
      }
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
    [alertRateLimit],
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

  /** Clears the fired-alert history log (#309) */
  const clearAlertHistory = useCallback(() => setHistory([]), [])

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
    alertHistory: history,
    clearAlertHistory,
    alertCreateAllowed: alertRateLimit.allowed,
    alertCreateCooldownSec: alertRateLimit.cooldownSec,
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
