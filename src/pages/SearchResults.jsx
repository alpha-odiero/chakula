import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import MealGrid from '../components/MealGrid'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'
import { searchMeals } from '../services/mealdb'
import { useDebouncedValue } from '../hooks/useDebounce'

function SearchResults() {
  const { t } = useTranslation()
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
    if (sort === 'name') return [...data].sort((a, b) => (a.name ?? a.strMeal ?? '').localeCompare(b.name ?? b.strMeal ?? ''))
    if (sort === 'category') {
      return [...data].sort((a, b) => String(a.category ?? a.strCategory ?? '').localeCompare(String(b.category ?? b.strCategory ?? '')))
    }
    return data
  }, [results.data, sort])

  useSeo({
    title: query ? t('search.seo.title', { query }) : t('search.seo.defaultTitle'),
    description: query ? t('search.seo.description', { query }) : t('search.seo.defaultDescription'),
    path: '/search',
    robots: 'noindex,follow'
  })

  return (
    <main className="search-page">
      <PageHeader
        eyebrow={t('search.eyebrow')}
        title={query ? t('search.title', { query }) : t('search.defaultTitle')}
      >
        <div className="explore-search">
          <SearchBar
            defaultValue={query}
            placeholder={t('common.searchPlaceholder')}
            onSearch={updateQuery}
          />
        </div>
      </PageHeader>

      <section className="container search-body">
        <div className="results-head">
          <div className="results-head-info">
            {!results.loading && results.data && (
              <span className="results-count" role="status">
                {t('search.resultCount', { count: results.data.length })}
              </span>
            )}
          </div>
          {results.data && results.data.length > 1 && (
            <label className="sort-control">
              <span className="visually-hidden">{t('search.sortLabel')}</span>
              <Icon name="chevronDown" size={16} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('search.sortLabel')}>
                <option value="relevance">{t('search.sortRelevance')}</option>
                <option value="name">{t('search.sortName')}</option>
                <option value="category">{t('search.sortCategory')}</option>
              </select>
            </label>
          )}
        </div>
        {!query && (
          <EmptyState
            title={t('search.emptyTitle')}
            message={t('search.emptyMessage')}
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
            title={t('search.noMealsTitle')}
            message={t('search.noMealsMessage')}
            action={
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate('/explore')}
              >
                {t('common.exploreMeals')}
              </button>
            }
          />
        )}
      </section>
    </main>
  )
}

export default SearchResults