import puppeteer from 'puppeteer-core'
import sharp from 'sharp'

const BASE = 'http://127.0.0.1:4173'
let pass = 0
let fail = 0
const failures = []

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`PASS [seo] ${name}${detail ? ` -- ${detail}` : ''}`)
  } else {
    fail += 1
    failures.push(name)
    console.log(`FAIL [seo] ${name}${detail ? ` -- ${detail}` : ''}`)
  }
}

const home = await fetch(`${BASE}/`).then((r) => r.text())
const robotTxt = await fetch(`${BASE}/robots.txt`).then((r) => r.text())
const llms = await fetch(`${BASE}/llms.txt`).then((r) => r.text())
const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text())
const ogImage = await fetch(`${BASE}/og-image.jpg`)

check('home HTML has an indexable title', /<title>Pikawise — Discover meals\. Cook with what you have\.<\/title>/.test(home))
check('home HTML description is present and specific', /name="description" content="Discover recipes, cook with ingredients you already have/.test(home))
check('home canonical is absolute', /<link rel="canonical" href="https:\/\/pikawise\.vercel\.app\/" \/>/.test(home))
check('OG image is declared with dimensions', /og:image" content="https:\/\/pikawise\.vercel\.app\/og-image\.jpg"/.test(home) && /og:image:width" content="1200"/.test(home) && /og:image:height" content="630"/.test(home))
check('Twitter card uses large image', /twitter:card" content="summary_large_image"/.test(home) && /twitter:image" content="https:\/\/pikawise\.vercel\.app\/og-image\.jpg"/.test(home))
check('home follows and allows rich previews', /name="robots" content="index,follow,max-snippet:-1,max-image-preview:large/.test(home))
check('JSON-LD has WebSite, Organization and WebApplication', /"@type": "WebSite"/.test(home) && /"@type": "Organization"/.test(home) && /"@type": "WebApplication"/.test(home))
check('WebSite declares a SearchAction', /"@type": "SearchAction"/.test(home) && /search\?q=\{search_term_string\}/.test(home))
check('noscript fallback content is in the HTML', /<noscript>/.test(home) && /Explore recipes<\/a>/.test(home))
check('llms.txt is linked from the head', /rel="alternate" type="text\/plain" href="\/llms\.txt"/.test(home))

check('robots.txt allows general crawling', /User-agent: \*\r?\nAllow: \//.test(robotTxt))
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot']) {
  check(`robots.txt names ${bot}`, new RegExp(`User-agent: ${bot}`).test(robotTxt))
}
check('robots.txt blocks private pages', ['/settings', '/favorites', '/reminder', '/search', '/meal-plans', '/shopping-list'].every((p) => robotTxt.includes(`Disallow: ${p}`)))
check('robots.txt points to the sitemap', robotTxt.includes('Sitemap: https://pikawise.vercel.app/sitemap.xml'))

check('llms.txt explains the site for AI', /# Pikawise/.test(llms) && /free recipe discovery/.test(llms) && /TheMealDB/.test(llms))
check('llms.txt lists key pages', ['/explore', '/categories', '/balanced-diet', '/random', '/terms'].every((p) => llms.includes(`https://pikawise.vercel.app${p}`)))
check('llms.txt gives citation guidance', /Citation guidance/.test(llms) && /link to the specific recipe or category page/.test(llms))

const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
check('sitemap has a broad recipe catalogue', locations.length > 500, `${locations.length} URLs`)
check('sitemap URLs are unique', new Set(locations).size === locations.length)
check('sitemap includes categories', locations.includes('https://pikawise.vercel.app/categories/beef') && locations.includes('https://pikawise.vercel.app/categories/vegetarian'))
check('sitemap includes recipe pages', locations.some((url) => /\/meal\/\d+$/.test(url)))
check('sitemap excludes private pages', !locations.some((url) => /\/(settings|favorites|reminder|search|meal-plans|shopping-list)$/.test(url)))

check('og-image.jpg is served', ogImage.ok && (ogImage.headers.get('content-type') || '').includes('image/jpeg'))
const ogBytes = Buffer.from(await ogImage.arrayBuffer())
const ogMeta = await sharp(ogBytes).metadata()
check('og-image.jpg is a JPEG 1200x630', ogMeta.format === 'jpeg' && ogMeta.width === 1200 && ogMeta.height === 630, `${ogMeta.format} ${ogMeta.width}x${ogMeta.height} ${Math.round(ogBytes.length / 1024)}KB`)

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox']
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, acceptedDisclaimer: true }))
  localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'essential', timestamp: Date.now() }))
  localStorage.setItem('chakula_install_dismissed', JSON.stringify(true))
})

async function open(path, ready) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  if (ready) await page.waitForSelector(ready, { timeout: 30000 })
  await page.waitForFunction(() => {
    const splash = document.getElementById('app-splash')
    return !splash || splash.classList.contains('pw-splash--hidden')
  })
  await new Promise((r) => setTimeout(r, 300))
}

