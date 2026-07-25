import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { installConsoleAggregator } from './utils/consoleAggregator'

installConsoleAggregator()

async function prepare(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({ onUnhandledRequest: 'bypass' })
    } catch (err) {
      console.warn('MSW worker failed to start, continuing without mocks:', err)
    }
  }
}

prepare().then(() => {
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element #root not found')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

// Register the service worker for offline support / caching.
// The .catch() is required: without it, registration failures (e.g. non-HTTPS
// environment, scope errors, or unsupported browser) produce an unhandled
// promise rejection that can terminate the script in some environments and
// always obscures real errors in test output.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/mockServiceWorker.js', { scope: '/' })
    .catch((err) => console.error('SW registration failed:', err))
}
