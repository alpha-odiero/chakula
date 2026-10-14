import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import ErrorState from '../components/ErrorState'
import { getRandomMeal } from '../services/mealdb'
import { getMealTags } from '../utils/meal'
import { APP_TITLE } from '../config/app'

function RandomMeal() {
  const [state, setState] = useState({ data: null, loading: false, error: null })
  const navigate = useNavigate()

  const discover = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const meal = await getRandomMeal()
      setState({ data: meal, loading: false, error: null })
      if (meal) document.title = `${meal.strMeal} — Pikawise`
    } catch (error) {
      setState({ data: null, loading: false, error })
    }
  }, [])

  const openRecipe = () => {
    if (state.data) navigate(`/meal/${state.data.idMeal}`)
  }

  return (
    <main className="random-page">
      <section className="container random-hero">
        {!state.data && !state.loading && !state.error && (
          <div className="random-empty">
            <div className="random-icon" aria-hidden="true">
              <Icon name="random" size={44} />
            </div>
            <h1 className="page-title">Feeling hungry but don&apos;t know what to cook?</h1>
            <p className="page-subtitle">
              Let Pikawise pick a delicious meal for you at random.
            </p>
            <button type="button" className="button button--primary button--large" onClick={discover}>
              <Icon name="random" size={20} />
              Discover a Meal
            </button>
          </div>
        )}

        {state.loading && (
          <div className="random-loading">
            <div className="random-loader" role="status" aria-label="Choosing a meal for you">
              <Icon name="cookingPot" size={40} />
            </div>
            <p>Choosing a delicious meal for you…</p>
          </div>
        )}

        {state.error && (
          <ErrorState onRetry={discover} />
        )}

        {state.data && !state.loading && (
          <div className="random-result" key={state.data.idMeal}>
            <div className="random-result-media">
              <button
                type="button"
                className="random-result-image-button"
                onClick={openRecipe}
                aria-label={`Open ${state.data.strMeal} recipe`}
              >
                <img
                  src={state.data.strMealThumb}
                  alt={state.data.strMeal}
                  loading="eager"
                  decoding="async"
                  width="1280"
                  height="960"
                />
              </button>
            </div>
            <div className="random-result-body">
              <p className="page-eyebrow">
                {[state.data.strCategory, state.data.strArea].filter(Boolean).join(' · ')}
              </p>
              <h1 className="random-result-title">{state.data.strMeal}</h1>
              {getMealTags(state.data).length > 0 && (
                <ul className="meal-tags" aria-label="Tags">
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
                  View Recipe
                  <Icon name="arrowRight" size={18} />
                </button>
                <button type="button" className="button button--secondary" onClick={discover}>
                  <Icon name="random" size={18} />
                  Try Another
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