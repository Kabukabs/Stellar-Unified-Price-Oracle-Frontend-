import { useState, useEffect, type ReactNode, type ReactElement } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAlerts } from '../hooks/useAlerts'
import { AlertPanel } from './AlertPanel'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/api-docs', label: 'API Docs' },
]

const BOTTOM_NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    path: '/api-docs',
    label: 'API Docs',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gray-100 dark:bg-gray-800 text-cyan-600 dark:text-cyan-400'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
  }`

export function Layout({ children }: { children: ReactNode }): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)
  const { activeCount, togglePanel } = useAlerts()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <nav aria-label="Main navigation" className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 h-16">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <NavLink to="/" end className="flex items-center gap-3 min-h-[44px]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                O
              </div>
              <span className="font-semibold text-lg hidden sm:block text-gray-900 dark:text-white">
                Stellar Oracle
              </span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={navClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePanel}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle price alerts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {activeCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse border border-white dark:border-gray-900" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-cyan-600 dark:text-cyan-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 pb-16 md:pb-0">
        <main id="main-content" className="flex-1 px-4 sm:px-6 py-6 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-area-bottom"
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="hidden md:block border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        Stellar Unified Price Oracle &middot; Developer Portal &amp; Analytics Dashboard
      </footer>
      <AlertPanel />
      <div id="price-announcer" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  )
}
