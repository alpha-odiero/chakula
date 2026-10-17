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
  const target = String(mealId)
  return getFavorites().some((m) => String(m.id ?? m.idMeal) === target)
}

export function addFavorite(meal) {
  const list = getFavorites()
  if (!meal) return list
  const id = String(meal.id ?? meal.idMeal)
  if (!id) return list
  if (list.some((m) => String(m.id ?? m.idMeal) === id)) return list
  const next = [
    {
      id,
      name: meal.name ?? meal.strMeal ?? 'Untitled',
      image: meal.image ?? meal.strMealThumb ?? meal.thumb ?? null,
      category: meal.category ?? meal.strCategory ?? null,
      area: meal.area ?? meal.strArea ?? null
    },
    ...list
  ]
  write(next)
  return next
}

export function removeFavorite(mealId) {
  const target = String(mealId)
  const next = getFavorites().filter((m) => String(m.id ?? m.idMeal) !== target)
  write(next)
  return next
}

export function toggleFavorite(meal) {
  const id = meal?.id ?? meal?.idMeal
  if (isFavorite(id)) return removeFavorite(id)
  return addFavorite(meal)
}

export function clearFavorites() {
  write([])
  return []
}
