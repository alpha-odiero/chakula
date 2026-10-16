import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const seed = () => {
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
  localStorage.setItem('chakula_cookie_consent', 'accepted')
}

async function page(standalone = false, width = 390) {
  const p = await browser.newPage()
  if (standalone) {
    await p.evaluateOnNewDocument(() => {
      const o = window.matchMedia.bind(window)
      window.matchMedia = (q) => (String(q).includes('display-mode: standalone')
        ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false } }
        : o(q))
    })
  }
  await p.evaluateOnNewDocument(seed)
  await p.setViewport({ width, height: 800 })
  return p
}

const errs = []
function watch(p, label) {
  p.on('pageerror', (e) => errs.push(`${label} pageerror: ${e.message}`))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${label} console: ${m.text().slice(0, 120)}`) })
}

console.log('=== EXPLORE DEEP LINKS ===')
{
  const p = await page(false, 1200)
  watch(p, 'explore')
  for (const q of ['', '?category=Beef', '?area=Italian', '?ingredient=chicken']) {
    await p.goto(BASE + '/explore' + q, { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(1500)
    const info = await p.evaluate(() => ({
      heading: document.querySelector('.results-head h2')?.textContent,
      count: document.querySelector('.results-count')?.textContent?.trim(),
      chip: document.querySelector('.chip--removable span')?.textContent,
      cards: document.querySelectorAll('.meal-card').length,
      url: location.search || '(none)'
    }))
    console.log(`/explore${q || ''} ->`, JSON.stringify(info))
  }
  await p.goto(BASE + '/explore?category=Beef', { waitUntil: 'networkidle2' })
  await sleep(1200)
  await p.click('.chip--removable')
  await sleep(800)
  console.log('after remove chip ->', await p.evaluate(() => ({ url: location.search || '(none)', chip: !!document.querySelector('.chip--removable'), heading: document.querySelector('.results-head h2')?.textContent })))
  await p.close()
}

console.log('=== ACCENT / HEADINGS / ERRORS (app mode) ===')
const routes = ['/', '/search?q=chicken', '/categories', '/categories/Beef', '/favorites', '/balanced-diet', '/meal-plans', '/shopping-list', '/settings', '/about', '/random']
for (const route of routes) {
  const p = await page(true, 390)
  watch(p, route)
  await p.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1600)
  const info = await p.evaluate(() => {
    const btn = document.querySelector('.button--primary')
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    return {
      primary: btn ? getComputedStyle(btn).backgroundColor : null,
      accentVar: accent,
      h1: document.querySelector('h1')?.textContent?.slice(0, 40) || document.querySelector('.page-header h1')?.textContent?.slice(0, 40) || null,
      empty: !!document.querySelector('.empty-state'),
      err: !!document.querySelector('.error-state')
    }
  })
  console.log(`${route} ->`, JSON.stringify(info))
  await p.close()
}

console.log('=== ERRORS ===')
console.log(errs.length ? errs.join('\n') : 'none')
await browser.close()
