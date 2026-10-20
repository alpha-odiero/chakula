/**
 * Regenerates public/sitemap.xml from the public routes plus the live recipe
 * catalogue. Run with `npm run sitemap` when recipes change.
 */
import { writeFile } from 'node:fs/promises'

const SITE_URL = process.env.SITE_URL || 'https://pikawise.vercel.app'
const API_BASE = process.env.MEALDB_BASE_URL || 'https://www.themealdb.com/api/json/v1/1'
const API_KEY = process.env.MEALDB_API_KEY || '1'
const TODAY = new Date().toISOString().slice(0, 10)

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/explore', priority: '0.9', changefreq: 'weekly' },
  { path: '/categories', priority: '0.8', changefreq: 'weekly' },
  { path: '/balanced-diet', priority: '0.8', changefreq: 'monthly' },
  { path: '/random', priority: '0.7', changefreq: 'monthly' },
  { path: '/developer', priority: '0.4', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' }
]

const FALLBACK_CATEGORIES = [
  'Beef',
  'Chicken',
  'Dessert',
  'Lamb',
  'Miscellaneous',
  'Pasta',
  'Pork',
  'Seafood',
  'Side',
  'Starter',
  'Vegan',
  'Vegetarian',
  'Breakfast',
  'Goat'
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`)
  url.searchParams.set('apiKey', API_KEY)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      if (attempt === 2) throw error
      await sleep(500 * (attempt + 1))
    }
  }
  return null
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function urlEntry(path, { priority = '0.5', changefreq = 'monthly', lastmod = TODAY } = {}) {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].join('\n')
}

async function loadCategories() {
  try {
    const data = await getJson('categories.php')
    const names = (data?.categories || []).map((category) => category.strCategory).filter(Boolean)
    return names.length ? names : FALLBACK_CATEGORIES
  } catch (error) {
    console.warn(`[sitemap] categories fetch failed: ${error.message}`)
    return FALLBACK_CATEGORIES
  }
}

async function loadMeals() {
  const meals = new Map()
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    try {
      const data = await getJson('search.php', { f: letter })
      for (const meal of data?.meals || []) {
        const id = meal.idMeal
        if (!id || !meal.strMeal) continue
        meals.set(String(id), meal.strMeal)
      }
    } catch (error) {
      console.warn(`[sitemap] meals for "${letter}" failed: ${error.message}`)
    }
    await sleep(150)
  }
  return [...meals.entries()].sort((a, b) => a[1].localeCompare(b[1]))
}

const categories = await loadCategories()
const meals = await loadMeals()

const entries = [
  ...STATIC_ROUTES.map((route) => urlEntry(route.path, route)),
  ...categories.map((name) =>
    urlEntry(`/categories/${slugify(name)}`, {
      priority: '0.7',
      changefreq: 'weekly'
    })
  ),
  ...meals.map(([id]) =>
    urlEntry(`/meal/${id}`, {
      priority: '0.6',
      changefreq: 'monthly'
    })
  )
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
await writeFile('public/sitemap.xml', xml, 'utf8')

console.log(`sitemap.xml: ${entries.length} URLs (${categories.length} categories, ${meals.length} recipes)`)
if (meals.length < 50) console.warn('[sitemap] only a few recipes were fetched; check the API or network.')
