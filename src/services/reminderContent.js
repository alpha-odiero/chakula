import { getRandomMeal } from './mealdb'

function normalizeList(values) {
  if (!Array.isArray(values)) return []
  return values.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
}

function cuisineScore(meal, cuisines) {
  if (!cuisines.length) return 0
  const haystack = [meal.area, meal.category, ...(meal.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return cuisines.reduce((score, cuisine) => (haystack.includes(cuisine) ? score + 1 : score), 0)
}

// Pick a few meal ideas that respect the user's exclusions and lean toward their
// preferred cuisines. Best-effort: if the network fails we simply return none.
export async function fetchReminderSuggestions(config, preferences, count) {
  const wanted = Math.max(1, Math.min(5, count || config?.suggestionCount || 3))
  const exclude = normalizeList([
    ...(preferences?.allergies || []),
    ...(preferences?.excludedIngredients || [])
  ])
  const cuisines = normalizeList(preferences?.preferredCuisines || [])

  let meals = []
  try {
    meals = await Promise.all(
      Array.from({ length: wanted * 2 }, () => getRandomMeal().catch(() => null))
    )
  } catch {
    meals = []
  }

  const seen = new Set()
  const filtered = []
  for (const meal of meals) {
    if (!meal || !meal.id || seen.has(meal.id)) continue
    seen.add(meal.id)
    const names = (meal.ingredients || []).map((item) => String(item?.name || '').toLowerCase())
    if (exclude.some((term) => names.some((name) => name && name.includes(term)))) continue
    filtered.push(meal)
  }

  if (cuisines.length) {
    filtered.sort((a, b) => cuisineScore(b, cuisines) - cuisineScore(a, cuisines))
  }

  return filtered.slice(0, wanted)
}

// Build the notification title/body for a period according to the chosen mode.
export async function buildReminderPayload(period, config, preferences) {
  const label = period?.label || 'Meal'
  const lower = label.toLowerCase()
  const mode = config?.mode || 'both'

  if (mode === 'question') {
    return { title: `What are you having for ${lower}?`, body: 'Tap to pick or log your meal.', suggestions: [] }
  }

  const suggestions = await fetchReminderSuggestions(config, preferences)
  if (!suggestions.length) {
    return { title: `What are you having for ${lower}?`, body: 'Tap to pick or log your meal.', suggestions: [] }
  }

  const names = suggestions.map((meal) => meal.name).join(', ')
  if (mode === 'suggestions') {
    return { title: `${label} ideas`, body: `Try: ${names}.`, suggestions }
  }
  return {
    title: `${label} time`,
    body: `What are you having? Ideas: ${names}.`,
    suggestions
  }
}
