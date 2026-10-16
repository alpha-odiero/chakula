import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { usePreferences } from '../components/PreferencesProvider'
import { useToast } from '../components/Toast'
import { useNetworkState } from '../hooks/useNetworkState'
import { generateMealPlan, COMMON_INGREDIENTS, normalizeIngredient, inferMealType, evaluateBalance, calculateIngredientMatch } from '../utils/recommendations'
import { addMealPlan } from '../utils/storage'
import { supportsWebShare, supportsClipboard } from '../utils/platform'
import { getRandomMeal } from '../services/mealdb'
import { extractIngredients } from '../utils/meal'

const DAY_OPTIONS = [1, 3, 5, 7]
const DIET_OPTIONS = [
  { value: 'any', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'high-protein', label: 'High-protein' },
  { value: 'lower-meat', label: 'Lower-meat' }
]
const TIME_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'quick', label: 'Under 30 minutes' },
  { value: 'moderate', label: 'Under 60 minutes' },
  { value: 'longer', label: 'Time is not a problem' }
]
const SLOT_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function BalancedDiet() {
  const location = useLocation()
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const { preferences } = usePreferences()
  const isOnline = useNetworkState()

  const [ingredients, setIngredients] = useState(() => {
    const fromUrl = query.get('ingredients')
    if (fromUrl) return fromUrl.split(',').map((s) => s.trim()).filter(Boolean)
    return []
  })
  const [input, setInput] = useState('')
  const [config, setConfig] = useState({
    days: 3,
    mealsPerDay: preferences?.mealsPerDay || 3,
    dietaryPreference: preferences?.dietaryPreference || 'any',
    cookingTime: preferences?.cookingTime === 'any' ? 'any' : preferences?.cookingTime || 'any'
  })
  const [plan, setPlan] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const toast = useToast()
  const poolRef = useRef([])
  const resultRef = useRef(null)

  useEffect(() => {
    if (query.get('focus') === 'ingredients' && resultRef.current === null) {
      const el = document.getElementById('what-do-you-have')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [plan])

  const showMessage = (text, variant = 'success') => toast.notify(text, { variant })

  const addIngredient = (value, quiet = false) => {
    const cleaned = normalizeIngredient(value)
    if (!cleaned) return
    setIngredients((prev) => {
      if (prev.some((ing) => normalizeIngredient(ing) === cleaned)) return prev
      return [...prev, value.trim()]
    })
    if (!quiet) setInput('')
  }

  const removeIngredient = (value) => {
    setIngredients((prev) => prev.filter((ing) => ing !== value))
  }

  const clearIngredients = () => setIngredients([])

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }))

  const handleGenerate = async () => {
    if (ingredients.length === 0) return
    setGenerating(true)
    setGenerationError(null)
    try {
      const generated = await generateMealPlan({
        ...config,
        ingredients
      })
      setPlan(generated)
      poolRef.current = generated._pool || []
    } catch (error) {
      setGenerationError(error)
      setPlan(null)
    } finally {
      setGenerating(false)
    }
  }

  const replaceMeal = async (dayIndex, slotIndex) => {
    if (!plan) return
    const usedIds = new Set(plan.meals.flatMap((d) => d.meals.map((m) => m.meal.idMeal)))
    const current = plan.meals[dayIndex].meals[slotIndex]
    const slotType = current.slot

    let replacement = poolRef.current
      .filter((entry) => !usedIds.has(entry.meal.idMeal))
      .map((entry) => entry.meal)
    replacement = findReplacement(replacement, slotType, dayIndex, plan, usedIds)

    if (!replacement) {
      const fallbackMeal = await getRandomMeal().catch(() => null)
      if (fallbackMeal) {
        const ingredients = extractIngredients(fallbackMeal).map((i) => i.ingredient)
        replacement = { ...fallbackMeal, ingredients }
      }
    }
    if (!replacement) return

    const rawIngredientList = (replacement.ingredients || []).map(String)
    const match = rawIngredientList.length
      ? calculateIngredientMatch(rawIngredientList, plan.ingredients)
      : { matched: [], missing: [], ratio: 0 }

    const nextMeals = plan.meals.map((day, di) => {
      if (di !== dayIndex) return day
      return {
        ...day,
        meals: day.meals.map((slot, si) => {
          if (si !== slotIndex) return slot
          return {
            ...slot,
            meal: replacement,
            matchedIngredients: match.matched,
            matchRatio: match.ratio,
            balance: evaluateBalance(rawIngredientList)
          }
        })
      }
    })

    const nextPlan = { ...plan, meals: nextMeals, shopping: computeShopping(nextMeals, plan.ingredients) }
    setPlan(nextPlan)
    showMessage('Meal swapped.')
  }

  const savePlan = () => {
    if (!plan) return
    const saved = { ...plan, label: `${plan.days}-Day Meal Plan` }
    delete saved._pool
    addMealPlan(saved)
    showMessage('Meal plan saved.')
  }

  const sharePlan = async () => {
    if (!plan) return
    const text = formatPlanText(plan)
    if (supportsWebShare()) {
      try {
        await navigator.share({ title: `${plan.days}-Day Meal Plan`, text })
        return
      } catch {
        /* fall back to copy */
      }
    }
    const copied = await copyText(text)
    showMessage(
      copied ? 'Meal plan copied!' : 'Could not copy the meal plan.',
      copied ? 'success' : 'error'
    )
  }

  const generationLoading = generating

  return (
    <main className="balanced-diet-page">
      <PageHeader eyebrow="Balanced Diet" title="Eat Better, One Meal at a Time">
        <p className="page-subtitle">
          Build a simple, balanced meal plan using the foods you already have.
        </p>
        <div className="balanced-hero">
          <div className="balanced-hero-actions">
            <a href="#build-plan" className="button button--primary button--large">
              <Icon name="sparkles" size={18} />
              Build My Meal Plan
            </a>
            <a href="#about-balanced" className="button button--secondary button--large">
              Learn About Balanced Meals
            </a>
          </div>
          <div className="balanced-info-box" id="about-balanced">
            A balanced meal generally combines different food groups such as vegetables and fruits,
            protein-rich foods, carbohydrates/starched, and healthy fats.
          </div>
        </div>
      </PageHeader>

      <section className="container builder-section" id="build-plan">
        {!isOnline && (
          <div className="empty-state empty-state--soft">
            <p className="empty-state-message">
              You're offline. Saved plans are still available.
            </p>
          </div>
        )}

        <div className="builder-layout">
          <div className="builder-ingredients-panel" id="what-do-you-have">
            <h2 className="builder-section-title">
              <Icon name="shoppingBag" size={20} /> What food do you have?
            </h2>
            <p className="panel-subtitle">
              Add the ingredients available at home and Pikawise will look for meals you can make.
            </p>

            <div className="ingredient-input-row">
              <label className="visually-hidden" htmlFor="ingredient-input">Add ingredient</label>
              <input
                id="ingredient-input"
                className="ingredient-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIngredient(input)
                  }
                }}
                placeholder="Type an ingredient, e.g. chicken"
                autoComplete="off"
              />
              <button
                type="button"
                className="button button--primary"
                onClick={() => addIngredient(input)}
                disabled={!normalizeIngredient(input)}
              >
                <Icon name="plus" size={18} /> Add
              </button>
            </div>

            {ingredients.length > 0 ? (
              <div className="chips" aria-label="Your ingredients">
                {ingredients.map((ing, index) => (
                  <span key={`${ing}-${index}`} className="chip chip--removable">
                    {ing.charAt(0).toUpperCase() + ing.slice(1)}
                    <button
                      type="button"
                      className="chip-remove"
                      aria-label={`Remove ${ing}`}
                      onClick={() => removeIngredient(ing)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No ingredients yet"
                message="Type an ingredient above or pick a suggestion below to get started."
              />
            )}

            <div className="suggestions">
              <div className="suggestions-row">
                <p className="suggestions-title">Quick picks</p>
                {ingredients.length > 0 && (
                  <button type="button" className="link-button" onClick={clearIngredients}>
                    Clear all
                  </button>
                )}
              </div>
              <div className="chips">
                {COMMON_INGREDIENTS.filter(
                  (item) => !ingredients.some((ing) => normalizeIngredient(ing) === normalizeIngredient(item))
                )
                  .slice(0, 16)
                  .map((item) => (
                    <button
                      type="button"
                      key={item}
                      className="chip chip-suggestion"
                      onClick={() => addIngredient(item, true)}
                    >
                      <Icon name="plus" size={12} />
                      {item}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="builder-config">
            <h2 className="builder-section-title">Meal plan preferences</h2>

            <div className="config-group">
              <p className="config-label">Number of days</p>
              <div className="config-chips" role="group" aria-label="Number of days">
                {DAY_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`config-chip${config.days === opt ? ' config-chip--active' : ''}`}
                    aria-pressed={config.days === opt}
                    onClick={() => updateConfig('days', opt)}
                  >
                    {opt} day{opt > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <p className="config-label">Meals per day</p>
              <div className="config-chips" role="group" aria-label="Meals per day">
                {[2, 3, 4].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`config-chip${config.mealsPerDay === opt ? ' config-chip--active' : ''}`}
                    aria-pressed={config.mealsPerDay === opt}
                    onClick={() => updateConfig('mealsPerDay', opt)}
                  >
                    {opt} meals
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <p className="config-label">Dietary preference</p>
              <div className="config-chips" role="group" aria-label="Dietary preference">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`config-chip${config.dietaryPreference === opt.value ? ' config-chip--active' : ''}`}
                    aria-pressed={config.dietaryPreference === opt.value}
                    onClick={() => updateConfig('dietaryPreference', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <p className="config-label">Cooking time</p>
              <div className="config-chips" role="group" aria-label="Cooking time">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`config-chip${config.cookingTime === opt.value ? ' config-chip--active' : ''}`}
                    aria-pressed={config.cookingTime === opt.value}
                    onClick={() => updateConfig('cookingTime', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="balanced-generate">
              <button
                type="button"
                className="button button--primary button--large"
                onClick={handleGenerate}
                disabled={ingredients.length === 0 || generating}
              >
                {generating ? (
                  <>
                    <span className="spinner spinner--inline" aria-hidden="true" />
                    Creating your meal plan…
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" size={18} />
                    Generate My Meal Plan
                  </>
                )}
              </button>
              {ingredients.length === 0 && (
                <p className="settings-hint">Add a few ingredients to get started.</p>
              )}
            </div>
          </div>
        </div>

        {generationLoading && (
          <div className="plan-loading" role="status" aria-live="polite">
            <span className="spinner spinner--large" aria-hidden="true" />
            <p>Matching your ingredients…</p>
            <p className="settings-hint">Searching recipes and organizing meals.</p>
          </div>
        )}

        {generationError && !generating && (
          <ErrorState
            message="We couldn't create your plan right now."
            onRetry={handleGenerate}
          />
        )}

        {plan && !generating && (
          <div className="plan-results" ref={resultRef}>
            <PlanResults plan={plan} onReplace={replaceMeal} onSave={savePlan} onShare={sharePlan} onReset={() => setPlan(null)} />
            <div className="balanced-info-box plan-note">
              <strong>Note:</strong> Pikawise provides general meal-planning ideas and is not medical or
              professional dietary advice. Individual nutritional needs vary.
            </div>
          </div>
        )}
      </section>
    </main>
  )

  function computeShopping(dayMeals, availableIngredients) {
    const requiredSet = new Set()
    dayMeals.forEach((day) => {
      day.meals.forEach((slot) => {
        (slot.meal.ingredients || []).map(String).forEach((ing) => requiredSet.add(ing))
      })
    })
    const required = [...requiredSet]
    const have = required.filter((ing) =>
      availableIngredients.some((a) => {
        const normIng = normalizeIngredient(ing)
        const normA = normalizeIngredient(a)
        return normA === normIng || (normA.length >= 4 && normIng.includes(normA)) || (normIng.length >= 4 && normA.includes(normIng))
      })
    )
    const need = required.filter((ing) => !have.includes(ing))
    return { required, have, need }
  }

  function findReplacement(pool, slotType, dayIndex, currentPlan, usedIds) {
    const dayUsedCategories = new Set(
      currentPlan.meals[dayIndex].meals.map((m) => m.meal.strCategory).filter(Boolean)
    )
    const typeTarget = slotType.toLowerCase() === 'breakfast' ? 'breakfast' : slotType.toLowerCase() === 'snack' ? 'snack' : 'main'
    const typed = pool.filter((m) => !usedIds.has(m.idMeal))
    const matchingType = typed.filter((m) => inferMealType(m) === typeTarget)
    const categoryDiverse = matchingType.find((m) => !dayUsedCategories.has(m.strCategory))
    return categoryDiverse || matchingType[0] || typed.find((m) => !dayUsedCategories.has(m.strCategory)) || typed[0] || null
  }
}

function PlanResults({ plan, onReplace, onSave, onShare, onReset }) {
  return (
    <>
      <div className="plan-summary">
        <div>
          <h2 className="plan-summary-title">Your {plan.days}-Day Meal Plan</h2>
          <p className="plan-summary-meta">
            {plan.ingredients.length} ingredient{plan.ingredients.length === 1 ? '' : 's'} · {plan.mealsPerDay} meals per day
            {plan.fromIngredients ? '' : ' · some meals use nearby alternatives'}
          </p>
        </div>
        <div className="plan-actions">
          <button type="button" className="button button--primary" onClick={onSave}>
            <Icon name="check" size={18} /> Save Plan
          </button>
          <button type="button" className="button button--secondary" onClick={onShare}>
            <Icon name="share" size={18} /> Share Plan
          </button>
          <button type="button" className="button button--ghost" onClick={onReset}>
            Start over
          </button>
        </div>
      </div>

      {plan.meals.map((day) => (
<section key={day.day} className="plan-day" aria-label={`Day ${day.day}`}>
            <h3 className="plan-day-header">
              <span>Day {day.day}</span>
              <span className="plan-day-count">{day.meals.length} meals</span>
            </h3>
          <div className="plan-meals">
            {day.meals.map((slot, slotIndex) => (
              <PlanMeal
                key={slot.meal.idMeal + slot.slot}
                slot={slot}
                onReplace={() => onReplace(day.day - 1, slotIndex)}
              />
            ))}
          </div>
        </section>
      ))}

      <ShoppingList plan={plan} />
    </>
  )
}

function PlanMeal({ slot, onReplace }) {
  const canonicalSlot = SLOT_LABELS.find((s) => s.toLowerCase() === (slot.slot || slot.type).toLowerCase()) || slot.slot || slot.type
  const matched = (slot.matchedIngredients || []).slice(0, 3)
  const balanceNote = slot.balance?.note || ''
  const balanceGood = balanceNote === 'Balanced meal'

  return (
    <article className="plan-meal-slot">
      <img
        className="plan-meal-img"
        src={slot.meal.strMealThumb}
        alt=""
        loading="lazy"
        decoding="async"
        width="200"
        height="160"
      />
      <div className="plan-meal-body">
        <p className="plan-meal-type">
          <Icon name="clock" size={14} />
          {canonicalSlot}
        </p>
        <Link to={`/meal/${slot.meal.idMeal}`} className="plan-meal-name" aria-label={`View ${slot.meal.strMeal} recipe`}>
          {slot.meal.strMeal}
        </Link>
        {matched.length > 0 && (
          <p className="plan-meal-match">
            {slot.matchRatio > 0 ? `Strong ingredient match` : ''}
            {matched.length > 0 && <span> · {matched.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}</span>}
          </p>
        )}
        <p className={`plan-meal-balance ${balanceGood ? 'plan-meal-balance--good' : 'plan-meal-balance--warn'}`}>
          <Icon name={balanceGood ? 'check' : 'info'} size={14} />
          {balanceNote}
        </p>
        <div className="plan-meal-actions">
          <Link to={`/meal/${slot.meal.idMeal}`} className="button button--ghost button--small">
            View Recipe
          </Link>
          <button type="button" className="button button--ghost button--small" onClick={onReplace}>
            <Icon name="refresh" size={14} /> Replace
          </button>
        </div>
      </div>
    </article>
  )
}

function ShoppingList({ plan }) {
  const shopping = plan.shopping || { required: [], have: [], need: [] }
  return (
    <div className="shopping-panel" id="shopping-list">
      <div className="shopping-panel-header">
        <h3 className="shopping-panel-title">
          <Icon name="shoppingBag" size={20} /> Shopping List
        </h3>
        <Link to="/shopping-list" className="shopping-panel-link">
          Open shopping list <Icon name="arrowRight" size={16} />
        </Link>
      </div>
      <div className="shopping-groups">
        {shopping.have.length > 0 && (
          <div>
            <p className="shopping-group-title">You already have</p>
            <ul>
              {shopping.have.map((item) => (
                <li key={item} className="shopping-item">
                  <span className="shopping-check">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {shopping.need.length > 0 && (
          <div>
            <p className="shopping-group-title">You may need</p>
            <ul>
              {shopping.need.map((item) => (
                <li key={item} className="shopping-item">
                  <span className="shopping-check shopping-check--need">
                    <Icon name="plus" size={12} />
                  </span>
                  <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

async function copyText(text) {
  if (supportsClipboard()) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* fall back below */
    }
  }
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  } catch {
    return false
  }
}

export function formatPlanText(plan) {
  const lines = [`Your ${plan.days}-Day Meal Plan`]
  plan.meals.forEach((day) => {
    lines.push(`\nDay ${day.day}`)
    day.meals.forEach((slot) => {
      lines.push(`${slot.slot}: ${slot.meal.strMeal}`)
    })
  })
  return lines.join('\n')
}

export default BalancedDiet