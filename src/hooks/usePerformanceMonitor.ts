/**
 * usePerformanceMonitor
 *
 * Main hook that:
 * 1. Starts/stops the FPS sampler and long-task observer for the lifetime of
 *    the component that mounts it (typically App).
 * 2. Subscribes to performance snapshots and returns the latest snapshot.
 * 3. Reports long tasks and low-FPS events to analytics when configured.
 * 4. Places performance marks around key user navigation transitions.
 *
 * Mount once at the top of the React tree (in App or AppContent).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  startPerformanceMonitor,
  stopPerformanceMonitor,
  subscribePerformance,
  recordPerfMark,
  type PerformanceSnapshot,
} from '../utils/performanceMonitor'
import { trackEvent } from './useAnalytics'

const REPORT_LONG_TASK_THRESHOLD_MS = 200   // only report notably long tasks
const FPS_JANK_REPORT_COOLDOWN_MS   = 30_000 // rate-limit jank reports

export function usePerformanceMonitor(): PerformanceSnapshot | null {
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null)
  const lastJankReportRef = useRef(0)

  // Report a long task to analytics if it's egregiously long
  const handleLongTask = useCallback((s: PerformanceSnapshot) => {
    const last = s.longTasks[s.longTasks.length - 1]
    if (!last || last.duration < REPORT_LONG_TASK_THRESHOLD_MS) return

    trackEvent('perf:long_task', {
      duration_ms: Math.round(last.duration),
      name: last.name,
      total_long_tasks: s.totalLongTasks,
    })
  }, [])

  // Rate-limited jank reporting
  const handleJank = useCallback((s: PerformanceSnapshot) => {
    if (!s.isJanky) return
    const now = Date.now()
    if (now - lastJankReportRef.current < FPS_JANK_REPORT_COOLDOWN_MS) return
    lastJankReportRef.current = now
    trackEvent('perf:jank', { fps: s.fps })
  }, [])

  useEffect(() => {
    startPerformanceMonitor()
    recordPerfMark('app:ready')

    const unsubscribe = subscribePerformance((s) => {
      setSnapshot(s)
      handleLongTask(s)
      handleJank(s)
    })

    return () => {
      unsubscribe()
      stopPerformanceMonitor()
    }
  }, [handleLongTask, handleJank])

  return snapshot
}

/**
 * Convenience hook for marking the start of an interaction and automatically
 * placing a paired end mark when the component unmounts or the name changes.
 *
 * Usage:
 *   useInteractionMark('dashboard:filter:apply')
 */
export function useInteractionMark(name: string): void {
  useEffect(() => {
    recordPerfMark(`${name}:start`)
    return () => {
      recordPerfMark(`${name}:end`, `${name}:start`)
    }
  }, [name])
}
