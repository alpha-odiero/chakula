import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const OUT = 'shots'
fs.mkdirSync(OUT, { recursive: true })

const set = process.argv[2] || 'a'

const desktop = { width: 1280, height: 900 }
const mobile = { width: 390, height: 844 }

const routes = {
  home: '/',
  explore: '/explore',
  category: '/categories/Beef',
  search: '/search?q=chicken',
  terms: '/terms',
  settings: '/settings',
  about: '/about'
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const errs = []

async function shot({ route, viewport, name, full = true, scrollBottom = false }) {
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errs.push(`${name} pageerror: ${e.message}`))
  p.on('console', (m) => {
    if (m.type() === 'error') errs.push(`${name} console: ${m.text().slice(0, 160)}`)
  })
  await p.setViewport(viewport)
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'accepted', timestamp: Date.now() }))
    localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
    localStorage.setItem('chakula_theme', '"light"')
  })
  await p.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 }).catch(async () => {
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 })
  })
  await sleep(2600)
  if (scrollBottom) {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await sleep(900)
  }
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full && !scrollBottom })
  await ctx.close()
}

if (set === 'a') {
  for (const [key, route] of Object.entries(routes)) {
    await shot({ route, viewport: desktop, name: `d-${key}` })
    await shot({ route, viewport: mobile, name: `m-${key}` })
  }
  await shot({ route: '/', viewport: desktop, name: 'd-home-footer', scrollBottom: true })
  await shot({ route: '/', viewport: mobile, name: 'm-home-footer', scrollBottom: true })
}

if (set === 'b') {
  await shot({ route: '/', viewport: desktop, name: 'b-d-home' })
  await shot({ route: '/', viewport: mobile, name: 'b-m-home' })
}

console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no console/page errors')
await browser.close()
