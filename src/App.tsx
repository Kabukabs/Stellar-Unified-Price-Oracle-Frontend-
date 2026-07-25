import { lazy, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ErrorBoundary, PageErrorBoundary } from './components/ErrorBoundary'
import { RouteSuspense } from './components/Skeletons/RouteSuspense'
import { DashboardSkeleton } from './components/Skeletons/DashboardSkeleton'
import { PriceDetailSkeleton } from './components/PriceDetailSkeleton'
import { ApiDocsSkeleton } from './components/Skeletons/ApiDocsSkeleton'
import { NotFoundSkeleton } from './components/Skeletons/NotFoundSkeleton'
import { AlertsProvider } from './hooks/useAlerts'
import { PriceProvider } from './context/PriceContext'
import { ToastProvider } from './context/ToastContext'
import { PreferencesProvider } from './preferences/PreferencesContext'
import { ErrorReporterProvider, useErrorReporter } from './context/ErrorReporterContext'
import { useWebVitals } from './hooks/useWebVitals'
import { useAccessibility } from './hooks/useAccessibility'
import { initAnalytics, trackPageview } from './hooks/useAnalytics'
import type { ErrorInfo } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const PriceDetail = lazy(() => import('./pages/PriceDetail').then((m) => ({ default: m.PriceDetail })))
const ApiDocs = lazy(() => import('./pages/ApiDocs').then((m) => ({ default: m.ApiDocs })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

export function AppContent(): ReactElement {
  const location = useLocation()
  const { captureError } = useErrorReporter()

  useAccessibility()
  trackPageview(location.pathname)

  const makeOnError = (boundaryId: string) =>
    (error: Error, info: ErrorInfo) => captureError(error, info, boundaryId)

  return (
    // Top-level boundary: catches errors that escape per-route boundaries
    // (e.g. Layout, AlertsProvider).  Key resets it on navigation just like before.
    <ErrorBoundary key={location.key} boundaryId="app-root" onError={makeOnError('app-root')}>
      <AlertsProvider>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <PageErrorBoundary
                  boundaryId="route-dashboard"
                  featureLabel="Dashboard"
                  onError={makeOnError('route-dashboard')}
                >
                  <RouteSuspense fallback={<DashboardSkeleton />}>
                    <Dashboard />
                  </RouteSuspense>
                </PageErrorBoundary>
              }
            />
            <Route
              path="/prices/:pair"
              element={
                <PageErrorBoundary
                  boundaryId="route-price-detail"
                  featureLabel="Price Detail"
                  onError={makeOnError('route-price-detail')}
                >
                  <RouteSuspense fallback={<PriceDetailSkeleton />}>
                    <PriceDetail />
                  </RouteSuspense>
                </PageErrorBoundary>
              }
            />
            <Route
              path="/price/:pair"
              element={
                <PageErrorBoundary
                  boundaryId="route-price-detail-alt"
                  featureLabel="Price Detail"
                  onError={makeOnError('route-price-detail-alt')}
                >
                  <RouteSuspense fallback={<PriceDetailSkeleton />}>
                    <PriceDetail />
                  </RouteSuspense>
                </PageErrorBoundary>
              }
            />
            <Route
              path="/api-docs"
              element={
                <PageErrorBoundary
                  boundaryId="route-api-docs"
                  featureLabel="API Documentation"
                  onError={makeOnError('route-api-docs')}
                >
                  <RouteSuspense fallback={<ApiDocsSkeleton />}>
                    <ApiDocs />
                  </RouteSuspense>
                </PageErrorBoundary>
              }
            />
            <Route
              path="*"
              element={
                <PageErrorBoundary
                  boundaryId="route-not-found"
                  featureLabel="Page"
                  onError={makeOnError('route-not-found')}
                >
                  <RouteSuspense fallback={<NotFoundSkeleton />}>
                    <NotFound />
                  </RouteSuspense>
                </PageErrorBoundary>
              }
            />
          </Routes>
        </Layout>
      </AlertsProvider>
    </ErrorBoundary>
  )
}

export default function App(): ReactElement {
  useWebVitals()
  initAnalytics()

  return (
    <BrowserRouter basename={BASENAME}>
      <ErrorReporterProvider>
        <PreferencesProvider>
          <ToastProvider>
            <PriceProvider>
              <AppContent />
            </PriceProvider>
          </ToastProvider>
        </PreferencesProvider>
      </ErrorReporterProvider>
    </BrowserRouter>
  )
}
