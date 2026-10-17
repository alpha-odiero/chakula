import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import MealGrid from '../components/MealGrid'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import { getCategories, listAreas, listIngredients, filterByCategory, filterByArea, filterByIngredient, getRandomMeal } from '../services/mealdb'
import {
  getPersonalShopping,
  addPersonalShoppingItem,
  togglePersonalShoppingItem,
  removePersonalShoppingItem,
  clearPersonalShoppingCollected
} from '../utils/storage'

const POPULAR_CATEGORIES = ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pasta', 'Dessert']

const FILTER_LABELS = { category: 'Category', area: 'Cuisine', ingredient: 'Ingredient' }

function Explore() {
  const [categories, setCategories] = useState({ data: null, loading: true, error: null })
  const [areas, setAreas] = useState({ data: [], loading: true, error: null })
  const [ingredients, setIngredients] = useState({ data: [], loading: true, error: null })
  const [meals, setMeals] = useState({ data: null, loading: true, error: null })
  const [searchParams, setSearchParams] = useSearchParams()
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersRef = useRef(null)
  const [shopping, setShopping] = useState(getPersonalShopping)
  const [shoppingInput, setShoppingInput] = useState('')

  const activeFilter = useMemo(() => {
    const category = searchParams.get('category')
    const area = searchParams.get('area')
    const ingredient = searchParams.get('ingredient')
    if (category) return { type: 'category', value: category }
    if (area) return { type: 'area', value: area }
    if (ingredient) return { type: 'ingredient', value: ingredient }
    return { type: null, value: null }
  }, [searchParams])

  const loadMeals = useCallback((filter = activeFilter) => {
    setMeals((prev) => ({ ...prev, loading: true, error: null }))
    const request = filter.type === 'category'
      ? filterByCategory(filter.value)
      : filter.type === 'area'
        ? filterByArea(filter.value)
        : filter.type === 'ingredient'
          ? filterByIngredient(filter.value)
          : Promise.all([getRandomMeal(), getRandomMeal(), getRandomMeal(), getRandomMeal()])
              .then((mealsArr) => mealsArr.filter(Boolean))
    request
      .then((data) => setMeals({ data, loading: false, error: null }))
      .catch((error) => setMeals({ data: null, loading: false, error }))
  }, [activeFilter])

  const dedupe = (items) => [...new Set(items)]

  useEffect(() => {
    getCategories()
      .then((data) => setCategories({ data, loading: false, error: null }))
      .catch((error) => setCategories({ data: null, loading: false, error }))

    listAreas()
      .then((data) => setAreas({ data: dedupe(data).sort(), loading: false, error: null }))
      .catch((error) => setAreas({ data: [], loading: false, error }))

    listIngredients()
      .then((data) => setIngredients({ data: dedupe(data), loading: false, error: null }))
      .catch((error) => setIngredients({ data: [], loading: false, error }))
  }, [])

  useEffect(() => {
    loadMeals()
  }, [loadMeals])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setFiltersOpen(false)
      }
    }
    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filtersOpen])

  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return ingredients.data
    return ingredients.data.filter((name) =>
      name.toLowerCase().includes(ingredientSearch.toLowerCase())
    )
  }, [ingredients.data, ingredientSearch])

  const selectFilter = (type, value) => {
    if (activeFilter.type === type && activeFilter.value === value) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ [type]: value }, { replace: true })
  }

  const clearAll = () => {
    setSearchParams({}, { replace: true })
    setIngredientSearch('')
  }

  const handleAddShoppingItem = () => {
    const next = addPersonalShoppingItem(shoppingInput)
    setShopping(next)
    setShoppingInput('')
  }

  const handleToggleShoppingItem = (id) => {
    setShopping(togglePersonalShoppingItem(id))
  }

  const handleRemoveShoppingItem = (id) => {
    setShopping(removePersonalShoppingItem(id))
  }

  const handleClearCollected = () => {
    setShopping(clearPersonalShoppingCollected())
  }

  const collectedCount = shopping.filter((item) => item.checked).length

  const filterLabel = activeFilter.value || 'all meals'

  return (
    <main className="explore">
      <PageHeader eyebrow="Explore" title="Discover meals">
        <p className="page-subtitle">
          Search by name or browse by category, cuisine, and ingredient to find something delicious.
        </p>
        <div className="explore-search">
          <SearchBar placeholder="Search by name or ingredient…" />
        </div>
      </PageHeader>

      <section className="container explore-browse" aria-label="Popular categories">
        <p className="browse-label">Popular categories</p>
        <div className="browse-chips">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link key={cat} to={`/explore?category=${encodeURIComponent(cat)}`} className="chip chip--browse">
              {cat}
            </Link>
          ))}
        </div>
      </section>

      <section className="container explore-body">
        <button
          type="button"
          className={`button button--filters ${filtersOpen ? 'button--filters--open' : ''}`}
          aria-expanded={filtersOpen}
          aria-controls="explore-filters"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Icon name="settings" size={18} />
          Filters
          {activeFilter.value && <span className="filter-badge">{filterLabel}</span>}
        </button>

        <div className="explore-layout" ref={filtersRef}>
          <aside
            id="explore-filters"
            className={`explore-filters ${filtersOpen ? 'explore-filters--open' : ''}`}
            aria-label="Meal filters"
          >
            <div className="filters-header">
              <h2>Filters</h2>
              {activeFilter.value && (
                <button type="button" className="link-button" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            <fieldset className="filter-group" disabled={categories.loading}>
              <legend>Category</legend>
              {categories.error && <p className="filter-note">Couldn't load categories.</p>}
              {categories.loading && <p className="filter-note">Loading…</p>}
              <div className="filter-options">
                {categories.data?.map((c) => (
                  <label key={c.name ?? c.strCategory} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={activeFilter.type === 'category' && activeFilter.value === (c.name ?? c.strCategory)}
                      onChange={() => selectFilter('category', c.name ?? c.strCategory)}
                    />
                    <span>{c.name ?? c.strCategory}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="filter-group" disabled={areas.loading}>
              <legend>Cuisine / Area</legend>
              {areas.error && <p className="filter-note">Couldn't load cuisines.</p>}
              <div className="filter-options">
                {areas.data.map((area) => (
                  <label key={area} className="filter-option">
                    <input
                      type="radio"
                      name="area"
                      checked={activeFilter.type === 'area' && activeFilter.value === area}
                      onChange={() => selectFilter('area', area)}
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="filter-group" disabled={ingredients.loading}>
              <legend>Ingredient</legend>
              {ingredients.error && <p className="filter-note">Couldn't load ingredients.</p>}
              <input
                type="search"
                className="filter-ingredient-search"
                placeholder="Search ingredients…"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                aria-label="Search ingredients"
              />
              <div className="filter-options filter-options--ingredients">
                {filteredIngredients.slice(0, 60).map((ing) => (
                  <label key={ing} className="filter-option">
                    <input
                      type="radio"
                      name="ingredient"
                      checked={activeFilter.type === 'ingredient' && activeFilter.value === ing}
                      onChange={() => selectFilter('ingredient', ing)}
                    />
                    <span>{ing}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </aside>

          <div className="explore-results">
            <div className="results-head" role="status" aria-live="polite">
              <h2>{activeFilter.value ? `${activeFilter.value} meals` : 'Meals'}</h2>
              <div className="results-head-meta">
                {activeFilter.value && (
                  <button
                    type="button"
                    className="chip chip--active chip--removable"
                    onClick={clearAll}
                    aria-label={`Remove ${activeFilter.value} filter`}
                  >
                    <span>{`${FILTER_LABELS[activeFilter.type] || activeFilter.type}: ${activeFilter.value}`}</span>
                    <span className="chip-remove">
                      <Icon name="close" size={13} />
                    </span>
                  </button>
                )}
                {!meals.loading && meals.data && (
                  <span className="results-count">
                    {meals.data.length} {meals.data.length === 1 ? 'meal' : 'meals'}
                  </span>
                )}
              </div>
            </div>

            <div className="results-body">
              {meals.loading ? (
                <MealGrid loading />
              ) : meals.error ? (
                <ErrorState onRetry={() => loadMeals(activeFilter)} />
              ) : meals.data && meals.data.length > 0 ? (
                <MealGrid
                  meals={meals.data}
                  fallbackCategory={activeFilter.type === 'category' ? activeFilter.value : null}
                  fallbackArea={activeFilter.type === 'area' ? activeFilter.value : null}
                />
              ) : (
                <EmptyState
                  title="No meals found"
                  message={`No meals matched ${filterLabel}. Try another category, cuisine, or ingredient.`}
                  action={
                    <button type="button" className="button button--secondary" onClick={clearAll}>
                      Clear filters
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container explore-shopping" aria-label="Shopping list">
        <div className="explore-shopping-panel">
          <div className="shopping-panel-header">
            <h2 className="shopping-panel-title">
              <Icon name="shoppingBag" size={20} /> Shopping List
            </h2>
            {shopping.length > 0 && (
              <span className="shopping-count">
                {shopping.length} item{shopping.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="panel-subtitle">
            Keep a quick list of what you need to buy next time you shop.
          </p>

          <div className="ingredient-input-row">
            <label className="visually-hidden" htmlFor="shopping-item-input">Add item to shopping list</label>
            <input
              id="shopping-item-input"
              className="ingredient-input"
              type="text"
              value={shoppingInput}
              onChange={(e) => setShoppingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddShoppingItem()
                }
              }}
              placeholder="Add an item, e.g. tomatoes"
              autoComplete="off"
            />
            <button
              type="button"
              className="button button--primary"
              onClick={handleAddShoppingItem}
              disabled={!shoppingInput.trim()}
            >
              <Icon name="plus" size={18} /> Add
            </button>
          </div>

          {shopping.length > 0 ? (
            <>
              <ul className="explore-shopping-items">
                {shopping.map((item) => (
                  <li key={item.id} className={`shopping-item${item.checked ? ' shopping-item--checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleShoppingItem(item.id)}
                      aria-label={`Mark ${item.name} as collected`}
                    />
                    <span>{item.name}</span>
                    <button
                      type="button"
                      className="shopping-item-remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => handleRemoveShoppingItem(item.id)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {collectedCount > 0 && (
                <button type="button" className="link-button" onClick={handleClearCollected}>
                  Clear {collectedCount} collected
                </button>
              )}
            </>
          ) : (
            <p className="shopping-empty">No items yet. Add something you need to buy.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export default Explore