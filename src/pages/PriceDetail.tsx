import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSwr } from '../hooks/useSwr'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { fetchPrice } from '../api/rest'
import { PriceDetailSkeleton } from '../components/PriceDetailSkeleton'
import { CsvImportZone } from '../components/CsvImportZone'
import { PriceChart } from '../components/PriceChart'
import { PriceHistoryTable } from '../components/PriceHistoryTable'
import { formatPrice, timeAgo, formatTimestamp } from '../utils/format'
import { isValidAssetPair } from '../types'
import type { CsvRow } from '../components/CsvImportZone'

const SOURCE_COLORS: Record<string, string> = {
  chainlink: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  redstone: 'bg-red-500/20 text-red-400 border-red-500/30',
  band: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  reflector: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

function getConfidenceColor(confidence: number): string {
  if (confidence > 0.9) {
    return 'bg-green-500/20 text-green-400 border-green-500/30'
  }
  if (confidence > 0.8) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export function PriceDetail() {
  const { pair } = useParams<{ pair: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [importedData, setImportedData] = useState<CsvRow[] | null>(null)

  const decodedPair = pair ? decodeURIComponent(pair) : ''

  // Validate the pair param against the known asset list before fetching
  const isInvalidPair = decodedPair !== '' && !isValidAssetPair(decodedPair)

  // Always call hooks at the top level (Rules of Hooks), but use `enabled`
  // and `null` pair to prevent network requests for invalid input.
  const { data: price, loading: priceLoading, error: priceError } = useSwr(
    `price:${decodedPair}`,
    () => fetchPrice(decodedPair),
    { staleTime: 5000, retryCount: 2, enabled: !isInvalidPair && decodedPair !== '' },
  )

  const { history, loading: historyLoading, loadingMore, hasMore, error: historyError, loadMore } = usePriceHistory(
    isInvalidPair || !decodedPair ? null : decodedPair,
    { pageSize: 100 },
  )

  const loading = priceLoading || (historyLoading && history.length === 0)
  const showEmptyState = !loading && !priceError && !price

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        aria-label={t('priceDetail.backAriaLabel')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('priceDetail.back')}
      </button>

      {isInvalidPair ? (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400" role="alert">
          Unknown asset pair:{' '}
          <span className="font-mono text-red-300">{decodedPair}</span>
        </div>
      ) : loading ? (
        <PriceDetailSkeleton />
      ) : priceError ? (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400" role="alert">
          {priceError.message}
        </div>
      ) : price ? (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-100">{price.assetPair}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
              {t('priceDetail.live')}
            </span>
          </div>

          {/* Price block */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              {t('priceDetail.sections.currentPrice')}
            </p>
            <p className="text-5xl font-bold font-mono text-gray-100 mb-4">
              ${formatPrice(price.price)}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {t('priceDetail.updated', { time: timeAgo(price.timestamp) })}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getConfidenceColor(price.confidence)}`}>
                {t('priceDetail.confidence', { value: (price.confidence * 100).toFixed(1) })}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{formatTimestamp(price.timestamp)}</p>
          </div>

          {/* Sources */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              {t('priceDetail.sections.oracleSources')}
            </p>
            <div className="flex flex-wrap gap-2">
              {price.sources.map((src) => (
                <span
                  key={src}
                  className={`px-3 py-1 rounded text-sm font-medium border ${SOURCE_COLORS[src] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}
                >
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* Paginated History chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
              {t('priceDetail.sections.priceHistory')}
            </p>
            {historyError ? (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
                {t('priceDetail.historyError', { message: historyError.message })}
              </div>
            ) : (
              <ErrorBoundary boundaryId="price-chart" featureLabel="Price Chart">
                <PriceChart
                  data={history}
                  pair={decodedPair}
                  loading={historyLoading && history.length === 0}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Price history table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Price History (Table)</p>
            {historyError ? (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400" role="alert">
                Failed to load price history: {historyError.message}
              </div>
            ) : (
              <PriceHistoryTable data={history} />
            )}
          </div>

          {/* CSV import */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
              {t('priceDetail.sections.importData')}
            </p>
            <CsvImportZone
              hasImport={importedData !== null}
              onImport={setImportedData}
              onClear={() => setImportedData(null)}
            />
          </div>
        </div>
      ) : showEmptyState ? (
        <div className="p-8 border border-gray-800 bg-gray-900/70 rounded-xl text-center" role="status">
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            {t('priceDetail.emptyState.title')}
          </h2>
          <p className="text-sm text-gray-400">
            {t('priceDetail.emptyState.detail')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
