import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
  localStorage.setItem('chakula_cookie_consent', 'accepted')
})

const routes = ['/', '/explore', '/categories', '/meal/52772', '/balanced-diet', '/meal-plans', '/shopping-list', '/settings', '/about']
for (const width of [320, 375]) {
  await page.setViewport({ width, height: 800 })
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(900)
    const out = await page.evaluate(() => {
      const clipped = []
      const tap = []
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (!el.isConnected || cs.display === 'none' || cs.visibility === 'hidden') continue
        if (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap') {
          if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
            clipped.push({
              cls: (typeof el.className === 'string' ? el.className : el.tagName).slice(0, 50),
              tag: el.tagName,
              sw: el.scrollWidth, cw: el.clientWidth,
              text: (el.textContent || '').trim().slice(0, 36)
            })
          }
        }
        if (el.tagName === 'A' || el.tagName === 'BUTTON') {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && r.height > 0 && r.bottom < 800 && r.height < 36) {
            tap.push({
              cls: (typeof el.className === 'string' ? el.className : el.tagName).slice(0, 40),
              h: Math.round(r.height), w: Math.round(r.width),
              text: (el.textContent || '').trim().slice(0, 24)
            })
          }
        }
      }
      return { clipped: clipped.slice(0, 6), tap: tap.slice(0, 10), tapCount: tap.length }
    })
    if (out.clipped.length) console.log(`[${width}] ${route} CLIPPED:`, JSON.stringify(out.clipped))
    if (out.tapCount) console.log(`[${width}] ${route} small taps(${out.tapCount}):`, JSON.stringify(out.tap.slice(0, 5)))
  }
}
await browser.close()