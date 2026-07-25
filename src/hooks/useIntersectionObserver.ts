import { useEffect, useRef, useState } from 'react'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Callback invoked when intersection state changes */
  onIntersect?: (entry: IntersectionObserverEntry) => void
}

/**
 * Observes a DOM element's visibility within the viewport using IntersectionObserver.
 *
 * Returns a `ref` to attach to the target element and an `isIntersecting` boolean.
 * Automatically cleans up the observer on unmount or when the target changes.
 *
 * @param options - IntersectionObserver configuration and optional callback
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
) {
  const { onIntersect, ...observerOptions } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const onIntersectRef = useRef(onIntersect)
  onIntersectRef.current = onIntersect

  // Create a stable callback ref setter
  const ref = (node: Element | null) => {
    observerRef.current?.disconnect()
    targetRef.current = node

    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setIsIntersecting(entry.isIntersecting)
            onIntersectRef.current?.(entry)
          }
        },
        observerOptions,
      )
      observer.observe(node)
      observerRef.current = observer
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return { ref, isIntersecting }
}
