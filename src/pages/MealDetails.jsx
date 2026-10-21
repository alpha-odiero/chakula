import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import CookingMode from '../components/CookingMode'
import ImageViewer from '../components/ImageViewer'
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
import { APP_OG_IMAGE, APP_OG_IMAGE_ALT, SITE_URL } from '../config/app'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6]

function MealDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const toast = useToast()
  const [favorited, setFavorited] = useState(() => isFavorite(id))
  const [servings, setServings] = useState(1)
  const [checked, setChecked] = useState(() => new Set())
  const [cooking, setCooking] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    getMeal(id)
      .then((data) => {
        if (!data) throw new Error('not-found')
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        setState({ data: null, loading: false, error })
      })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setFavorited(isFavorite(id))
    setServings(1)
    setChecked(new Set())
    setCooking(false)
    setViewerOpen(false)
  }, [id])

  const meal = state.data
  const ingredients = useMemo(() => extractIngredients(meal), [meal])
  const steps = useMemo(() => formatInstructionSteps(meal?.instructions ?? meal?.strInstructions), [meal])
  const tags = useMemo(() => getMealTags(meal), [meal])
  const videoId = getVideoId(meal?.youtube ?? meal?.strYoutube)

  const recipeJsonLd = useMemo(() => {
    if (!meal || !steps.length) return null
    const recipeUrl = `${SITE_URL}/meal/${meal.id ?? id}`
    const recipe = {
      '@type': 'Recipe',
      name: meal.name,
      image: meal.image ? [meal.image] : undefined,
      description: `${meal.name} recipe with ingredients and step-by-step cooking instructions from Pikawise.`,
      recipeIngredient: ingredients.map(({ name, measure }) =>
        measure ? `${measure} ${name}` : name
      ),
      recipeInstructions: steps.map((text) => ({ '@type': 'HowToStep', text })),
      url: recipeUrl,
      mainEntityOfPage: recipeUrl,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', name: 'Pikawise', url: SITE_URL },
      author: { '@type': 'Organization', name: 'Pikawise', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'Pikawise',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png` }
      }
    }
    if (meal.category) recipe.recipeCategory = meal.category
    if (meal.area) recipe.recipeCuisine = meal.area
    if (tags.length) recipe.keywords = tags.join(', ')
    if (videoId) recipe.video = { '@type': 'VideoObject', embedUrl: `https://www.youtube.com/embed/${videoId}` }

    return {
      '@context': 'https://schema.org',
      '@graph': [
        recipe,
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Explore', item: `${SITE_URL}/explore` },
            { '@type': 'ListItem', position: 3, name: meal.name, item: recipeUrl }
          ]
        }
      ]
    }
  }, [meal, ingredients, steps, tags, videoId, id])

  useSeo({
    title: state.error
      ? t('meal.seoNotFoundTitle')
      : meal
        ? t('meal.seoTitle', { name: meal.name })
        : t('meal.seoLoadingTitle'),
    description: meal
      ? t('meal.seoDescription', {
          name: meal.name,
          category: meal.category ? ` (${meal.category})` : ''
        })
      : t('meal.seoLoadingDescription'),
    path: `/meal/${id ?? ''}`,
    image: meal?.image || APP_OG_IMAGE,
    imageAlt: meal ? t('meal.seoImageAlt', { name: meal.name }) : APP_OG_IMAGE_ALT,
    type: 'article',
    robots: state.error ? 'noindex,follow' : undefined,
    jsonLd: recipeJsonLd
  })


  const handleShare = async () => {
    const url = window.location.href
    const title = meal?.name ?? meal?.strMeal ?? t('meal.shareFallbackTitle')

    if (supportsWebShare()) {
      try {
        await navigator.share({ title, text: t('meal.shareText', { name: title }), url })
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
      toast.error(t('meal.copyLinkFailed'))
      return
    }
    toast.success(t('meal.copyLinkSuccess'))
  }

  const handleAnother = async () => {
    try {
      const next = await getRandomMeal()
      if (next) navigate(`/meal/${next.id ?? next.idMeal}`)
    } catch {
      /* ignore, user can retry */
    }
  }

  const handleFavorite = () => {
    if (!meal) return
    toggleFavorite(meal)
    const nowSaved = isFavorite(id)
    setFavorited(nowSaved)
    if (nowSaved) toast.success(t('meal.savedRecipe'))
    else toast.info(t('meal.removedFromSaved'))
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
      .filter((item) => !checked.has(item.name))
      .forEach((item) => addPersonalShoppingItem(item.name))
    toast.success(t('meal.addedToShoppingList'))
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
            <h2 className="meal-not-found-sub">{t('meal.notFoundTitle')}</h2>
            <p className="empty-state-message">{t('meal.notFoundMessage')}</p>
            <Link to="/explore" className="button button--primary">{t('meal.browseRecipes')}</Link>
          </div>
        ) : (
          <ErrorState onRetry={load} />
        )}
      </main>
    )
  }

  const readyCount = checked.size
  const meta = [meal.category ?? meal.strCategory, meal.area ?? meal.strArea].filter(Boolean).join(' · ')

  return (
    <main className="meal-detail">
      <div className="meal-detail-bar">
        <div className="container meal-detail-bar-inner">
          <button type="button" className="meal-detail-bar-button" onClick={() => navigate(-1)} aria-label={t('a11y.goBack')}>
            <Icon name="chevronLeft" size={20} />
          </button>
          <p className="meal-detail-bar-title">{meal.name ?? meal.strMeal}</p>
          <div className="meal-detail-bar-actions">
            <button
              type="button"
              className="meal-detail-bar-button"
              onClick={handleFavorite}
              aria-pressed={favorited}
              aria-label={favorited ? t('meal.removeFromSaved') : t('meal.saveRecipe')}
            >
              <Icon name={favorited ? 'heartFilled' : 'heart'} size={19} />
            </button>
            <button
              type="button"
              className="meal-detail-bar-button"
              onClick={handleShare}
              aria-label={t('meal.shareRecipe')}
            >
              <Icon name="share" size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="container meal-detail-layout">
        <article className="meal-detail-hero">
          <button
            type="button"
            className="meal-detail-media"
            onClick={() => setViewerOpen(true)}
            aria-label={t('meal.viewFullImage', { name: meal.name ?? meal.strMeal })}
            aria-haspopup="dialog"
          >
            <img
              className="meal-detail-img"
              src={meal.image ?? meal.strMealThumb}
              alt={meal.name ?? meal.strMeal}
              width="1280"
              height="960"
            />
            <span className="meal-detail-zoom" aria-hidden="true">
              <Icon name="zoom" size={14} />
              {t('meal.zoom')}
            </span>
          </button>

          <div className="meal-detail-intro">
            <p className="page-eyebrow">{meta || t('meal.recipe')}</p>
            <h1 className="meal-detail-title">{meal.name ?? meal.strMeal}</h1>

            {tags.length > 0 && (
              <ul className="meal-tags" aria-label={t('a11y.tags')}>
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
                {t('meal.startCooking')}
              </button>
              <button
                type="button"
                className={`button button--secondary button--large${favorited ? ' is-active' : ''}`}
                onClick={handleFavorite}
                aria-pressed={favorited}
              >
                <Icon name={favorited ? 'heartFilled' : 'heart'} size={18} />
                {favorited ? t('common.saved') : t('common.save')}
              </button>
              <button type="button" className="button button--ghost button--large" onClick={handleAnother}>
                <Icon name="random" size={18} />
                {t('common.surpriseMe')}
              </button>
            </div>
          </div>
        </article>

        <section className="meal-detail-content" aria-label={t('meal.recipe')}>
          <div className="recipe-panel">
          <div className="recipe-panel-head">
            <h2 className="recipe-panel-title">
              <Icon name="utensils" size={20} />
              {t('meal.ingredients')}
            </h2>
            {ingredients.length > 0 && (
              <span className="recipe-panel-count">
                {t('meal.readyCount', { ready: readyCount, total: ingredients.length })}
              </span>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="servings-control">
              <span className="servings-label">
                <Icon name="servings" size={16} />
                {t('meal.servings')}
              </span>
              <div className="servings-options" role="group" aria-label={t('meal.numberOfServings')}>
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
            {ingredients.map(({ name: ingredient, measure }) => {
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
            {t('meal.ingredientNote')}
          </p>

          {ingredients.length > 0 && (
            <button type="button" className="button button--secondary button--block" onClick={handleAddMissing}>
              <Icon name="shoppingBag" size={18} />
              {t('meal.addMissingToShoppingList')}
            </button>
          )}
        </div>

        <div className="recipe-panel">
          <div className="recipe-panel-head">
            <h2 className="recipe-panel-title">
              <Icon name="list" size={20} />
              {t('meal.instructions')}
            </h2>
            {steps.length > 0 && (
              <span className="recipe-panel-count">{t('meal.steps', { count: steps.length })}</span>
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
              {t('meal.noInstructions')}
            </p>
          )}

          <div className="recipe-media">
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() => setCooking(true)}
            >
              <Icon name="play" size={18} />
              {t('meal.startCooking')}
            </button>

            {videoId && (
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--secondary button--block"
              >
                <Icon name="video" size={18} />
                {t('meal.watchTutorial')}
              </a>
            )}
          </div>
        </div>
        </section>
      </div>

      {viewerOpen && (
        <ImageViewer
          src={meal.image ?? meal.strMealThumb}
          alt={meal.name ?? meal.strMeal}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {cooking && (
        <CookingMode
          mealName={meal.name ?? meal.strMeal}
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
