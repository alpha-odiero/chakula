import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ErrorState from '../components/ErrorState'
import PikawiseLoader from '../components/PikawiseLoader'
import { getRandomMeal } from '../services/mealdb'
import { getMealTags } from '../utils/meal'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

function RandomMeal() {
  const { t } = useTranslation()
  useSeo({
    title: t('random.seo.title'),
    description: t('random.seo.description'),
    path: '/random'
  })
  const [state, setState] = useState({ data: null, loading: false, error: null })
  const navigate = useNavigate()

  const discover = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const meal = await getRandomMeal()
      setState({ data: meal, loading: false, error: null })
    } catch (error) {
      setState({ data: null, loading: false, error })
    }
  }, [])

  const openRecipe = () => {
    if (state.data) navigate(`/meal/${state.data.id ?? state.data.idMeal}`)
  }

  return (
    <main className="random-page">
      <section className="container random-hero">
        {!state.data && !state.loading && !state.error && (
          <div className="random-empty">
            <div className="random-icon" aria-hidden="true">
              <Icon name="random" size={44} />
            </div>
            <h1 className="page-title">{t('random.title')}</h1>
            <p className="page-subtitle">{t('random.subtitle')}</p>
            <button type="button" className="button button--primary button--large" onClick={discover}>
              <Icon name="random" size={20} />
              {t('random.discoverCta')}
            </button>
          </div>
        )}

        {state.loading && (
          <div className="random-loading">
            <PikawiseLoader variant="inline" label={t('random.loadingLabel')} />
            <p>{t('random.loadingText')}</p>
          </div>
        )}

        {state.error && (
          <ErrorState onRetry={discover} />
        )}

        {state.data && !state.loading && (
          <div className="random-result" key={state.data.id ?? state.data.idMeal}>
            <div className="random-result-media">
              <button
                type="button"
                className="random-result-image-button"
                onClick={openRecipe}
                aria-label={t('random.openRecipe', { name: state.data.name ?? state.data.strMeal })}
              >
                <img
                  src={state.data.image ?? state.data.strMealThumb}
                  alt={state.data.name ?? state.data.strMeal}
                  loading="eager"
                  decoding="async"
                  width="1280"
                  height="960"
                />
              </button>
            </div>
            <div className="random-result-body">
              <p className="page-eyebrow">
                {[state.data.category ?? state.data.strCategory, state.data.area ?? state.data.strArea].filter(Boolean).join(' · ')}
              </p>
              <h1 className="random-result-title">{state.data.name ?? state.data.strMeal}</h1>
              {getMealTags(state.data).length > 0 && (
                <ul className="meal-tags" aria-label={t('a11y.tags')}>
                  {getMealTags(state.data).slice(0, 4).map((tag) => (
                    <li key={tag}>
                      <Link to={`/search?q=${encodeURIComponent(tag)}`} className="meal-tag">
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="random-result-actions">
                <button type="button" className="button button--primary" onClick={openRecipe}>
                  {t('common.viewRecipe')}
                  <Icon name="arrowRight" size={18} />
                </button>
                <button type="button" className="button button--secondary" onClick={discover}>
                  <Icon name="random" size={18} />
                  {t('random.tryAnother')}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default RandomMeal