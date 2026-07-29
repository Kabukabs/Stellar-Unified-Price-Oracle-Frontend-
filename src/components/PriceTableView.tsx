/**
 * @file PriceTableView
 *
 * Tabular alternative to the card grid. Displays all price pairs in a sortable,
 * accessible `<table>` with columns for pair, price, confidence, sources, and
 * last-updated time. Supports multi-select mode.
 *
 * @example Basic usage
 * ```tsx
 * <PriceTableView
 *   items={prices}
 *   livePairs={livePairs}
 *   onRowClick={handleRowClick}
 *   onAlertClick={handleAlertClick}
 *   hasAlertFn={(pair) => alertMap.has(pair)}
 * />
 * ```
 *
 * @example With multi-select
 * ```tsx
 * <PriceTableView
 *   items={prices}
 *   livePairs={livePairs}
 *   onRowClick={handleRowClick}
 *   onAlertClick={handleAlertClick}
 *   hasAlertFn={hasAlert}
 *   selectMode
 *   selected={selectedPairs}
 *   onToggleSelect={toggleSelect}
 * />
 * ```
 *
 * ## Props table
 * | prop             | type                                          | required | description                                      |
 * |------------------|-----------------------------------------------|----------|--------------------------------------------------|
 * | `items`          | `PriceData[]`                                 | yes      | Price data rows to render                        |
 * | `livePairs`      | `Set<string>`                                 | yes      | Pairs receiving live WebSocket updates           |
 * | `isStale`        | `boolean`                                     | no       | When true, rows render at reduced opacity        |
 * | `onRowClick`     | `(pair: string) => void`                      | yes      | Called when a row is activated                   |
 * | `onAlertClick`   | `(e: React.MouseEvent, pair: string) => void` | yes      | Called when alert button is pressed              |
 * | `hasAlertFn`     | `(pair: string) => boolean`                   | yes      | Returns true if pair has an active alert         |
 * | `selectMode`     | `boolean`                                     | no       | Enables checkbox column for multi-select         |
 * | `selected`       | `Set<string>`                                 | no       | Set of currently selected pairs                  |
 * | `onToggleSelect` | `(pair: string) => void`                      | no       | Called when a row checkbox is toggled            |
 *
 * ## Sorting
 * Clicking a column header sorts ascending; clicking again toggles to descending.
 * Sort state is local to the component (not persisted). Default sort is `assetPair`
 * ascending.
 *
 * ## Edge cases
 * - **Empty `items`** — renders an empty `<tbody>`; callers should show a skeleton
 *   or empty state above this component.
 * - **`isStale = true`** — all rows render at 60 % opacity; individual row liveness
 *   dots are still shown.
 * - **Live dot** — a pulsing green dot appears next to the pair name when
 *   `livePairs.has(pair)`.
 *
 * ## Accessibility
 * - `<table>` has `aria-label` from i18n key `table.ariaLabel`.
 * - Column headers have `aria-sort` (`ascending`, `descending`, or `none`).
 * - Each row has `role="button"` and `tabIndex={0}` for keyboard activation.
 * - `aria-selected` is set on rows only when `selectMode` is active.
 * - Live and alert status dots carry `role="status"` with `aria-label`.
 */
import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PriceData } from '../types'
import { formatPrice, timeAgo } from '../utils/format'

type SortKey = 'assetPair' | 'price' | 'confidence' | 'sources' | 'timestamp'
type SortDir = 'asc' | 'desc'

interface PriceTableViewProps {
  items: PriceData[]
  livePairs: Set<string>
  isStale?: boolean
  onRowClick: (pair: string) => void
  onAlertClick: (e: React.MouseEvent, pair: string) => void
  hasAlertFn: (pair: string) => boolean
  selectMode?: boolean
  selected?: Set<string>
  onToggleSelect?: (pair: string) => void
}

export const PriceTableView = memo(function PriceTableView({
  items,
  livePairs,
  isStale,
  onRowClick,
  onAlertClick,
  hasAlertFn,
  selectMode,
  selected,
  onToggleSelect,
}: PriceTableViewProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<SortKey>('assetPair')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'assetPair', label: t('table.columns.pair') },
    { key: 'price', label: t('table.columns.price') },
    { key: 'confidence', label: t('table.columns.confidence') },
    { key: 'sources', label: t('table.columns.sources') },
    { key: 'timestamp', label: t('table.columns.updated') },
  ]

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
    },
    [sortKey],
  )

  const sorted = [...items].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'assetPair') cmp = a.assetPair.localeCompare(b.assetPair)
    else if (sortKey === 'price') cmp = a.price - b.price
    else if (sortKey === 'confidence') cmp = a.confidence - b.confidence
    else if (sortKey === 'sources') cmp = a.sources.length - b.sources.length
    else if (sortKey === 'timestamp') cmp = a.timestamp - b.timestamp
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="min-w-full text-sm" aria-label={t('table.ariaLabel')}>
        <thead>
          <tr className="sticky top-0 bg-gray-900 border-b border-gray-800">
            {selectMode && (
              <th scope="col" className="px-4 py-3 w-10">
                <span className="sr-only">{t('table.columns.select')}</span>
              </th>
            )}
            {COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                scope="col"
                onClick={() => handleSort(key)}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-gray-200 transition-colors"
                aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <span className="flex items-center gap-1">
                  {label}
                  {sortKey === key ? (
                    <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  ) : (
                    <span className="text-gray-700" aria-hidden="true">↕</span>
                  )}
                </span>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
              {t('table.columns.alert')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const isLive = livePairs.has(p.assetPair)
            const hasAlert = hasAlertFn(p.assetPair)
            const isSelected = selected?.has(p.assetPair) ?? false
            return (
              <tr
                key={p.assetPair}
                onClick={() => { if (selectMode) { onToggleSelect?.(p.assetPair) } else { onRowClick(p.assetPair) } }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (selectMode) { onToggleSelect?.(p.assetPair) } else { onRowClick(p.assetPair) }
                  }
                }}
                role="button"
                tabIndex={0}
                className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${isStale ? 'opacity-60' : ''} ${isSelected ? 'bg-cyan-900/20' : ''}`}
                aria-label={t('table.row.rowAriaLabel', { pair: p.assetPair })}
                aria-selected={selectMode ? isSelected : undefined}
              >
                {selectMode && (
                  <td className="px-4 py-3 w-10">
                    <span
                      className={`inline-flex w-4 h-4 items-center justify-center rounded border ${isSelected ? 'bg-cyan-600 border-cyan-500' : 'border-gray-600'}`}
                      aria-hidden="true"
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 font-semibold text-gray-100 whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {p.assetPair}
                    {isLive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
                        role="status"
                        aria-label={t('table.row.liveAriaLabel')}
                      />
                    )}
                    {hasAlert && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-400"
                        role="status"
                        aria-label={t('table.row.alertAriaLabel')}
                      />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-100 whitespace-nowrap">${formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-cyan-400 whitespace-nowrap">{(p.confidence * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-gray-400">{p.sources.join(', ')}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{timeAgo(p.timestamp)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAlertClick(e, p.assetPair)
                    }}
                    className={`text-xs font-medium transition-colors ${hasAlert ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-300'}`}
                    aria-label={t('table.row.alertButtonAriaLabel', { pair: p.assetPair })}
                  >
                    {hasAlert ? t('table.row.alertSet') : t('table.row.setAlert')}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})
