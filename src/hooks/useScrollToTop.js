import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (!hash || hash === '#') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return undefined
    }

    // Hash targets can live in lazily loaded routes, so the element may not
    // exist on the first frame. Retry for a short while before giving up.
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tries = 0
    let frame = 0

    const tryScroll = () => {
      let element = null
      try {
        element = document.querySelector(hash)
      } catch {
        element = null
      }
      if (element) {
        element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
        return
      }
      if (tries < 60) {
        tries += 1
        frame = requestAnimationFrame(tryScroll)
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }

    frame = requestAnimationFrame(tryScroll)
    return () => cancelAnimationFrame(frame)
  }, [pathname, search, hash])
}
