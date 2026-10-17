import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import MealGrid from '../components/MealGrid'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { filterByCategory, getCategories } from '../services/mealdb'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function Category() {
  const { category: slug } = useParams()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [categoryName, setCategoryName] = useState(null)

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    getCategories()
      .then((categories) => {
        const match = categories.find((c) => slugify(c.name ?? c.strCategory) === slug)
        const name = match ? (match.name ?? match.strCategory) : slug
        setCategoryName(name)
        return filterByCategory(name)
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error }))
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  const displayName = categoryName || slug

  return (
    <main className="category-page">
      <PageHeader eyebrow="Category" title={displayName}>
        <p>Meals in this category</p>
      </PageHeader>
      <section className="container">
        {state.loading && <MealGrid loading />}
        {state.error && <ErrorState onRetry={load} />}
        {!state.loading && !state.error && state.data && state.data.length > 0 && (
          <MealGrid meals={state.data} />
        )}
        {!state.loading && !state.error && state.data && state.data.length === 0 && (
          <EmptyState
            title="No meals in this category"
            message="This category doesn't have any meals right now."
            action={
              <Link to="/categories" className="button button--primary">
                Browse categories
              </Link>
            }
          />
        )}
      </section>
    </main>
  )
}

export default Category