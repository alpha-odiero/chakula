/**
 * Pikawise internal meal model.
 *
 * This module is the single place that understands the shape of raw recipe
 * data coming from an external provider. Everything else in the app works with
 * the Pikawise model below, so the UI never depends on a provider's field
 * names, source links, or response structure.
 *
 * Internal shapes
 *   Meal       { id, name, category, area, image, instructions, tags, youtube, source, ingredients }
 *   Ingredient { name, measure }
 *   Category   { name, image, description }
 */

const MAX_INGREDIENT_SLOTS = 20

function toText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean)
  return toText(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function normalizeIngredients(raw) {
  if (!raw || typeof raw !== 'object') return []

  // Already in the Pikawise shape.
  if (Array.isArray(raw.ingredients)) {
    return raw.ingredients
      .map((item) => {
        if (typeof item === 'string') {
          const name = item.trim()
          return name ? { name, measure: null } : null
        }
        if (!item || typeof item !== 'object') return null
        const name = toText(item.name ?? item.ingredient)
        if (!name) return null
        return { name, measure: toText(item.measure ?? item.amount) || null }
      })
      .filter(Boolean)
  }

  // Raw provider-shaped meal: numbered ingredient/measure slots.
  const list = []
  for (let slot = 1; slot <= MAX_INGREDIENT_SLOTS; slot++) {
    const name = toText(raw[`strIngredient${slot}`])
    if (!name) continue
    list.push({ name, measure: toText(raw[`strMeasure${slot}`]) || null })
  }
  return list
}

export function normalizeMeal(raw) {
  if (!raw || typeof raw !== 'object') return null

  const rawId = raw.id ?? raw.idMeal
  if (rawId === undefined || rawId === null || rawId === '') return null

  return {
    id: String(rawId),
    name: toText(raw.name ?? raw.strMeal) || 'Untitled recipe',
    category: toText(raw.category ?? raw.strCategory) || null,
    area: toText(raw.area ?? raw.strArea) || null,
    image: toText(raw.image ?? raw.strMealThumb) || null,
    instructions: typeof raw.instructions === 'string' ? raw.instructions : toText(raw.strInstructions),
    tags: parseTags(raw.tags ?? raw.strTags),
    youtube: toText(raw.youtube ?? raw.strYoutube) || null,
    source: toText(raw.source ?? raw.strSource) || null,
    ingredients: normalizeIngredients(raw)
  }
}

export function normalizeMeals(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizeMeal).filter(Boolean)
}

export function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = toText(raw.name ?? raw.strCategory)
  if (!name) return null
  return {
    name,
    image: toText(raw.image ?? raw.strCategoryThumb) || null,
    description: toText(raw.description ?? raw.strCategoryDescription) || null
  }
}

export function normalizeCategories(list) {
  if (!Array.isArray(list)) return []
  return list.map(normalizeCategory).filter(Boolean)
}

export function slugify(value) {
  return toText(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}
