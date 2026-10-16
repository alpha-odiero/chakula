import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const seedConsent = () => {
  localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'accepted', timestamp: Date.now() }))
}
const seedOnboarded = () => {
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
}
const seedBoth = () => {
  localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'accepted', timestamp: Date.now() }))
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
}
const seedNotif = () => {
  localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'accepted', timestamp: Date.now() }))
  localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' }))
  localStorage.setItem(
    'chakula_notifications',
    JSON.stringify([
      { id: 'app-update', type: 'update', title: 'Update available', body: 'A new Pikawise update is available. Apply it when you are ready.', read: false, timestamp: Date.now() }
    ])
  )
}

const errs = []
function watch(p, label) {
  p.on('pageerror', (e) => errs.push(`${label} pageerror: ${e.message}`))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${label} console: ${m.text().slice(0, 140)}`) })
}

async function isolatedPage({ standalone = false, width = 390, before } = {}) {
  const ctx = await browser.createBrowserContext()
  const p = await ctx.newPage()
  if (standalone) {
    await p.evaluateOnNewDocument(() => {
      const o = window.matchMedia.bind(window)
      window.matchMedia = (q) => (String(q).includes('display-mode: standalone')
        ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false } }
        : o(q))
    })
  }
  if (before) await p.evaluateOnNewDocument(before)
  await p.setViewport({ width, height: 820 })
  return { ctx, p }
}

async function section(name, fn) {
  console.log(`\n=== ${name} ===`)
  try { await fn() } catch (e) { console.log('SECTION ERROR:', e.message) }
}

/* 1. Web footer: store buttons + downloads band + Home nav link + overflow */
await section('WEB FOOTER / STORE BUTTONS / HOME NAV', async () => {
  for (const width of [320, 375, 768, 1280]) {
    const { ctx, p } = await isolatedPage({ width, before: seedConsent })
    watch(p, `web${width}`)
    await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(1200)
    const info = await p.evaluate(() => {
      const buttons = [...document.querySelectorAll('.store-btn')]
      const box = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right) } }
      return {
        footerBand: !!document.querySelector('.footer-downloads'),
        heading: document.querySelector('#footer-downloads-title')?.textContent || null,
        storeCount: buttons.length,
        tags: buttons.map((b) => b.tagName),
        hashes: buttons.map((b) => b.getAttribute('href')).filter(Boolean),
        sizes: buttons.map(box),
        brandMarks: document.querySelectorAll('svg.brand-mark').length,
        homeNav: [...document.querySelectorAll('.nav-link')].map((a) => a.textContent.trim()),
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        nudge: !!document.querySelector('.install-nudge'),
        toastStack: !!document.querySelector('.toast-stack'),
        updateModal: !!document.querySelector('.update-modal')
      }
    })
    console.log(`w=${width} ${JSON.stringify(info)}`)
    await ctx.close()
  }
})

/* 2. Clicking a store button (no URL configured) shows a toast, no navigation */
await section('STORE BUTTON CLICK', async () => {
  const { ctx, p } = await isolatedPage({ width: 1280, before: seedBoth })
  watch(p, 'store-click')
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(5200) // let the offline-ready toast auto-dismiss so it cannot cover the button
  const before = p.url()
  await p.evaluate(() => document.querySelector('.store-btn').scrollIntoView({ block: 'center' }))
  await sleep(1500) // let lazy images settle so the footer stops moving
  const box = await p.evaluate(() => {
    const r = document.querySelector('.store-btn').getBoundingClientRect()
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  })
  await p.mouse.click(box.x, box.y)
  await sleep(600)
  const info = await p.evaluate(() => ({
    toasts: [...document.querySelectorAll('.toast-stack .toast')].map((t) => t.textContent),
    path: location.pathname + location.hash
  }))
  console.log('after click ->', JSON.stringify({ ...info, unchanged: info.path === new URL(before).pathname + new URL(before).hash }))
  await ctx.close()
})

/* 3. Notification centre */
await section('NOTIFICATION CENTRE', async () => {
  for (const standalone of [false, true]) {
    const { ctx, p } = await isolatedPage({ standalone, width: standalone ? 390 : 1280, before: seedBoth })
    watch(p, `notif-${standalone ? 'app' : 'web'}`)
    await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
    await sleep(1400)
    const pre = await p.evaluate(() => {
      const b = document.querySelector('.notif-button')
      const r = b?.getBoundingClientRect()
      return { found: !!b, w: r ? Math.round(r.width) : null, visible: b ? getComputedStyle(b).display !== 'none' : null }
    })
    await p.click('.notif-button')
    await sleep(500)
    const info = await p.evaluate(() => {
      const r = document.querySelector('.notif-panel')?.getBoundingClientRect()
      return {
        panel: !!document.querySelector('.notif-panel'),
        empty: document.querySelector('.notif-empty')?.textContent || null,
        aria: document.querySelector('.notif-button')?.getAttribute('aria-expanded'),
        offRight: r ? Math.round(window.innerWidth - r.right) : null,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        updateModal: !!document.querySelector('.update-modal')
      }
    })
    console.log(`${standalone ? 'app' : 'web'} pre=${JSON.stringify(pre)} after=${JSON.stringify(info)}`)
    await ctx.close()
  }

  // Seeded unread update notification: badge + item + action
  const { ctx, p } = await isolatedPage({ standalone: true, width: 390, before: seedNotif })
  watch(p, 'notif-seeded')
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1400)
  const seeded = await p.evaluate(() => ({
    badge: document.querySelector('.notif-badge')?.textContent || null,
    label: document.querySelector('.notif-button')?.getAttribute('aria-label')
  }))
  await p.click('.notif-button')
  await sleep(500)
  const panel = await p.evaluate(() => ({
    items: [...document.querySelectorAll('.notif-item-title')].map((n) => n.textContent),
    action: [...document.querySelectorAll('.notif-item-action')].map((n) => n.textContent.trim()),
    dismiss: !!document.querySelector('.notif-item-dismiss'),
    readAfterOpen: JSON.parse(localStorage.getItem('chakula_notifications') || '[]')[0]?.read
  }))
  console.log('seeded ->', JSON.stringify({ ...seeded, ...panel }))
  await ctx.close()
})

/* 4. Welcome message once */
await section('WELCOME ONCE', async () => {
  const { ctx, p } = await isolatedPage({ width: 390, before: seedConsent })
  watch(p, 'welcome')
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1400)
  const first = await p.evaluate(() => !!document.querySelector('.onboarding'))
  const skip = await p.$('.onboarding .button--ghost')
  if (skip) { await skip.click(); await sleep(600) }
  await p.reload({ waitUntil: 'networkidle2' })
  await sleep(1400)
  const after = await p.evaluate(() => ({
    onboarding: !!document.querySelector('.onboarding'),
    prefs: JSON.parse(localStorage.getItem('chakula_preferences') || '{}')
  }))
  console.log('first show =', first, ' skipFound =', !!skip, ' after skip+reload =', JSON.stringify(after))
  await ctx.close()
})

/* 5. Cookie consent persistence + manage panel */
await section('COOKIE CONSENT', async () => {
  const { ctx, p } = await isolatedPage({ width: 390 })
  watch(p, 'consent')
  await p.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1400)
  const shown = await p.evaluate(() => ({
    banner: !!document.querySelector('.cookie-consent'),
    buttons: [...document.querySelectorAll('.cookie-consent-actions button')].map((b) => b.textContent.trim())
  }))
  console.log('initial ->', JSON.stringify(shown))
  await p.click('.cookie-manage')
  await sleep(300)
  const details = await p.evaluate(() => !!document.querySelector('.cookie-consent-details'))
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll('.cookie-consent-actions button')].find((b) => /essential/i.test(b.textContent))
    btn.click()
  })
  await sleep(400)
  const stored = await p.evaluate(() => localStorage.getItem('chakula_cookie_consent'))
  await p.reload({ waitUntil: 'networkidle2' })
  await sleep(1000)
  const afterReload = await p.evaluate(() => !!document.querySelector('.cookie-consent'))
  console.log('details shown =', details, ' stored =', stored, ' afterReload visible =', afterReload)
  await ctx.close()
})

/* 6. Save button toast on meal detail */
await section('SAVE TOAST', async () => {
  const { ctx, p } = await isolatedPage({ width: 390, before: seedBoth })
  watch(p, 'save')
  await p.goto(BASE + '/meal/52772', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(2000)
  const has = await p.$('.meal-save')
  if (has) {
    await has.click()
    await sleep(500)
    console.log('grid save toast ->', await p.evaluate(() => document.querySelector('.toast-stack .toast')?.textContent || null))
  } else {
    console.log('no .meal-save on page (detail page uses its own button)')
  }
  const saved = await p.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /^Save$|^Saved$/.test(b.textContent.trim()))
    if (!btn) return null
    btn.click()
    return btn.textContent.trim()
  })
  await sleep(500)
  console.log('detail save clicked =', saved, ' toast ->', await p.evaluate(() => [...document.querySelectorAll('.toast-stack .toast')].map((t) => t.textContent)))
  await ctx.close()
})

console.log('\n=== CONSOLE/PAGE ERRORS ===')
console.log(errs.length ? errs.join('\n') : 'none')
await browser.close()
