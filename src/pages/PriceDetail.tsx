import { Suspense, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSwr } from '../hooks/useSwr'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { fetchPrice } from '../api/rest'
import { PriceDetailSkeleton } from '../components/PriceDetailSkeleton'
import { CsvImportZone } from '../components/CsvImportZone'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { VisibleSuspense } from '../components/VisibleSuspense'
import { formatPrice, timeAgo, formatTimestamp } from '../utils/format'
import { SOURCE_COLORS, getConfidenceColor } from '../utils/sourceColors'
import { LazyPriceChart, LazyPriceHistoryTable, LazyPriceProofPanel } from '../utils/chunks'
import { isValidAssetPair } from '../types'
import { usePreferences } from '../preferences/PreferencesContext'
import { getStellarAssetForPair, shortenAccount } from '../lib/stellarAssets'
import type { CsvRow } from '../components/CsvImportZone'

type DetailTab = 'overview' | 'proof'

/** Canonical on-chain Stellar asset for the feed, resolved via @stellar/stellar-sdk. */
function StellarAssetPanel({ pair }: { pair: string }) {
  const asset = getStellarAssetForPair(pair)

  if (!asset) {
    return (
      <p className="text-sm text-gray-400">
        This feed aggregates an off-chain asset with no canonical on-chain Stellar representation — the Soroban oracle
        roadmap documents how feeds like this get on-chain.
      </p>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
          <path strokeLinecap="round" strokeWidth="1.5" d="M12 7v10M7 12h10" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-100 flex items-center gap-2">
          {asset.label}
          {asset.isNative && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold uppercase tracking-wide">
              Native
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 font-mono mt-0.5">{asset.canonical}</p>
        {asset.issuer && (
          <p className="text-xs text-gray-500 mt-0.5">
            Issued by{' '}
            <span className="font-mono text-gray-400" title={asset.issuer}>
              {shortenAccount(asset.issuer)}
            </span>
          </p>
        )}
        <p className="text-[11px] text-gray-600 mt-1">
          This feed is denominated in a Stellar asset — readable on-chain with the Stellar SDK.
        </p>
      </div>
    </div>
  )
}

export function PriceDetail() {
  const { pair } = useParams<{ pair: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { preferences } = usePreferences()
  const [importedData, setImportedData] = useState<CsvRow[] | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')

  const decodedPair = pair ? decodeURIComponent(pair) : ''

  // Validate the pair param against the known asset list before fetching
  const isInvalidPair = decodedPair !== '' && !isValidAssetPair(decodedPair)

  // Always call hooks at the top level (Rules of Hooks), but use `enabled`
  // and `null` pair to prevent network requests for invalid input.
  const {
    data: price,
    loading: priceLoading,
    error: priceError,
  } = useSwr(`price:${decodedPair}`, () => fetchPrice(decodedPair), {
    staleTime: 5000,
    retryCount: 2,
    enabled: !isInvalidPair && decodedPair !== '',
  })

  const {
    history,
    loading: historyLoading,
    loadingMore,
    hasMore,
    error: historyError,
    loadMore,
  } = usePriceHistory(isInvalidPair || !decodedPair ? null : decodedPair, { pageSize: 100 })

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
          Unknown asset pair: <span className="font-mono text-red-300">{decodedPair}</span>
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

          {/* Tabs — Overview (off-chain aggregated feed) vs Proof (on-chain verification) */}
          <div className="flex border-b border-gray-800 mb-6" role="tablist" aria-label="Price detail sections">
            {(['overview', 'proof'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {t(`priceDetail.tabs.${tab}`)}
              </button>
            ))}
          </div>

          {activeTab === 'proof' ? (
            <ErrorBoundary boundaryId="price-proof" featureLabel="Price Proof">
              <Suspense
                fallback={
                  <div
                    className="h-40 rounded-lg bg-gray-800/60 animate-pulse"
                    role="status"
                    aria-label={t('priceDetail.proof.loadingLabel')}
                  />
                }
              >
                <LazyPriceProofPanel
                  pair={price.assetPair}
                  latestTimestamp={price.timestamp}
                  historyTimestamps={history.map((h) => h.timestamp)}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <>
              {/* Price block */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  {t('priceDetail.sections.currentPrice')}
                </p>
                <p className="text-5xl font-bold font-mono text-gray-100 mb-4">${formatPrice(price.price)}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('priceDetail.updated', { time: timeAgo(price.timestamp) })}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${getConfidenceColor(price.confidence)}`}
                  >
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

              {/* Stellar asset — resolved on-chain via @stellar/stellar-sdk */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Stellar Asset</p>
                <StellarAssetPanel pair={price.assetPair} />
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
                  <ErrorBoundary
                    boundaryId="price-chart"
                    featureLabel="Price Chart"
                    fallback={
                      <div
                        role="alert"
                        aria-label="Chart rendering failed"
                        className="flex flex-col items-center justify-center h-80 rounded-lg border border-red-800 bg-red-900/20 text-center gap-2 p-6"
                      >
                        <p className="text-base font-semibold text-gray-100">Chart failed to load</p>
                        <p className="text-sm text-gray-400">
                          The price history chart encountered an error. Price data is still available above.
                        </p>
                      </div>
                    }
                  >
                    <VisibleSuspense
                      fallback={
                        <div
                          className="h-80 rounded-lg bg-gray-800/60 animate-pulse"
                          role="status"
                          aria-label="Loading price chart"
                        />
                      }
                    >
                      <LazyPriceChart
                        data={history}
                        pair={decodedPair}
                        loading={historyLoading && history.length === 0}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        timezone={preferences.chartTimezone}
                      />
                    </VisibleSuspense>
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
                  <VisibleSuspense
                    fallback={
                      <div
                        className="h-48 rounded-lg bg-gray-800/60 animate-pulse"
                        role="status"
                        aria-label="Loading price history table"
                      />
                    }
                  >
                    <LazyPriceHistoryTable data={history} />
                  </VisibleSuspense>
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
            </>
          )}
        </div>
      ) : showEmptyState ? (
        <div className="p-8 border border-gray-800 bg-gray-900/70 rounded-xl text-center" role="status">
          <h2 className="text-xl font-semibold text-gray-100 mb-2">{t('priceDetail.emptyState.title')}</h2>
          <p className="text-sm text-gray-400">{t('priceDetail.emptyState.detail')}</p>
        </div>
      ) : null}
    </div>
  )
}
