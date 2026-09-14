import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import { getMeal, getRandomMeal } from '../services/mealdb'
import { extractIngredients, getMealTags, getVideoId, formatInstructionSteps } from '../utils/meal'
import { supportsWebShare, supportsClipboard } from '../utils/platform'
import { isFavorite, toggleFavorite } from '../utils/favorites'
import { APP_TITLE } from '../config/app'

function MealDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [copyState, setCopyState] = useState(null)
  const [favorited, setFavorited] = useState(() => isFavorite(id))

  const load = useCallback(() => {
    if (!id) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    getMeal(id)
      .then((data) => {
        if (!data) throw new Error('not-found')
        setState({ data, loading: false, error: null })
        document.title = `${data.strMeal} — Chakula`
      })
      .catch((error) => {
        setState({ data: null, loading: false, error })
        document.title = 'Meal not found — Chakula'
      })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => () => { document.title = APP_TITLE }, [])

  useEffect(() => {
    setFavorited(isFavorite(id))
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    const meal = state.data
    const title = meal?.strMeal || 'Chakula meal'

    if (supportsWebShare()) {
      try {
        await navigator.share({ title, text: `Check out ${title} on Chakula`, url })
        return
      } catch (error) {
        if (error && error.name === 'AbortError') return
      }
    }

    if (supportsClipboard()) {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        /* fall back below */
      }
    }

    try {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    } catch {
      /* clipboard unavailable */
    }
    setCopyState('Recipe link copied!')
    setTimeout(() => setCopyState(null), 2500)
  }

  const handleAnother = async () => {
    try {
      const meal = await getRandomMeal()
      if (meal) navigate(`/meal/${meal.idMeal}`)
    } catch {
      /* ignore, user can retry */
    }
  }

  const handleFavorite = () => {
    const meal = state.data
    if (!meal) return
    toggleFavorite(meal)
    setFavorited(isFavorite(id))
  }

  if (state.loading) {
    return <LoadingSkeleton variant="detail" />
  }

  if (state.error || !state.data) {
    const isNotFound = state.error?.message === 'not-found' || !state.data
    return (
      <main className="meal-not-found container">
        {isNotFound ? (
          <div className="empty-state">
            <h1 className="empty-state-title">404</h1>
            <h2 className="meal-not-found-sub">Meal not found</h2>
            <p className="empty-state-message">The page you're looking for doesn't exist.</p>
            <Link to="/" className="button button--primary">Back Home</Link>
          </div>
        ) : (
          <ErrorState onRetry={load} />
        )}
      </main>
    )
  }

  const meal = state.data
  const ingredients = extractIngredients(meal)
  const tags = getMealTags(meal)
  const steps = formatInstructionSteps(meal.strInstructions)
  const videoId = getVideoId(meal.strYoutube)

  return (
    <main className="meal-detail">
      <article className="meal-detail-hero">
        <div className="container meal-detail-hero-inner">
          <div className="meal-detail-media">
            <img
              className="meal-detail-img"
              src={meal.strMealThumb}
              alt={meal.strMeal}
              width="1280"
              height="960"
            />
          </div>
          <div className="meal-detail-intro">
            <p className="page-eyebrow">
              {[meal.strCategory, meal.strArea].filter(Boolean).join(' · ') || 'Recipe'}
            </p>
            <h1 className="meal-detail-title">{meal.strMeal}</h1>
            {tags.length > 0 && (
              <ul className="meal-tags" aria-label="Tags">
                {tags.map((tag) => (
                  <li key={tag}>
                    <Link to={`/search?q=${encodeURIComponent(tag)}`} className="meal-tag">
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="meal-detail-actions">
              <button type="button" className={`button ${favorited ? 'button--primary' : 'button--secondary'}`} onClick={handleFavorite} aria-pressed={favorited}>
                <Icon name={favorited ? 'heartFilled' : 'heart'} size={18} />
                {favorited ? 'Saved' : 'Save'}
              </button>
              <button type="button" className="button button--secondary" onClick={handleShare}>
                <Icon name="share" size={18} />
                Share
              </button>
              <button type="button" className="button button--ghost" onClick={handleAnother}>
                <Icon name="random" size={18} />
                Get Another Meal
              </button>
            </div>
            {copyState && <p className="share-confirmation" role="status">{copyState}</p>}
          </div>
        </div>
      </article>

      <section className="container recipe-layout" aria-label="Recipe">
        <div className="recipe-panel">
          <h2 className="recipe-panel-title">
            <Icon name="check" size={20} />
            Ingredients
          </h2>
          <ul className="ingredients-list">
            {ingredients.map(({ ingredient, measure }) => (
              <li key={ingredient} className="ingredient-item">
                <span className="ingredient-check" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                <span className="ingredient-name">{ingredient}</span>
                {measure && <span className="ingredient-measure">{measure}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="recipe-panel">
          <h2 className="recipe-panel-title">Instructions</h2>
          <ol className="instructions-list">
            {steps.map((step, index) => (
              <li key={index} className="instruction-step">
                <span className="step-number">{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>

          {videoId && (
            <div className="recipe-media">
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary"
              >
                <Icon name="video" size={18} />
                Watch tutorial
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default MealDetails