import { useCallback, useEffect, useState } from 'react'
import CategoryCard from '../components/CategoryCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import PageHeader from '../components/PageHeader'
import { getCategories } from '../services/mealdb'

function Categories() {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  const load = useCallback(() => {
    setState({ data: null, loading: true, error: null })
    getCategories()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }))
  }, [])

  useEffect(load, [load])

  return (
    <main className="categories-page">
      <PageHeader eyebrow="Categories" title="Browse by category" subtitle="Pick a category to discover meals." />
      <section className="container categories-body">
        {state.loading && (
          <div className="category-grid category-grid--cards">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="category" />
            ))}
          </div>
        )}
        {state.error && <ErrorState onRetry={load} />}
        {!state.loading && !state.error && (
          <div className="category-grid category-grid--cards">
            {state.data.map((category) => (
              <CategoryCard key={category.name ?? category.strCategory} category={category} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Categories