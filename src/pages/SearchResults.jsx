import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import MealGrid from '../components/MealGrid'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import { searchMeals } from '../services/mealdb'
import { useDebouncedValue } from '../hooks/useDebounce'

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState({ data: null, loading: false, error: null })
  const [sort, setSort] = useState('relevance')
  const debouncedQuery = useDebouncedValue(query, 300)

  const runSearch = useCallback((q) => {
    if (!q.trim()) {
      setResults({ data: [], loading: false, error: null })
      return
    }
    setResults((prev) => ({ ...prev, loading: true, error: null }))
    searchMeals(q)
      .then((data) => setResults({ data, loading: false, error: null }))
      .catch((error) => setResults({ data: null, loading: false, error }))
  }, [])

  useEffect(() => {
    runSearch(debouncedQuery)
  }, [debouncedQuery, runSearch])

  const updateQuery = (value) => {
    if (value.trim()) {
      setSearchParams({ q: value.trim() })
    } else {
      setSearchParams({})
    }
  }

  const sortedData = useMemo(() => {
    const data = results.data || []
    if (sort === 'name') return [...data].sort((a, b) => a.strMeal.localeCompare(b.strMeal))
    if (sort === 'category') {
      return [...data].sort((a, b) => (a.strCategory || '').localeCompare(b.strCategory || ''))
    }
    return data
  }, [results.data, sort])

  useEffect(() => {
    if (query.trim()) document.title = `Search results for "${query}" — Pikawise`
  }, [query])

  return (
    <main className="search-page">
      <PageHeader eyebrow="Search" title={query ? `Search results for "${query}"` : 'Search meals'}>
        <div className="explore-search">
          <SearchBar
            defaultValue={query}
            placeholder="Search meals, ingredients, cuisine…"
            onSearch={updateQuery}
          />
        </div>
      </PageHeader>

      <section className="container search-body">
        <div className="results-head">
          <div className="results-head-info">
            {!results.loading && results.data && (
              <span className="results-count" role="status">
                {results.data.length} {results.data.length === 1 ? 'meal found' : 'meals found'}
              </span>
            )}
          </div>
          {results.data && results.data.length > 1 && (
            <label className="sort-control">
              <span className="visually-hidden">Sort results</span>
              <Icon name="chevronDown" size={16} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results">
                <option value="relevance">Sort: Relevance</option>
                <option value="name">Sort: Name (A–Z)</option>
                <option value="category">Sort: Category</option>
              </select>
            </label>
          )}
        </div>
        {!query && (
          <EmptyState
            title="Try a search"
            message="Search for a meal name or ingredient, like chicken, rice, beef, pasta, or fish."
            icon={<Icon name="search" size={40} />}
          />
        )}

        {query && results.loading && <MealGrid loading />}
        {query && results.error && (
          <ErrorState
            onRetry={() => runSearch(query)}
          />
        )}
        {query && !results.loading && !results.error && sortedData.length > 0 && (
          <MealGrid meals={sortedData} />
        )}
        {query && !results.loading && !results.error && sortedData.length === 0 && (
          <EmptyState
            title="No meals found"
            message="Try another ingredient or meal name."
            action={
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate('/explore')}
              >
                Explore meals
              </button>
            }
          />
        )}
      </section>
    </main>
  )
}

export default SearchResults