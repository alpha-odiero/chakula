export function extractIngredients(meal) {
  if (!meal || typeof meal !== 'object') return []

  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}`] || '').trim()
    const measure = (meal[`strMeasure${i}`] || '').trim()
    if (ingredient) {
      ingredients.push({ ingredient, measure: measure || null })
    }
  }
  return ingredients
}

export function getMealTags(meal) {
  if (!meal || !meal.strTags) return []
  return meal.strTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function getVideoId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)
  return match ? match[1] : null
}

export function mealToCardData(meal) {
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || null,
    area: meal.strArea || null
  }
}

export function formatInstructionSteps(instructions) {
  if (!instructions) return []
  return instructions
    .split(/\r?\n+/)
    .map((step) => step.trim())
    .filter(Boolean)
}

export function debounce(fn, delay = 350) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}