import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const seed = () => {
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
  localStorage.setItem('chakula_cookie_consent', 'accepted')
}

async function setup(standalone) {
  const page = await browser.newPage()
  if (standalone) {
    await page.evaluateOnNewDocument(() => {
      const original = window.matchMedia.bind(window)
      window.matchMedia = (query) => {
        if (String(query).includes('display-mode: standalone')) {
          return {
            matches: true,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
              return false
            }
          }
        }
        return original(query)
      }
    })
  }
  await page.evaluateOnNewDocument(seed)
  return page
}

async function overflow(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const out = []
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.right > vw + 1) out.push({ cls: String(el.className).slice(0, 50), right: Math.round(r.right) })
    }
    return { docW: document.documentElement.scrollWidth, vw, out: out.slice(0, 5) }
  })
}

/* ---------- App (standalone) mode ---------- */
console.log('=== APP MODE (display-mode: standalone) ===')
const appRoutes = ['/', '/explore', '/meal/52772', '/favorites', '/settings', '/balanced-diet']
for (const width of [320, 375, 390, 430]) {
  const page = await setup(true)
  await page.setViewport({ width, height: 800, isMobile: true, hasTouch: true })
  for (const route of appRoutes) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(1200)
    const o = await overflow(page)
    const ui = await page.evaluate(() => ({
      appHeader: !!document.querySelector('.app-header'),
      webHeader: !!document.querySelector('.site-header'),
      bottomNav: !!document.querySelector('.bottom-nav'),
      footer: !!document.querySelector('.site-footer'),
      installedClass: document.documentElement.classList.contains('installed-mode'),
      featured: !!document.querySelector('.featured-card'),
      scroller: !!document.querySelector('.category-scroller'),
      installPrompt: !!document.querySelector('.install-prompt')
    }))
    const bad = o.docW - o.vw > 1
    console.log(`[${width}] ${route} overflow=${o.docW - o.vw} app=${ui.appHeader} web=${ui.webHeader} nav=${ui.bottomNav} footer=${ui.footer} installed=${ui.installedClass}` + (route === '/' ? ` featured=${ui.featured} scroller=${ui.scroller}` : ''))
    if (bad) console.log('   ', JSON.stringify(o.out))
  }
  await page.close()
}

/* ---------- Cooking mode flow (app mode, 390) ---------- */
{
  const page = await setup(true)
  await page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
  await page.goto(BASE + '/meal/52772', { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  const startBtn = await page.$('.meal-detail-actions .button--primary')
  await startBtn?.click()
  await sleep(400)
  const step1 = await page.evaluate(() => ({
    open: !!document.querySelector('.cooking-mode'),
    label: document.querySelector('.cooking-mode-step-label')?.textContent,
    text: document.querySelector('.cooking-step-text')?.textContent?.slice(0, 40)
  }))
  await page.click('.cooking-mode-actions .button--primary')
  await sleep(300)
  const step2 = await page.evaluate(() => ({
    label: document.querySelector('.cooking-mode-step-label')?.textContent,
    text: document.querySelector('.cooking-step-text')?.textContent?.slice(0, 40)
  }))
  await page.click('.cooking-mode-bar .cooking-icon-button:last-child')
  await sleep(300)
  const ing = await page.evaluate(() => ({
    shown: !!document.querySelector('.cooking-ingredients'),
    first: document.querySelector('.cooking-ingredients li')?.textContent
  }))
  const o = await overflow(page)
  console.log('COOKING:', JSON.stringify({ ...step1, ...step2, ingredients: ing, overflow: o.docW - o.vw }))
  await page.close()
}

/* ---------- Web mode desktop ---------- */
console.log('=== WEB MODE (desktop) ===')
for (const width of [768, 1024, 1440]) {
  const page = await setup(false)
  await page.setViewport({ width, height: 900 })
  for (const route of ['/', '/explore', '/meal/52772']) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(1200)
    const o = await overflow(page)
    const ui = await page.evaluate(() => ({
      webHeader: !!document.querySelector('.site-header'),
      bottomNav: !!document.querySelector('.bottom-nav'),
      footer: !!document.querySelector('.site-footer'),
      hero: !!document.querySelector('.site-hero'),
      steps: !!document.querySelector('#how-it-works')
    }))
    console.log(`[${width}] ${route} overflow=${o.docW - o.vw} web=${ui.webHeader} nav=${ui.bottomNav} footer=${ui.footer}` + (route === '/' ? ` hero=${ui.hero} howItWorks=${ui.steps}` : ''))
    if (o.docW - o.vw > 1) console.log('   ', JSON.stringify(o.out))
  }
  await page.close()
}

await browser.close()
