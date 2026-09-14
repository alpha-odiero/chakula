const PREFIX = 'chakula_'
const KEY = `${PREFIX}favorites`

function isStorageAvailable() {
  try {
    const testKey = `${PREFIX}__test__`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function read(fallback) {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(value) {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Storage full or blocked — fail quietly.
  }
}

export function getFavorites() {
  const value = read([])
  return Array.isArray(value) ? value : []
}

export function isFavorite(mealId) {
  return getFavorites().some((m) => (m.idMeal || m.id) === String(mealId))
}

export function addFavorite(meal) {
  const list = getFavorites()
  const id = meal.idMeal || meal.id
  if (list.some((m) => (m.idMeal || m.id) === id)) return list
  const next = [
    {
      idMeal: id,
      strMeal: meal.strMeal || meal.name,
      strMealThumb: meal.strMealThumb || meal.image || meal.thumb,
      strCategory: meal.strCategory || meal.category || null
    },
    ...list
  ]
  write(next)
  return next
}

export function removeFavorite(mealId) {
  const next = getFavorites().filter((m) => (m.idMeal || m.id) !== String(mealId))
  write(next)
  return next
}

export function toggleFavorite(meal) {
  const id = meal.idMeal || meal.id
  if (isFavorite(id)) return removeFavorite(id)
  return addFavorite(meal)
}

export function clearFavorites() {
  write([])
  return []
}