await open('/', 'main')
const runtime = await page.evaluate(() => ({
  title: document.title,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  description: document.querySelector('meta[name="description"]')?.content,
  robots: document.querySelector('meta[name="robots"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content
}))
check('runtime home title matches static head', runtime.title === 'Pikawise — Discover meals. Cook with what you have.', runtime.title)
check('runtime home canonical is root', runtime.canonical === 'https://pikawise.vercel.app/', runtime.canonical)
check('runtime home keeps index,follow', /index/.test(runtime.robots) && !/noindex/.test(runtime.robots))

await open('/explore', 'main')
const exploreTitle = await page.title()
const exploreCanonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href)
check('explore has its own title', /Explore recipes/.test(exploreTitle), exploreTitle)
check('explore canonical points to /explore', exploreCanonical === 'https://pikawise.vercel.app/explore', exploreCanonical)

await open('/meal/52796', '.instructions-list .instruction-step')
const meal = await page.evaluate(() => {
  const script = document.getElementById('seo-page-jsonld')
  let json = null
  try {
    json = script ? JSON.parse(script.textContent) : null
  } catch {
    json = null
  }
  const recipe = json?.['@graph']?.find((node) => node['@type'] === 'Recipe')
  const breadcrumb = json?.['@graph']?.find((node) => node['@type'] === 'BreadcrumbList')
  return {
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    description: document.querySelector('meta[name="description"]')?.content,
    robots: document.querySelector('meta[name="robots"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    recipe: recipe
      ? {
          name: recipe.name,
          ingredients: recipe.recipeIngredient?.length,
          steps: recipe.recipeInstructions?.length,
          category: recipe.recipeCategory,
          cuisine: recipe.recipeCuisine,
          url: recipe.url,
          firstStepType: recipe.recipeInstructions?.[0]?.['@type']
        }
      : null,
    breadcrumbSteps: breadcrumb?.itemListElement?.length
  }
})
check('meal page title is recipe-specific', meal.title === 'Chicken Alfredo Primavera recipe — Pikawise', meal.title)
check('meal page canonical is recipe URL', meal.canonical === 'https://pikawise.vercel.app/meal/52796', meal.canonical)
check('meal page description is recipe-specific', /Chicken Alfredo Primavera recipe/.test(meal.description || ''), meal.description)
check('meal page stays indexable', /index/.test(meal.robots) && !/noindex/.test(meal.robots), meal.robots)
check('meal OG image uses the recipe photo', /themealdb\.com\/images\/media\/meals/.test(meal.ogImage || ''))
check('Recipe JSON-LD has ingredients and HowToSteps', meal.recipe && meal.recipe.ingredients >= 5 && meal.recipe.steps >= 5 && meal.recipe.firstStepType === 'HowToStep', JSON.stringify(meal.recipe))
check('Recipe JSON-LD has category, cuisine and URL', Boolean(meal.recipe?.category && meal.recipe?.cuisine && meal.recipe?.url), JSON.stringify(meal.recipe))
check('Recipe page has breadcrumbs', meal.breadcrumbSteps === 3, String(meal.breadcrumbSteps))

await open('/categories/beef', '.meal-card')
const category = await page.evaluate(() => {
  let json = null
  try {
    json = JSON.parse(document.getElementById('seo-page-jsonld')?.textContent || 'null')
  } catch {
    json = null
  }
  return {
    title: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    listType: json?.['@type'],
    listCount: json?.itemListElement?.length
  }
})
check('category title is specific', category.title === 'Beef recipes — Pikawise', category.title)
check('category canonical is category URL', category.canonical === 'https://pikawise.vercel.app/categories/beef', category.canonical)
check('category has an ItemList schema', category.listType === 'ItemList' && category.listCount > 0, JSON.stringify(category))

await open('/search?q=chicken', 'main')
const search = await page.evaluate(() => ({
  title: document.title,
  robots: document.querySelector('meta[name="robots"]')?.content
}))
check('search results are noindex', /noindex/.test(search.robots || ''), search.robots)
check('search title includes the query', /Search results for "chicken"/.test(search.title), search.title)

await open('/settings', 'main')
const settings = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.content)
check('settings is noindex', /noindex/.test(settings || ''), settings)

await open('/this-page-does-not-exist', 'main')
const missing = await page.evaluate(() => ({
  title: document.title,
  robots: document.querySelector('meta[name="robots"]')?.content
}))
check('404 is noindex', /noindex/.test(missing.robots || ''), missing.robots)
check('404 has a useful title', /not found/.test(missing.title), missing.title)

await browser.close()

console.log(`\n===== SEO: ${pass}/${pass + fail} checks passed =====`)
if (fail) {
  console.log(`Failures: ${failures.join(', ')}`)
  process.exitCode = 1
}
