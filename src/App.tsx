import { lazy, type ReactElement } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouteSuspense } from './components/Skeletons/RouteSuspense'
import { DashboardSkeleton } from './components/Skeletons/DashboardSkeleton'
import { PriceDetailSkeleton } from './components/PriceDetailSkeleton'
import { ApiDocsSkeleton } from './components/Skeletons/ApiDocsSkeleton'
import { NotFoundSkeleton } from './components/Skeletons/NotFoundSkeleton'
import { AlertsProvider } from './hooks/useAlerts'
import { ToastProvider } from './context/ToastContext'
import { PriceProvider } from './context/PriceContext'
import { PreferencesProvider } from './preferences/PreferencesContext'
import { ErrorReporterProvider, useErrorReporter } from './context/ErrorReporterContext'
import { PriceProvider } from './context/PriceContext'
import { useWebVitals } from './hooks/useWebVitals'
import { useAccessibility } from './hooks/useAccessibility'
import { initAnalytics, trackPageview } from './hooks/useAnalytics'
import type { ErrorInfo } from 'react'

// Route-level code splitting: each page becomes its own chunk.
// All pages use named exports, re-exported as `default` for React.lazy.
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const Landing = lazy(() =>
  import('./pages/Landing').then((m) => ({ default: m.Landing })),
)
const PriceDetail = lazy(() =>
  import('./pages/PriceDetail').then((m) => ({ default: m.PriceDetail })),
)
const ApiDocs = lazy(() =>
  import('./pages/ApiDocs').then((m) => ({ default: m.ApiDocs })),
)
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
)

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

export function AppContent(): ReactElement {
  const location = useLocation()
  const { captureError } = useErrorReporter()

  useAccessibility()
  trackPageview(location.pathname)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const makeOnError = (boundaryId: string) =>
    (error: Error, info: ErrorInfo) => captureError(error, info, boundaryId)

  return (
    <ErrorBoundary key={location.key}>
      <AlertsProvider>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <RouteSuspense fallback={<DashboardSkeleton />}>
                  <Landing />
                </RouteSuspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RouteSuspense fallback={<DashboardSkeleton />}>
                  <Dashboard />
                </RouteSuspense>
              }
            />
            <Route
              path="/prices/:pair"
              element={
                <RouteSuspense fallback={<PriceDetailSkeleton />}>
                  <PriceDetail />
                </RouteSuspense>
              }
            />
            <Route
              path="/price/:pair"
              element={
                <RouteSuspense fallback={<PriceDetailSkeleton />}>
                  <PriceDetail />
                </RouteSuspense>
              }
            />
            <Route
              path="/api-docs"
              element={
                <RouteSuspense fallback={<ApiDocsSkeleton />}>
                  <ApiDocs />
                </RouteSuspense>
              }
            />
            <Route
              path="*"
              element={
                <RouteSuspense fallback={<NotFoundSkeleton />}>
                  <NotFound />
                </RouteSuspense>
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
