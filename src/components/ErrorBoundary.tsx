import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary for catching render-time errors.
 *
 * ## Limitation — async errors are NOT caught by this boundary
 *
 * React error boundaries only intercept errors thrown during:
 *   - Component render
 *   - Lifecycle methods (componentDidMount, componentDidUpdate, etc.)
 *   - Class component constructors
 *
 * They do NOT catch errors originating from:
 *   - Event handlers (wrap those in try-catch yourself)
 *   - Async code: Promise chains, setTimeout, requestAnimationFrame, async/await
 *   - Server-side rendering
 *
 * For async/global errors use the `useGlobalErrorHandler` hook exported from
 * this module, which wires up `window.onerror` and `window.onunhandledrejection`
 * as a last-resort safety net.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Hook that installs global handlers for errors that React error boundaries
 * cannot catch: unhandled promise rejections and uncaught synchronous errors
 * thrown outside of React's render cycle (e.g. in event handlers, timers, or
 * third-party callbacks).
 *
 * Mount this once near the root of the application (e.g. inside `<App>`).
 * The handlers are automatically removed when the component unmounts.
 *
 * @param onError - Optional callback invoked with every captured error.
 *   Defaults to `console.error`.
 *
 * @example
 * ```tsx
 * function App() {
 *   useGlobalErrorHandler((err) => reportToMonitoring(err))
 *   return <RouterProvider ... />
 * }
 * ```
 */
export function useGlobalErrorHandler(
  onError?: (error: Error) => void,
): void {
  useEffect(() => {
    const report = onError ?? ((err: Error) => console.error('Unhandled error:', err))

    const handleError = (event: ErrorEvent) => {
      report(event.error instanceof Error ? event.error : new Error(event.message))
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const error = reason instanceof Error ? reason : new Error(String(reason))
      report(error)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [onError])
}
