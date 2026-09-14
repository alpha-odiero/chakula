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

const routes = ['/', '/explore', '/search?q=chicken', '/categories', '/categories/beef', '/meal/52772',
  '/balanced-diet', '/meal-plans', '/shopping-list', '/settings', '/about', '/developer', '/privacy', '/terms', '/random']
const widths = [320, 360, 390, 414, 600]

for (const width of widths) {
  await page.setViewport({ width, height: 800 })
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(900)
    const audit = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth
      const vw = window.innerWidth
      const offenders = []
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (!el.isConnected) continue
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const r = el.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.right > vw + 1) {
          const cls = (el.className.baseVal !== undefined) ? el.className.baseVal : (typeof el.className === 'string' ? el.className : el.tagName)
          offenders.push({
            cls: String(cls).slice(0, 60),
            tag: el.tagName,
            right: Math.round(r.right),
            w: Math.round(r.width),
            text: (el.textContent || '').trim().slice(0, 40)
          })
        }
      }
      offenders.sort((a, b) => b.right - a.right)
      return { vw, docW, overflow: docW - vw, offenders: offenders.slice(0, 8) }
    })
    if (audit.overflow > 1) {
      console.log(`[${width}px] ${route} OVERFLOW=${audit.overflow}`)
      for (const o of audit.offenders) console.log(`      -> ${o.tag}.${o.cls} right=${o.right} w=${o.w} "${o.text}"`)
    }
  }
  console.log(`--- width ${width} sweep done ---`)
}
await browser.close()