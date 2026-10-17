import { useCallback, useEffect, useState } from 'react'
import { getRandomMeal, getCategories, filterByCategory, listAreas } from '../services/mealdb'
import { usePreferences } from '../components/PreferencesProvider'
import { matchesDietaryPreference } from '../utils/recommendations'
import { getFavorites } from '../utils/favorites'

const PREFERRED_CATEGORIES = ['Beef', 'Chicken', 'Seafood', 'Vegetarian', 'Pasta', 'Dessert', 'Breakfast']

function dedupe(meals) {
  const seen = new Set()
  return meals.filter((meal) => {
    if (!meal) return false
    const id = String(meal.id ?? meal.idMeal)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function useHomeData() {
  const { preferences } = usePreferences()
  const [state, setState] = useState({
    featured: null,
    recommended: [],
    category: null,
    categories: [],
    areas: [],
    saved: [],
    loading: true,
    error: null
  })

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const picks = Promise.all([
      getRandomMeal(),
      getRandomMeal(),
      getRandomMeal(),
      getRandomMeal()
    ]).then(dedupe)

    const categories = getCategories().catch(() => [])
    const areas = listAreas().catch(() => [])

    picks
      .then(async (randomMeals) => {
        const [featured, ...rest] = randomMeals
        const featuredCategory = featured?.category ?? featured?.strCategory
        const category =
          featuredCategory ||
          PREFERRED_CATEGORIES.find((name) =>
            randomMeals.some((meal) => (meal?.category ?? meal?.strCategory) === name)
          ) ||
          null

        let related = []
        if (category) {
          related = await filterByCategory(category).catch(() => [])
        }

        const preference = preferences?.dietaryPreference
        const pool = dedupe([...rest, ...related])
        const matches = pool.filter((meal) => matchesDietaryPreference(meal, preference))
        const recommended = dedupe(rest.concat(matches.length ? matches : pool)).slice(0, 8)

        setState((prev) => ({
          ...prev,
          featured,
          category,
          recommended,
          loading: false,
          error: null
        }))
      })
      .catch((error) => {
        setState((prev) => ({
          ...prev,
          featured: null,
          recommended: [],
          loading: false,
          error
        }))
      })

    Promise.all([categories, areas]).then(([categoryList, areaList]) => {
      setState((prev) => ({
        ...prev,
        categories: (categoryList || []).slice(0, 12),
        areas: [...new Set(areaList || [])].sort((a, b) => a.localeCompare(b)).slice(0, 12)
      }))
    })

    setState((prev) => ({ ...prev, saved: getFavorites().slice(0, 4) }))
  }, [preferences?.dietaryPreference])

  useEffect(load, [load])

  return { ...state, reload: load }
}
