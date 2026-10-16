import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import CookingMode from '../components/CookingMode'
import { useToast } from '../components/Toast'
import { getMeal, getRandomMeal } from '../services/mealdb'
import {
  extractIngredients,
  getMealTags,
  getVideoId,
  formatInstructionSteps,
  scaleMeasure
} from '../utils/meal'
import { supportsWebShare, supportsClipboard } from '../utils/platform'
import { isFavorite, toggleFavorite } from '../utils/favorites'
import { addPersonalShoppingItem } from '../utils/storage'
import { APP_TITLE } from '../config/app'

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6]

function MealDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const toast = useToast()
  const [favorited, setFavorited] = useState(() => isFavorite(id))
  const [servings, setServings] = useState(1)
  const [checked, setChecked] = useState(() => new Set())
  const [cooking, setCooking] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    getMeal(id)
      .then((data) => {
        if (!data) throw new Error('not-found')
        setState({ data, loading: false, error: null })
        document.title = `${data.strMeal} — Pikawise`
      })
      .catch((error) => {
        setState({ data: null, loading: false, error })
        document.title = 'Recipe not found — Pikawise'
      })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => () => { document.title = APP_TITLE }, [])

  useEffect(() => {
    setFavorited(isFavorite(id))
    setServings(1)
    setChecked(new Set())
    setCooking(false)
  }, [id])

  const meal = state.data
  const ingredients = useMemo(() => extractIngredients(meal), [meal])
  const steps = useMemo(() => formatInstructionSteps(meal?.strInstructions), [meal])
  const tags = useMemo(() => getMealTags(meal), [meal])
  const videoId = getVideoId(meal?.strYoutube)

  const handleShare = async () => {
    const url = window.location.href
    const title = meal?.strMeal || 'Pikawise meal'

    if (supportsWebShare()) {
      try {
        await navigator.share({ title, text: `Check out ${title} on Pikawise`, url })
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
      toast.error('Could not copy the recipe link.')
      return
    }
    toast.success('Recipe link copied.')
  }

  const handleAnother = async () => {
    try {
      const next = await getRandomMeal()
      if (next) navigate(`/meal/${next.idMeal}`)
    } catch {
      /* ignore, user can retry */
    }
  }

  const handleFavorite = () => {
    if (!meal) return
    toggleFavorite(meal)
    const nowSaved = isFavorite(id)
    setFavorited(nowSaved)
    if (nowSaved) toast.success('Recipe saved.')
    else toast.info('Removed from saved recipes.')
  }

  const toggleIngredient = (name) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleAddMissing = () => {
    ingredients
      .filter(({ ingredient }) => !checked.has(ingredient))
      .forEach(({ ingredient }) => addPersonalShoppingItem(ingredient))
    toast.success('Added to your shopping list.')
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
            <h2 className="meal-not-found-sub">Recipe not found</h2>
            <p className="empty-state-message">The recipe you are looking for doesn&apos;t exist.</p>
            <Link to="/explore" className="button button--primary">Browse recipes</Link>
          </div>
        ) : (
          <ErrorState onRetry={load} />
        )}
      </main>
    )
  }

  const readyCount = checked.size
  const meta = [meal.strCategory, meal.strArea].filter(Boolean).join(' · ')

  return (
    <main className="meal-detail">
      <div className="meal-detail-bar">
        <div className="container meal-detail-bar-inner">
          <button type="button" className="meal-detail-bar-button" onClick={() => navigate(-1)} aria-label="Go back">
            <Icon name="chevronLeft" size={20} />
          </button>
          <p className="meal-detail-bar-title">{meal.strMeal}</p>
          <div className="meal-detail-bar-actions">
            <button
              type="button"
              className="meal-detail-bar-button"
              onClick={handleFavorite}
              aria-pressed={favorited}
              aria-label={favorited ? 'Remove from saved' : 'Save recipe'}
            >
              <Icon name={favorited ? 'heartFilled' : 'heart'} size={19} />
            </button>
            <button
              type="button"
              className="meal-detail-bar-button"
              onClick={handleShare}
              aria-label="Share recipe"
            >
              <Icon name="share" size={19} />
            </button>
          </div>
        </div>
      </div>

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
            <p className="page-eyebrow">{meta || 'Recipe'}</p>
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
              <button
                type="button"
                className="button button--primary button--large"
                onClick={() => setCooking(true)}
              >
                <Icon name="play" size={18} />
                Start cooking
              </button>
              <button
                type="button"
                className={`button button--secondary button--large${favorited ? ' is-active' : ''}`}
                onClick={handleFavorite}
                aria-pressed={favorited}
              >
                <Icon name={favorited ? 'heartFilled' : 'heart'} size={18} />
                {favorited ? 'Saved' : 'Save'}
              </button>
              <button type="button" className="button button--ghost button--large" onClick={handleAnother}>
                <Icon name="random" size={18} />
                Surprise me
              </button>
            </div>
          </div>
        </div>
      </article>

      <section className="container recipe-layout" aria-label="Recipe">
        <div className="recipe-panel">
          <div className="recipe-panel-head">
            <h2 className="recipe-panel-title">
              <Icon name="utensils" size={20} />
              Ingredients
            </h2>
            {ingredients.length > 0 && (
              <span className="recipe-panel-count">
                {readyCount}/{ingredients.length} ready
              </span>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="servings-control">
              <span className="servings-label">
                <Icon name="servings" size={16} />
                Servings
              </span>
              <div className="servings-options" role="group" aria-label="Number of servings">
                {SERVING_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`servings-option${servings === option ? ' servings-option--active' : ''}`}
                    onClick={() => setServings(option)}
                    aria-pressed={servings === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className="ingredients-list">
            {ingredients.map(({ ingredient, measure }) => {
              const isChecked = checked.has(ingredient)
              const scaled = scaleMeasure(measure, servings)
              return (
                <li key={ingredient} className={`ingredient-item${isChecked ? ' ingredient-item--checked' : ''}`}>
                  <label className="ingredient-toggle">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleIngredient(ingredient)}
                    />
                    <span className="ingredient-check" aria-hidden="true">
                      <Icon name="check" size={13} />
                    </span>
                    <span className="ingredient-name">{ingredient}</span>
                    {scaled && <span className="ingredient-measure">{scaled}</span>}
                  </label>
                </li>
              )
            })}
          </ul>

          <p className="recipe-panel-note">
            Tick what you already have. Amounts start from the recipe&apos;s listed quantities.
          </p>

          {ingredients.length > 0 && (
            <button type="button" className="button button--secondary button--block" onClick={handleAddMissing}>
              <Icon name="shoppingBag" size={18} />
              Add missing to shopping list
            </button>
          )}
        </div>

        <div className="recipe-panel">
          <div className="recipe-panel-head">
            <h2 className="recipe-panel-title">
              <Icon name="list" size={20} />
              Instructions
            </h2>
            {steps.length > 0 && (
              <span className="recipe-panel-count">{steps.length} steps</span>
            )}
          </div>

          {steps.length > 0 ? (
            <ol className="instructions-list">
              {steps.map((step, index) => (
                <li key={index} className="instruction-step">
                  <span className="step-number">{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="recipe-panel-note">
              This recipe doesn&apos;t include written instructions.
            </p>
          )}

          <div className="recipe-media">
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() => setCooking(true)}
            >
              <Icon name="play" size={18} />
              Start cooking
            </button>

            {videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary button--block"
              >
                <Icon name="video" size={18} />
                Watch tutorial
              </a>
            )}
          </div>
        </div>
      </section>

      {cooking && (
        <CookingMode
          mealName={meal.strMeal}
          steps={steps}
          ingredients={ingredients}
          servings={servings}
          baseServings={1}
          onClose={() => setCooking(false)}
        />
      )}
    </main>
  )
}

export default MealDetails
