import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import MealGrid from '../components/MealGrid'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import { usePreferences } from '../components/PreferencesProvider'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { isStandalone } from '../utils/platform'
import { getRandomMeal, getCategories, filterByCategory } from '../services/mealdb'

const QUICK_ACTIONS = [
  { to: '/balanced-diet', label: 'Balanced Diet', hint: 'Build a meal plan', icon: 'sparkles' },
  { to: '/balanced-diet?focus=ingredients', label: 'Use My Ingredients', hint: 'Cook what you have', icon: 'shoppingBag' },
  { to: '/meal-plans', label: 'Meal Plans', hint: 'Saved plans', icon: 'calendar' },
  { to: '/shopping-list', label: 'Shopping List', hint: 'What to buy', icon: 'list' },
  { to: '/random', label: 'Random Meal', hint: "Can't decide", icon: 'random' }
]

function timeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return 'Good evening'
}

function greetingHint(preferences) {
  if (preferences?.dietaryPreference && preferences.dietaryPreference !== 'any') {
    return `Ideas that fit your ${preferences.dietaryPreference.replace('-', ' ')} preference.`
  }
  return "Let's cook something delicious."
}

function Home() {
  const { preferences } = usePreferences()
  const { isInstalled } = useInstallPrompt()
  const inAppMode = isInstalled || isStandalone()
  const [randomMeals, setRandomMeals] = useState({ data: null, loading: true, error: null })
  const [categories, setCategories] = useState({ data: null, loading: true, error: null })
  const [featured, setFeatured] = useState({ data: null, loading: true, error: null })

  const loadAll = () => {
    setRandomMeals({ data: null, loading: true, error: null })
    setCategories({ data: null, loading: true, error: null })
    setFeatured({ data: null, loading: true, error: null })

    const randoms = Promise.all([getRandomMeal(), getRandomMeal(), getRandomMeal()])

    randoms
      .then((meals) => setRandomMeals({ data: meals, loading: false, error: null }))
      .catch((error) => setRandomMeals({ data: null, loading: false, error }))

    getCategories()
      .then((list) => setCategories({ data: list.slice(0, 8), loading: false, error: null }))
      .catch((error) => setCategories({ data: null, loading: false, error }))

    randoms
      .then((meals) => {
        const source = meals.find((m) => m && m.strCategory)
        if (!source) return []
        return filterByCategory(source.strCategory)
      })
      .then((meals) =>
        setFeatured({ data: (meals || []).slice(0, 8).filter((m) => m), loading: false, error: null })
      )
      .catch((error) => setFeatured({ data: null, loading: false, error }))
  }

  useEffect(loadAll, [])

  return (
    <main className={`home${inAppMode ? ' home--app' : ''}`}>
      <section className={`hero${inAppMode ? ' hero--app' : ''}`}>
        <div className="container hero-inner">
          {inAppMode ? (
            <>
              <p className="hero-eyebrow">
                <Icon name="cookingPot" size={16} />
                {timeGreeting()}
              </p>
              <h1 className="hero-title hero-title--app">{greetingHint(preferences)}</h1>
              <p className="hero-subtitle">
                Search meals, plan your week, and shop smarter — all in one place.
              </p>
              <div className="hero-search">
                <SearchBar placeholder="Search chicken, rice, pasta…" size="large" />
              </div>
            </>
          ) : (
            <>
              <p className="hero-eyebrow">
                <Icon name="cookingPot" size={16} />
                {timeGreeting()} — Let's cook something delicious
              </p>
              <h1 className="hero-title">
                Discover Your Next <span className="hero-accent">Meal</span>
              </h1>
              <p className="hero-subtitle">{greetingHint(preferences)}</p>
              <div className="hero-search">
                <SearchBar placeholder="Search chicken, rice, ugali, sukuma wiki..." size="large" />
              </div>
              <div className="hero-actions">
                <Link to="/explore" className="button button--primary button--large">
                  Explore Meals
                  <Icon name="arrowRight" size={18} />
                </Link>
                <Link to="/random" className="button button--secondary button--large">
                  <Icon name="random" size={18} />
                  Surprise me
                </Link>
              </div>
              <div className="hero-features" role="list" aria-label="Why Pikawise">
                <p className="hero-feature" role="listitem">
                  Inspired by Kenyan & African flavours
                </p>
                <p className="hero-feature" role="listitem">
                  Plan from the food you have
                </p>
                <p className="hero-feature" role="listitem">
                  Plans and lists kept offline
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section quick-actions-section" aria-label="Quick actions">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Quick actions</p>
              <h2 className="section-title">What do you want to do?</h2>
            </div>
          </div>
          <div className="quick-actions">
            <Link to="/balanced-diet?focus=ingredients" className="use-food-card">
              <span className="use-food-icon" aria-hidden="true">
                <Icon name="shoppingBag" size={24} />
              </span>
              <span className="use-food-body">
                <strong>What food do you have?</strong>
                <span>Turn what's already in your kitchen into a balanced meal plan.</span>
              </span>
              <Icon name="arrowRight" size={20} className="use-food-arrow" />
            </Link>

            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.to} to={action.to} className="quick-action-card">
                  <Icon name={action.icon} size={22} />
                  <strong>{action.label}</strong>
                  <span>{action.hint}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section meal-section" aria-labelledby="random-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Random picks</p>
              <h2 id="random-heading" className="section-title">Feeling inspired?</h2>
            </div>
            <Link to="/random" className="section-link">
              Get a random meal
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {randomMeals.loading && (
            <div className="meal-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          )}
          {randomMeals.error && <ErrorState onRetry={loadAll} />}
          {!randomMeals.loading && !randomMeals.error && randomMeals.data?.length ? (
            <MealGrid meals={randomMeals.data} />
          ) : null}
        </div>
      </section>

      <section className="section category-section" aria-labelledby="categories-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Popular categories</p>
              <h2 id="categories-heading" className="section-title">Browse by category</h2>
            </div>
            <Link to="/categories" className="section-link">
              All categories
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {categories.loading && (
            <div className="category-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingSkeleton key={i} variant="category" />
              ))}
            </div>
          )}
          {categories.error && <ErrorState onRetry={loadAll} />}
          {!categories.loading && !categories.error && categories.data?.length ? (
            <div className="category-grid">
              {categories.data.map((category) => (
                <Link
                  key={category.strCategory}
                  to={`/categories/${category.strCategory.toLowerCase().replace(/[^a-z0-9]+/g, '')}`}
                  className="chip-card"
                >
                  <img
                    src={category.strCategoryThumb}
                    alt={category.strCategory}
                    loading="lazy"
                    width="80"
                    height="80"
                  />
                  <span>{category.strCategory}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section featured-section" aria-labelledby="featured-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Featured</p>
              <h2 id="featured-heading" className="section-title">From the kitchen</h2>
            </div>
          </div>

          {featured.loading && (
            <div className="meal-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          )}
          {featured.error && <ErrorState onRetry={loadAll} />}
          {!featured.loading && !featured.error && featured.data?.length ? (
            <MealGrid meals={featured.data} />
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default Home