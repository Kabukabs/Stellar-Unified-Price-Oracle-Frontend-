import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Wraps page content with a fade+slide-up animation on route change.
 * Respects the user's `prefers-reduced-motion` setting — animation is
 * instant when reduced motion is active.
 */
export function PageTransition({ children }: PageTransitionProps): ReactElement {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [phase, setPhase] = useState<'enter' | 'idle'>('idle')
  const prevPathRef = useRef(location.pathname)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return
    prevPathRef.current = location.pathname

    // Cancel any pending animation frame from a previous transition
    if (frameRef.current) cancelAnimationFrame(frameRef.current)

    // Swap content and trigger enter animation
    setDisplayChildren(children)
    setPhase('enter')

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => {
        setPhase('idle')
      })
    })

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Keep displayed children in sync when not transitioning
  useEffect(() => {
    if (phase === 'idle') {
      setDisplayChildren(children)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  const enterStyle: React.CSSProperties =
    phase === 'enter'
      ? { opacity: 0, transform: 'translateY(6px)' }
      : { opacity: 1, transform: 'translateY(0)', transition: 'opacity 0.22s ease, transform 0.22s ease' }

  return (
    <div style={enterStyle} className="page-transition-root">
      {displayChildren}
    </div>
  )
}
