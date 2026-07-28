import { memo } from 'react'
import { usePreferences } from '../preferences/PreferencesContext'
import {
  REFRESH_INTERVAL_OPTIONS,
  CHART_RANGE_OPTIONS,
  STALE_THRESHOLD_OPTIONS,
} from '../preferences/constants'
import type { Preferences } from '../preferences/types'

/**
 * PreferencesPanel
 *
 * A compact preferences form that lets users adjust data-fetching and display
 * settings. Reads from and writes to the PreferencesContext.
 *
 * Kept separate from SettingsPanel so it can be embedded in other surfaces
 * (e.g. a sidebar or a popover) without pulling in the full settings sheet.
 */
export const PreferencesPanel = memo(function PreferencesPanel() {
  const { preferences, updatePreference, undo, redo, canUndo, canRedo } = usePreferences()

  return (
    <section aria-label="Preferences" className="flex flex-col gap-4 p-4">
      {/* Refresh interval */}
      <div className="flex flex-col gap-1">
        <label htmlFor="refresh-interval" className="text-sm font-medium text-gray-200">
          Refresh interval
        </label>
        <select
          id="refresh-interval"
          className="rounded bg-slate-800 px-3 py-2 text-sm text-gray-100"
          value={preferences.refreshInterval}
          onChange={(e) =>
            updatePreference('refreshInterval', Number(e.target.value) as Preferences['refreshInterval'])
          }
        >
          {REFRESH_INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chart time range */}
      <div className="flex flex-col gap-1">
        <label htmlFor="chart-range" className="text-sm font-medium text-gray-200">
          Chart time range
        </label>
        <select
          id="chart-range"
          className="rounded bg-slate-800 px-3 py-2 text-sm text-gray-100"
          value={preferences.chartTimeRange}
          onChange={(e) =>
            updatePreference('chartTimeRange', e.target.value as Preferences['chartTimeRange'])
          }
        >
          {CHART_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stale threshold */}
      <div className="flex flex-col gap-1">
        <label htmlFor="stale-threshold" className="text-sm font-medium text-gray-200">
          Stale threshold (minutes)
        </label>
        <select
          id="stale-threshold"
          className="rounded bg-slate-800 px-3 py-2 text-sm text-gray-100"
          value={preferences.staleThresholdMinutes}
          onChange={(e) =>
            updatePreference('staleThresholdMinutes', Number(e.target.value))
          }
        >
          {STALE_THRESHOLD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={undo}
          className="rounded bg-slate-700 px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40"
          aria-label="Undo last preference change"
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={redo}
          className="rounded bg-slate-700 px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40"
          aria-label="Redo last preference change"
        >
          Redo
        </button>
      </div>
    </section>
  )
})
