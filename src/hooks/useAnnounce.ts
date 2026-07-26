import { useCallback, useRef } from 'react'

interface UseAnnounceOptions {
  /** Minimum interval between announcements in ms. Default: 5000 */
  throttleMs?: number
}

/**
 * Returns a function that announces text to screen readers via an aria-live region.
 * Announcements are throttled to avoid overwhelming the user.
 */
export function useAnnounce(options: UseAnnounceOptions = {}) {
  const { throttleMs = 5000 } = options
  const lastAnnounced = useRef(0)
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  const getRegion = useCallback(() => {
    if (liveRegionRef.current) return liveRegionRef.current

    let region = document.getElementById('sr-announcer')
    if (!region) {
      region = document.createElement('div')
      region.id = 'sr-announcer'
      region.setAttribute('role', 'status')
      region.setAttribute('aria-live', 'polite')
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      document.body.appendChild(region)
    }
    liveRegionRef.current = region as HTMLDivElement
    return liveRegionRef.current
  }, [])

  const announce = useCallback(
    (text: string) => {
      const now = Date.now()
      if (now - lastAnnounced.current < throttleMs) return
      lastAnnounced.current = now
      const region = getRegion()
      region.textContent = ''
      // Small delay so the live region mutation is detected
      requestAnimationFrame(() => {
        region.textContent = text
      })
    },
    [throttleMs, getRegion],
  )

  return announce
}
