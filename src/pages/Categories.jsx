import { useCallback, useEffect, useState } from 'react'
import CategoryCard from '../components/CategoryCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import PageHeader from '../components/PageHeader'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'
import { getCategories } from '../services/mealdb'

function Categories() {
  const { t } = useTranslation()
  useSeo({
    title: t('categories.seo.title'),
    description: t('categories.seo.description'),
    path: '/categories'
  })
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
      <PageHeader
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
      />
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