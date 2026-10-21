import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import MealGrid from '../components/MealGrid'
import InfiniteMealGrid from '../components/InfiniteMealGrid'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'
import { SITE_URL } from '../config/app'
import { filterByCategory, getCategories } from '../services/mealdb'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function Category() {
  const { t } = useTranslation()
  const { category: slug } = useParams()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [categoryName, setCategoryName] = useState(null)
  const requestIdRef = useRef(0)

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))
    getCategories()
      .then((categories) => {
        // Ignore this response if the user already switched category.
        if (requestId !== requestIdRef.current) return []
        const match = categories.find((c) => slugify(c.name ?? c.strCategory) === slug)
        const name = match ? (match.name ?? match.strCategory) : slug
        setCategoryName(name)
        return filterByCategory(name)
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return
        setState({ data: Array.isArray(data) ? data : [], loading: false, error: null })
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return
        setState({ data: null, loading: false, error })
      })
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  const displayName = categoryName || slug

  useSeo({
    title: t('category.seo.title', { category: displayName }),
    description: t('category.seo.description', { category: displayName.toLowerCase() }),
    path: `/categories/${slug}`,
    jsonLd:
      state.data && state.data.length > 0
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${displayName} recipes`,
            numberOfItems: state.data.length,
            itemListElement: state.data.slice(0, 30).map((meal, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: meal.name ?? meal.strMeal,
              url: `${SITE_URL}/meal/${meal.id ?? meal.idMeal}`
            }))
          }
        : null
  })

  return (
    <main className="category-page">
      <PageHeader eyebrow={t('category.eyebrow')} title={displayName}>
        <p>{t('category.mealsInCategory')}</p>
      </PageHeader>
      <section className="container">
        {state.loading && <MealGrid loading />}
        {state.error && <ErrorState onRetry={load} />}
        {!state.loading && !state.error && state.data && state.data.length > 0 && (
          <InfiniteMealGrid key={slug} meals={state.data} />
        )}
        {!state.loading && !state.error && state.data && state.data.length === 0 && (
          <EmptyState
            title={t('category.emptyTitle')}
            message={t('category.emptyMessage')}
            action={
              <Link to="/categories" className="button button--primary">
                {t('common.browseCategories')}
              </Link>
            }
          />
        )}
      </section>
    </main>
  )
}

export default Category