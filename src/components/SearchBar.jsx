import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { searchMeals } from '../services/mealdb'
import { useDebouncedValue } from '../hooks/useDebounce'

const MIN_QUERY_LENGTH = 2
const MAX_SUGGESTIONS = 6
const DEBOUNCE_MS = 250

// Session cache so re-typing a previous query shows suggestions instantly.
const suggestionCache = new Map()

function SearchBar({
  defaultValue = '',
  placeholder = 'Find recipes, meals or ingredients…',
  size = 'normal',
  onSearch = null,
  filterTo = null,
  filterLabel = 'Open filters'
}) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState([])
  const [phase, setPhase] = useState('idle') // idle | loading | ready | empty | error
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [retryToken, setRetryToken] = useState(0)
  const requestIdRef = useRef(0)
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS)
  const baseId = useId()
  const navigate = useNavigate()

  const trimmed = value.trim()
  const showPanel = open && trimmed.length >= MIN_QUERY_LENGTH && phase !== 'idle'

  useEffect(() => {
    setValue(defaultValue)
    setOpen(false)
    setActiveIndex(-1)
  }, [defaultValue])

  // Fetch suggestions for the debounced query with a stale-response guard.
  useEffect(() => {
    const query = debouncedValue.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setPhase('idle')
      setActiveIndex(-1)
      return undefined
    }

    const cacheKey = query.toLowerCase()
    const cached = suggestionCache.get(cacheKey)
    if (cached) {
      setSuggestions(cached)
      setPhase(cached.length ? 'ready' : 'empty')
      setActiveIndex(-1)
      return undefined
    }

    const requestId = ++requestIdRef.current
    let cancelled = false
    setPhase('loading')

    searchMeals(query)
      .then((data) => {
        if (cancelled || requestId !== requestIdRef.current) return
        const items = (data || []).slice(0, MAX_SUGGESTIONS)
        suggestionCache.set(cacheKey, items)
        setSuggestions(items)
        setPhase(items.length ? 'ready' : 'empty')
        setActiveIndex(-1)
      })
      .catch(() => {
        if (cancelled || requestId !== requestIdRef.current) return
        setSuggestions([])
        setPhase('error')
        setActiveIndex(-1)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedValue, retryToken])

  const handleChange = (event) => {
    const next = event.target.value
    setValue(next)
    setActiveIndex(-1)

    const query = next.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setOpen(false)
      setSuggestions([])
      setPhase('idle')
      return
    }

    const cached = suggestionCache.get(query.toLowerCase())
    if (cached) {
      setSuggestions(cached)
      setPhase(cached.length ? 'ready' : 'empty')
      setOpen(true)
      return
    }

    // Show the loading state immediately instead of waiting for the debounce.
    setSuggestions([])
    setPhase('loading')
    setOpen(true)
  }

  const openMeal = (meal) => {
    setOpen(false)
    setActiveIndex(-1)
    navigate(`/meal/${meal.id}`)
  }

  const viewAll = (query = trimmed) => {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    setActiveIndex(-1)
    if (onSearch) onSearch(q)
    else navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (activeIndex >= 0 && activeIndex < suggestions.length && suggestions[activeIndex]) {
      openMeal(suggestions[activeIndex])
      return
    }
    const q = trimmed
    if (!q) {
      if (filterTo) navigate(filterTo)
      return
    }
    setOpen(false)
    setActiveIndex(-1)
    if (onSearch) {
      onSearch(q)
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const optionCount = phase === 'ready' ? suggestions.length + 1 : 0 // + "see all results"

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
      }
      return
    }
    if (!showPanel || optionCount === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index + 1) % optionCount)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (index <= 0 ? optionCount - 1 : index - 1))
    } else if (event.key === 'Home' && activeIndex >= 0) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && activeIndex >= 0) {
      event.preventDefault()
      setActiveIndex(optionCount - 1)
    }
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const isOptionActive = (index) => activeIndex === index
  const optionId = (index) => `${baseId}-option-${index}`

  return (
    <form
      className={`search-bar search-bar--${size}`}
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search recipes"
      onBlur={handleBlur}
    >
      <span className="search-icon" aria-hidden="true">
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search recipes, meals or ingredients"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={showPanel && phase === 'ready' ? `${baseId}-listbox` : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showPanel && activeIndex >= 0 && activeIndex < optionCount ? optionId(activeIndex) : ''
        }
        autoComplete="off"
      />
      <button type="submit" className="search-button">
        Search
      </button>
      {filterTo && (
        <Link to={filterTo} className="search-filter" aria-label={filterLabel}>
          <Icon name="sliders" size={18} />
        </Link>
      )}

      {showPanel && (
        <div className="search-suggestions" id={`${baseId}-panel`}>
          {phase === 'loading' && (
            <p className="search-suggest-status" role="status">
              <span className="search-suggest-spinner" aria-hidden="true" />
              Searching for “{trimmed}”…
            </p>
          )}

          {phase === 'error' && (
            <div className="search-suggest-status" role="status">
              <span>We couldn’t reach recipes right now.</span>
              <button
                type="button"
                className="link-button"
                onClick={() => setRetryToken((token) => token + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {phase === 'empty' && (
            <p className="search-suggest-status" role="status">
              We couldn’t find an exact match for “{trimmed}”. Try a different meal name or
              ingredient.
            </p>
          )}

          {phase === 'ready' && (
            <ul
              className="search-suggest-list"
              id={`${baseId}-listbox`}
              role="listbox"
              aria-label="Meal suggestions"
            >
              {suggestions.map((meal, index) => (
                <li
                  key={meal.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isOptionActive(index)}
                  className={`search-suggest-item${isOptionActive(index) ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openMeal(meal)}
                >
                  {meal.image && (
                    <img
                      className="search-suggest-thumb"
                      src={meal.image}
                      alt=""
                      width="38"
                      height="38"
                      loading="lazy"
                    />
                  )}
                  <span className="search-suggest-text">
                    <span className="search-suggest-name">{meal.name}</span>
                    <span className="search-suggest-meta">
                      {[meal.category, meal.area].filter(Boolean).join(' · ') || 'Recipe'}
                    </span>
                  </span>
                  <Icon name="arrowRight" size={16} className="search-suggest-arrow" />
                </li>
              ))}
              <li
                id={optionId(suggestions.length)}
                role="option"
                aria-selected={isOptionActive(suggestions.length)}
                className={`search-suggest-item search-suggest-all${
                  isOptionActive(suggestions.length) ? ' is-active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(suggestions.length)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => viewAll()}
              >
                <span className="search-suggest-thumb search-suggest-thumb--icon" aria-hidden="true">
                  <Icon name="search" size={16} />
                </span>
                <span className="search-suggest-text">
                  <span className="search-suggest-name">See all results for “{trimmed}”</span>
                </span>
                <Icon name="arrowRight" size={16} className="search-suggest-arrow" />
              </li>
            </ul>
          )}
        </div>
      )}
    </form>
  )
}

export default SearchBar
