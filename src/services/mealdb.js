const BASE_URL = import.meta.env.VITE_MEALDB_BASE_URL || 'https://www.themealdb.com/api/json/v1/1'
const API_KEY = import.meta.env.VITE_MEALDB_API_KEY || '1'

const DEFAULT_TIMEOUT_MS = 9000

class ApiError extends Error {
  constructor(message, { code = 'API_ERROR', status = null, retryable = true } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.retryable = retryable
  }
}

function assertValidResponse(data) {
  if (data === null || data === undefined) throw new ApiError('Empty API response', { code: 'EMPTY_RESPONSE' })
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError('Malformed API response', { code: 'MALFORMED_RESPONSE' })
  }
}

async function fetchJson(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  url.searchParams.set('apiKey', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  let response
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please check your connection and try again.', {
        code: 'TIMEOUT'
      })
    }
    throw new ApiError('Network request failed. Please check your connection.', {
      code: 'NETWORK_ERROR'
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new ApiError(`The service returned an error (${response.status})`, {
      code: 'HTTP_ERROR',
      status: response.status
    })
  }

  let data
  try {
    const text = await response.text()
    data = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('We received a malformed response from the service.', {
      code: 'MALFORMED_RESPONSE',
      retryable: false
    })
  }

  assertValidResponse(data)
  return data
}

const byMeal = (meal) => meal

export function searchMeals(query) {
  return fetchJson('search.php', { s: query }).then((data) => (data.meals || []).map(byMeal))
}

export function getMeal(id) {
  return fetchJson('lookup.php', { i: id }).then((data) => {
    const meals = data.meals || []
    return meals.length ? meals[0] : null
  })
}

export function getRandomMeal() {
  return fetchJson('random.php').then((data) => {
    const meals = data.meals || []
    return meals.length ? meals[0] : null
  })
}

export function getCategories() {
  return fetchJson('categories.php').then((data) => data.categories || [])
}

export function filterByCategory(category) {
  return fetchJson('filter.php', { c: category }).then((data) => (data.meals || []).map(byMeal))
}

export function filterByIngredient(ingredient) {
  return fetchJson('filter.php', { i: ingredient }).then((data) => (data.meals || []).map(byMeal))
}

export function listAreas() {
  return fetchJson('list.php', { a: 'list' }).then((data) => (data.meals || []).map((m) => m.strArea))
}

export function filterByArea(area) {
  return fetchJson('filter.php', { a: area }).then((data) => (data.meals || []).map(byMeal))
}

export function listIngredients() {
  return fetchJson('list.php', { i: 'list' }).then((data) => (data.meals || []).map((m) => m.strIngredient))
}

export function getMealsByIds(ids) {
  return Promise.all(ids.map((id) => getMeal(id)))
}