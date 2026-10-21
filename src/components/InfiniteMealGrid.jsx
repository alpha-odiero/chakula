import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MealGrid from './MealGrid'
import { useTranslation } from '../i18n/LocaleContext'

// The category API (TheMealDB filter.php?c=) returns the full list in a
// single response, so batches are prepared locally instead of refetched.
const BATCH_SIZE = 8
// Minimum time a batch spends in the loading state so the indicator renders
// as a real state transition instead of a one-frame flicker.
const MIN_BATCH_MS = 160
// Load the next batch while the sentinel is still below the fold so the grid
// feels continuous on fast scrolls.
const SENTINEL_MARGIN = '250px 0px'

function dedupe(meals) {
  const unique = []
  const seen = new Set()
  for (const meal of meals) {
    if (!meal) continue
    const id = String(meal.id ?? meal.idMeal)
    if (!id || seen.has(id)) continue
    seen.add(id)
    unique.push(meal)
  }
  return unique
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function InfiniteMealGrid({ meals, batchSize = BATCH_SIZE, onProgress, ...gridProps }) {
  const { t } = useTranslation()
  const uniqueMeals = useMemo(() => dedupe(meals || []), [meals])
  const total = uniqueMeals.length
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [status, setStatus] = useState('idle') // idle | loading | error
  // Prefetching starts after the user actually scrolls, so the first view
  // always holds exactly one batch instead of filling the preload margin.
  const [armed, setArmed] = useState(false)
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  // Bumped whenever the source list changes so an in-flight batch append
  // from the previous list can never land on the new one.
  const generationRef = useRef(0)
  const onProgressRef = useRef(onProgress)

  useEffect(() => {
    onProgressRef.current = onProgress
  })

  const shown = Math.min(visibleCount, total)
  const remaining = total - shown
  const done = remaining <= 0
  const showEnd = done && total > batchSize

  useEffect(() => {
    onProgressRef.current?.(shown, total)
  }, [shown, total])

  // Reset pagination whenever the source list changes (new fetch, category
  // switch, retry). Parents also remount us with a `key`, this is the guard
  // for callers that do not.
  useEffect(() => {
    generationRef.current += 1
    loadingRef.current = false
    setVisibleCount(batchSize)
    setStatus('idle')
    setArmed(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meals])

  useEffect(() => {
    if (armed || done || status === 'error') return undefined
    const arm = () => setArmed(true)
    // On a very tall screen the first batch may not be scrollable; arm right
    // away so the rest of the list stays reachable.
    if (document.documentElement.scrollHeight <= window.innerHeight + 24) {
      setArmed(true)
      return undefined
    }
    window.addEventListener('scroll', arm, { passive: true })
    window.addEventListener('wheel', arm, { passive: true })
    window.addEventListener('touchmove', arm, { passive: true })
    window.addEventListener('keydown', arm)
    return () => {
      window.removeEventListener('scroll', arm)
      window.removeEventListener('wheel', arm)
      window.removeEventListener('touchmove', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [armed, done, status])

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    const currentShown = Math.min(visibleCount, uniqueMeals.length)
    if (currentShown >= uniqueMeals.length) return
    loadingRef.current = true
    const generation = generationRef.current
    setStatus('loading')
    const startedAt = Date.now()
    try {
      const batch = uniqueMeals.slice(currentShown, currentShown + batchSize)
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_BATCH_MS) await delay(MIN_BATCH_MS - elapsed)
      if (generation !== generationRef.current) return
      setVisibleCount(currentShown + batch.length)
      setStatus('idle')
    } catch (error) {
      if (generation === generationRef.current) setStatus('error')
    } finally {
      loadingRef.current = false
    }
  }, [uniqueMeals, visibleCount, batchSize])

  // Attach the observer only while more meals exist and no error is waiting
  // for a manual retry — an auto-retrying observer would spin forever on a
  // genuine failure.
  useEffect(() => {
    if (!armed || done || status === 'error') return undefined
    const node = sentinelRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: SENTINEL_MARGIN }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [armed, done, status, loadMore])

  return (
    <>
      <MealGrid meals={uniqueMeals.slice(0, shown)} {...gridProps} />
      {!done && status !== 'error' && (
        <span ref={sentinelRef} className="grid-sentinel" aria-hidden="true" />
      )}
      <div className="grid-status" aria-live="polite">
        {status === 'loading' && (
          <p className="grid-status-msg" role="status">
            <span className="search-suggest-spinner" aria-hidden="true" />
            {t('mealGrid.loadingMore')}
          </p>
        )}
        {status === 'error' && (
          <p className="grid-status-msg grid-status-msg--error" role="alert">
            {t('mealGrid.loadMoreError')}
            <button type="button" className="button button--secondary" onClick={() => loadMore()}>
              {t('common.retry')}
            </button>
          </p>
        )}
        {status === 'idle' && showEnd && (
          <p className="grid-status-msg grid-status-msg--end">{t('mealGrid.endOfList')}</p>
        )}
      </div>
    </>
  )
}

export default InfiniteMealGrid
