import puppeteer from 'puppeteer-core'
import { formatInstructionSteps } from './src/utils/meal.js'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'

const results = []
process.on('uncaughtException', (err) => {
  console.log('SCRIPT CRASH:', err.message)
  const failed = results.filter((r) => !r.ok)
  console.log(`===== ${results.length - failed.length}/${results.length} checks passed before crash =====`)
  process.exit(1)
})
let currentSection = ''
function check(name, ok, detail = '') {
  results.push({ section: currentSection, name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} [${currentSection}] ${name}${detail ? ' -- ' + detail : ''}`)
}
const warn = (name, detail = '') => console.log(`WARN [${currentSection}] ${name} -- ${detail}`)

function isGreenish(r, g, b) {
  if (r === 52 && g === 168 && b === 83) return false // Google Play logo brand color
  return g > r + 25 && g > b + 25 && g > 90
}

async function greenScan(page, label) {
  currentSection = label
  const bad = await page.evaluate(() => {
    const out = []
    const isGreenish = (r, g, b) => {
      if (r === 52 && g === 168 && b === 83) return false
      return g > r + 25 && g > b + 25 && g > 90
    }
    for (const el of document.querySelectorAll('body *')) {
      if (out.length > 10) break
      const cs = getComputedStyle(el)
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke']) {
        const v = cs[prop]
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(v || '')
        if (!m) continue
        if (m[4] !== undefined && parseFloat(m[4]) === 0) continue
        const [r, g, b] = [+m[1], +m[2], +m[3]]
        if (isGreenish(r, g, b)) {
          const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
          out.push(`${el.tagName.toLowerCase()}${cls} ${prop}=${v}`)
          break
        }
      }
    }
    return out
  })
  check('no green in computed styles', bad.length === 0, bad.slice(0, 6).join(' | '))
}

async function go(page, path, waitSelector) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (waitSelector) await page.waitForSelector(waitSelector, { timeout: 15000 })
}

// The pre-React splash hides once the first page has rendered (~0.65s+);
// clicks/typing must wait until it is hidden (pointer-events: none) or removed.
async function waitForSplash(page) {
  await page
    .waitForFunction(() => {
      const s = document.getElementById('app-splash')
      return !s || s.classList.contains('pw-splash--hidden')
    }, { timeout: 15000 })
    .catch(() => {})
}

async function noOverflow(page, label) {
  const ov = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth
  }))
  check(`${label}: no horizontal page overflow`, ov.sw <= ov.cw + 1, `scrollWidth=${ov.sw} clientWidth=${ov.cw}`)
}

async function a11yButtons(page, label) {
  const bad = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('button, a')) {
      if (out.length > 8) break
      const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim()
      const imgAlt = [...el.querySelectorAll('img[alt]')].map((i) => i.alt).join(' ').trim()
      if (!label && !imgAlt) out.push(el.outerHTML.slice(0, 110))
    }
    return out
  })
  check(`${label}: all buttons/links have accessible names`, bad.length === 0, bad.join(' | '))
}

// ---------- Instruction step formatting (offline fixtures) ----------
currentSection = 'instructions'
const paragraph = formatInstructionSteps(
  'Heat 1 tablespoon of butter in a large skillet over medium-high heat. Season both sides of each chicken breast with salt and pepper. Add the chicken and cook for 5-7 minutes on each side. Remove the chicken and set it aside. Add the vegetables to the same skillet and cook until tender.'
)
check('paragraph-only recipe is split into usable steps', paragraph.length >= 4, `${paragraph.length} steps`)
check('paragraph split keeps sentences intact', paragraph.every((s) => !/ approx\.$/i.test(s)), paragraph.map((s) => s.slice(0, 24)).join(' | '))
const inline = formatInstructionSteps(
  'For the sauce, mix everything. 2. Season the patties with salt and pepper. 3. Cook the patties for two minutes per side. 4. Build the burger and serve.'
)
check('inline numbered steps are separated', inline.length === 4, inline.map((s) => s.slice(0, 20)).join(' | '))
check('leading step numbers are not repeated in the text', inline.every((s) => !/^\d/.test(s)), inline.join(' | '))
const labelled = formatInstructionSteps(
  'STEP 1 - MARINATING THE BEEF\r\nIn a bowl, add the beef.\r\nSTEP 2 - STIR FRY\r\nCook the beef until golden.'
)
check('"STEP n" labels are not rendered as steps', labelled.length === 2 && labelled.every((s) => !/^step\s*\d/i.test(s)), labelled.join(' | '))
check('section headings stay attached to their step', labelled.length === 2 && /^MARINATING THE BEEF: /i.test(labelled[0]) && /^STIR FRY: /i.test(labelled[1]), labelled.join(' | '))
const numbered = formatInstructionSteps('1. Heat oven to 200C.\r\n2. Bake for 20 minutes.\r\n3. Serve.')
check('numbered line-per-step recipe is cleaned, not lost', numbered.length === 3 && numbered[0] === 'Heat oven to 200C.', numbered.join(' | '))
check('non-string instructions produce no steps', formatInstructionSteps(null).length === 0 && formatInstructionSteps('').length === 0)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
// Skip first-run onboarding + banners so they can't intercept clicks.
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, acceptedDisclaimer: true }))
    localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'essential', timestamp: Date.now() }))
    localStorage.setItem('chakula_install_dismissed', JSON.stringify(true))
    localStorage.setItem('chakula_theme', JSON.stringify('system'))
  } catch {}
})
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`console: ${m.text()}`) })

await page.setViewport({ width: 1280, height: 900 })

// ---------- 1. HOME: theme, CTA, footer ----------
currentSection = 'home'
await go(page, '/', '.header-cta')
await page.waitForSelector('.site-footer', { timeout: 10000 })
const home = await page.evaluate(() => {
  const bodyBg = getComputedStyle(document.body).backgroundColor
  const bodyColor = getComputedStyle(document.body).color
  const cta = [...document.querySelectorAll('.header-cta')].map((e) => e.textContent.trim())
  const footerLinks = [...document.querySelectorAll('.site-footer a')].map((a) => a.getAttribute('href'))
  const footerText = document.querySelector('.site-footer')?.innerText || ''
  return { bodyBg, bodyColor, cta, footerLinks, footerText, allText: document.body.innerText }
})
check('light theme: body background white', home.bodyBg === 'rgb(255, 255, 255)', home.bodyBg)
const rgbText = /rgb\((\d+), (\d+), (\d+)\)/.exec(home.bodyColor)
check('light theme: body text near-black', !!rgbText && +rgbText[1] < 40 && +rgbText[2] < 40 && +rgbText[3] < 40, home.bodyColor)
check('header CTA is "Get app"', home.cta.some((t) => /get app/i.test(t)), JSON.stringify(home.cta))
check('"Open Pikawise" text removed', !/Open Pikawise/i.test(home.allText))
check('footer: no "Balanced Diet" link', !/Balanced Diet/i.test(home.footerText))
const expectedFooter = ['/meal-plans', '/shopping-list', '/terms#about', '/terms#privacy', '/terms#cookies', '/terms']
for (const href of expectedFooter) {
  check(`footer links include ${href}`, home.footerLinks.includes(href), home.footerLinks.join(','))
}
check('footer: explore/category links removed', !home.footerLinks.some((h) => ['/explore', '/categories', '/random', '/balanced-diet'].includes(h)), home.footerLinks.join(','))
await greenScan(page, 'home')
await a11yButtons(page, 'home')
await page
  .waitForFunction(() => {
    const img = document.querySelector('.site-hero-photo--main img')
    return img && img.complete && img.naturalWidth > 0
  }, { timeout: 10000 })
  .catch(() => {})
const hero = await page.evaluate(() => {
  const img = document.querySelector('.site-hero-photo--main img')
  return img ? { src: img.getAttribute('src'), alt: img.alt, natural: img.naturalWidth } : null
})
check('hero image is a bundled local asset', !!hero && /^assets\/|^\/assets\//.test(hero.src || ''), hero?.src)
check('hero image is the sunday-roast photo', !!hero && /sunday-roast/i.test(hero.src || ''), hero?.src)
check('hero image actually loads', !!hero && hero.natural > 0, `naturalWidth=${hero?.natural}`)
check('hero alt text describes the photo', !!hero && /roast/i.test(hero.alt || ''), hero?.alt)
await page.waitForSelector('.category-grid--cards .category-card-title', { timeout: 15000 })
const discovery = await page.$$eval('.category-grid--cards .category-card-title', (els) => els.map((e) => e.textContent.trim()))
check('Meal discovery keeps six minus the removed last card (5)', discovery.length === 5, discovery.join(','))
check('Meal discovery: Pasta removed, no replacement card backfilled', !discovery.includes('Pasta') && !discovery.includes('Pork'), discovery.join(','))

// ---------- 2. Reduced motion ----------
currentSection = 'a11y'
await page.emulateMediaFeatures([
  { name: 'prefers-color-scheme', value: 'light' },
  { name: 'prefers-reduced-motion', value: 'reduce' }
])
await go(page, '/explore', '.meal-card')
const rm = await page.evaluate(() => getComputedStyle(document.querySelector('.meal-card')).transitionDuration)
check('prefers-reduced-motion disables transitions', parseFloat(rm) <= 0.02, rm)
await page.emulateMediaFeatures([
  { name: 'prefers-color-scheme', value: 'light' },
  { name: 'prefers-reduced-motion', value: 'no-preference' }
])

// ---------- 2b. STARTUP / PWA LAUNCH EXPERIENCE ----------
currentSection = 'startup'
const html = await (await fetch(BASE + '/')).text()
const splashHtml = (/<div id="app-splash"[\s\S]*?<\/div>\s*<\/div>/.exec(html) || [''])[0]
check('launch markup is in the served HTML (shows before JS)', !!splashHtml && /aria-label="Pikawise is loading"/.test(splashHtml))
check('launch markup contains no logo or image', !!splashHtml && !/<img/i.test(splashHtml) && !/pw-splash-logo/.test(html))
check('launch markup shows the name and four dots', !!splashHtml && /pw-splash-name[^>]*>Pikawise/.test(splashHtml) && (splashHtml.match(/<span><\/span/g) || []).length === 4)
check('launch styles use a white background and black name', /#app-splash[\s\S]{0,400}background:\s*#ffffff/.test(html) && /\.pw-splash-name[\s\S]{0,300}color:\s*#000000/.test(html))
check('launch respects prefers-reduced-motion', /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}\.pw-splash-dots span/.test(html))

const manifest = await (await fetch(BASE + '/manifest.webmanifest')).json()
check('manifest keeps standalone display', manifest.display === 'standalone', manifest.display)
check('manifest start_url and scope unchanged', manifest.start_url === '/' && manifest.scope === '/', `${manifest.start_url} ${manifest.scope}`)
check('manifest splash colors match the white loader', manifest.background_color === '#ffffff' && manifest.theme_color === '#ffffff', `${manifest.background_color} ${manifest.theme_color}`)
const iconList = (manifest.icons || []).map((i) => `${i.sizes}:${i.purpose || 'any'}`)
check('manifest keeps 192/512 and maskable launcher icons', iconList.includes('192x192:any') && iconList.includes('512x512:any') && iconList.includes('512x512:maskable'), iconList.join(','))

await page.emulateMediaFeatures([
  { name: 'prefers-color-scheme', value: 'light' },
  { name: 'prefers-reduced-motion', value: 'no-preference' }
])
await page.evaluateOnNewDocument(() => {
  const snap = { seen: false, hiddenAt: null, removedAt: null }
  window.__pwSplash = snap
  const tick = () => {
    const s = document.getElementById('app-splash')
    if (s) {
      if (!snap.seen) {
        const name = s.querySelector('.pw-splash-name')
        const dot = s.querySelector('.pw-splash-dots span')
        snap.seen = true
        snap.hasImg = !!s.querySelector('img')
        snap.name = name ? name.textContent.trim() : ''
        snap.dotCount = s.querySelectorAll('.pw-splash-dots span').length
        snap.bg = getComputedStyle(s).backgroundColor
        snap.nameColor = name ? getComputedStyle(name).color : ''
        snap.dotAnimation = dot ? getComputedStyle(dot).animationName : ''
        snap.loadersBehind = document.querySelectorAll('.pw-loader').length
      }
      if (s.classList.contains('pw-splash--hidden') && snap.hiddenAt === null) snap.hiddenAt = performance.now()
    }
    if (snap.hiddenAt !== null && snap.removedAt === null && !document.getElementById('app-splash')) {
      snap.removedAt = performance.now()
    }
    if (snap.removedAt !== null) return
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForSelector('.site-hero', { timeout: 15000 })
await waitForSplash(page)
await page.waitForFunction(() => window.__pwSplash && window.__pwSplash.removedAt !== null, { timeout: 8000 }).catch(() => {})
const launch = await page.evaluate(() => window.__pwSplash)
const splashStillMounted = (await page.$('#app-splash')) !== null
check('custom launch screen appears on startup', !!launch?.seen)
check('launch screen shows no logo or app icon', !!launch && !launch.hasImg)
check('launch screen shows the Pikawise name', launch?.name === 'Pikawise', launch?.name)
check('launch screen uses the existing 4-dot animation', launch?.dotCount === 4 && launch?.dotAnimation === 'pw-splash-dot', `${launch?.dotCount} dots, ${launch?.dotAnimation}`)
check('launch screen is white with a black name', launch?.bg === 'rgb(255, 255, 255)' && launch?.nameColor === 'rgb(0, 0, 0)', `${launch?.bg} / ${launch?.nameColor}`)
check('no second branded loader behind the launch screen', launch?.loadersBehind === 0, String(launch?.loadersBehind))
check('launch screen no longer holds for 2s', !!launch && launch.hiddenAt !== null && launch.hiddenAt < 1600, `hidden at ${Math.round(launch?.hiddenAt || 0)}ms`)
check('launch screen still gives the intro a moment', !!launch && launch.hiddenAt !== null && launch.hiddenAt >= 550, `hidden at ${Math.round(launch?.hiddenAt || 0)}ms`)
check('launch screen is removed from the DOM after the fade', !!launch && launch.removedAt !== null && !splashStillMounted)
const webMode = await page.evaluate(() => ({
  webHeader: !!document.querySelector('.site-header'),
  appShell: !!document.querySelector('.app-shell--app'),
  appHeader: !!document.querySelector('.app-header')
}))
check('website still uses the website chrome (no app mode redirect)', webMode.webHeader && !webMode.appShell && !webMode.appHeader)

const appPage = await browser.newPage()
await appPage.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true })
await appPage.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, acceptedDisclaimer: true }))
    localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'essential', timestamp: Date.now() }))
    localStorage.setItem('chakula_install_dismissed', JSON.stringify(true))
    localStorage.setItem('chakula_theme', JSON.stringify('system'))
  } catch {}
  // Chrome does not expose a display-mode emulation hook, so emulate the
  // installed-app media query exactly as the platform reports it.
  const nativeMatchMedia = window.matchMedia.bind(window)
  window.matchMedia = (query) => {
    if (query === '(display-mode: standalone)') {
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false
        }
      }
    }
    return nativeMatchMedia(query)
  }
})
await appPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await appPage.waitForSelector('.app-home', { timeout: 15000 })
await waitForSplash(appPage)
await appPage.waitForFunction(() => !document.getElementById('app-splash'), { timeout: 8000 }).catch(() => {})
const standalone = await appPage.evaluate(() => ({
  splash: !!document.getElementById('app-splash'),
  appShell: !!document.querySelector('.app-shell--app'),
  header: !!document.querySelector('.app-header'),
  bottomNav: !!document.querySelector('.bottom-nav'),
  webHeader: !!document.querySelector('.site-header'),
  footer: !!document.querySelector('.site-footer'),
  path: location.pathname
}))
check('installed (standalone): app interface follows the loader', standalone.appShell && standalone.header && standalone.bottomNav)
check('installed (standalone): website header/footer are not shown', !standalone.webHeader && !standalone.footer)
check('installed (standalone): loader is gone, no duplicate overlay', !standalone.splash)
check('installed (standalone): launch stays on the start URL', standalone.path === '/', standalone.path)
await appPage.close()

const rmPage = await browser.newPage()
await rmPage.setViewport({ width: 1280, height: 900 })
await rmPage.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true, acceptedDisclaimer: true, reduceMotion: true }))
    localStorage.setItem('chakula_cookie_consent', JSON.stringify({ version: 1, choice: 'essential', timestamp: Date.now() }))
    localStorage.setItem('chakula_install_dismissed', JSON.stringify(true))
    localStorage.setItem('chakula_theme', JSON.stringify('system'))
  } catch {}
  window.__pwRM = null
  const tick = () => {
    const s = document.getElementById('app-splash')
    if (s) {
      const name = s.querySelector('.pw-splash-name')
      const dot = s.querySelector('.pw-splash-dots span')
      window.__pwRM = {
        hasImg: !!s.querySelector('img'),
        nameAnim: name ? getComputedStyle(name).animationName : '',
        dotAnim: dot ? getComputedStyle(dot).animationName : '',
        rmClass: document.documentElement.classList.contains('reduce-motion')
      }
    }
    if (window.__pwRM) return
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
await rmPage.emulateMediaFeatures([
  { name: 'prefers-color-scheme', value: 'light' },
  { name: 'prefers-reduced-motion', value: 'reduce' }
])
await rmPage.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await rmPage.waitForFunction(() => window.__pwRM !== null, { timeout: 10000 }).catch(() => {})
const rmSplash = await rmPage.evaluate(() => window.__pwRM)
check('reduced motion: launch animation is switched off', !!rmSplash && rmSplash.dotAnim === 'none' && rmSplash.nameAnim === 'none', `${rmSplash?.nameAnim} / ${rmSplash?.dotAnim}`)
check('reduced motion: stored preference applies before React', !!rmSplash && rmSplash.rmClass && !rmSplash.hasImg)
await rmPage.close()

// ---------- 3. LIVE SEARCH SUGGESTIONS ----------
currentSection = 'suggestions'
await go(page, '/explore', '.search-input')
await waitForSplash(page)
await page.click('.search-input')
await page.type('.search-input', 'chi', { delay: 40 })
try {
  await page.waitForSelector('.search-suggest-list .search-suggest-item', { timeout: 8000 })
  const sug = await page.evaluate(() => {
    const input = document.querySelector('.search-input')
    const items = [...document.querySelectorAll('.search-suggest-item:not(.search-suggest-all)')]
    const allRow = document.querySelector('.search-suggest-all')
    return {
      expanded: input.getAttribute('aria-expanded'),
      controls: input.getAttribute('aria-controls'),
      role: input.getAttribute('role'),
      listbox: !!document.querySelector('.search-suggestions [role="listbox"]'),
      options: items.length,
      names: items.slice(0, 3).map((i) => i.querySelector('.search-suggest-name')?.textContent || ''),
      hasAll: !!allRow,
      thumbBounded: items.every((i) => {
        const img = i.querySelector('img')
        return !img || (img.getBoundingClientRect().width <= 64 && img.getBoundingClientRect().height <= 64)
      })
    }
  })
  check('combobox aria-expanded=true while open', sug.expanded === 'true', String(sug.expanded))
  check('aria-controls points at listbox', !!sug.controls, sug.controls || 'missing')
  check('role=combobox + listbox present', sug.role === 'combobox' && sug.listbox)
  check('meal suggestions loaded (>0)', sug.options > 0, `options=${sug.options} names=${sug.names.join('; ')}`)
  check('"See all results" row present', sug.hasAll)
  check('suggestion thumbs bounded <=64px', sug.thumbBounded)
  await page.keyboard.press('ArrowDown')
  const active = await page.evaluate(() => {
    const input = document.querySelector('.search-input')
    const id = input.getAttribute('aria-activedescendant')
    const el = id ? document.getElementById(id) : null
    return { id, selected: el?.getAttribute('aria-selected'), activeClass: el?.classList.contains('is-active') }
  })
  check('ArrowDown sets aria-activedescendant + active option', !!active.id && active.selected === 'true' && active.activeClass, JSON.stringify(active))
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => /\/meal\/\d+/.test(location.pathname), { timeout: 10000 })
  check('Enter navigates to meal details', /\/meal\/\d+/.test(new URL(page.url()).pathname), page.url())
  // Escape closes panel
  await go(page, '/explore', '.search-input')
  await waitForSplash(page)
  await page.click('.search-input')
  await page.type('.search-input', 'pasta', { delay: 40 })
  await page.waitForSelector('.search-suggest-item', { timeout: 8000 })
  await page.keyboard.press('Escape')
  const closed = await page.evaluate(() => {
    const panel = document.querySelector('.search-suggestions')
    return !panel || getComputedStyle(panel).display === 'none' || panel.getBoundingClientRect().height === 0
  })
  check('Escape closes suggestion panel', closed)
} catch (err) {
  check('suggestion panel loads', false, err.message)
}

// ---------- 4. SEARCH RESULTS (uncapped, not paginated) ----------
currentSection = 'search'
await go(page, '/search?q=chicken', '.meal-card')
const search = await page.evaluate(() => ({
  count: document.querySelectorAll('main .meal-card').length,
  unique: new Set([...document.querySelectorAll('main .meal-card a')].map((a) => a.getAttribute('href'))).size,
  sentinel: !!document.querySelector('.grid-sentinel'),
  end: !!document.querySelector('.grid-status-msg--end')
}))
check('search results rendered (uncapped)', search.count > 8, `count=${search.count}`)
check('search results all unique', search.unique === search.count, `unique=${search.unique} count=${search.count}`)
check('search results not paginated', !search.sentinel && !search.end, `sentinel=${search.sentinel} end=${search.end}`)

// ---------- 5. DISCOVER (explore) card spacing ----------
currentSection = 'discover'
await go(page, '/explore', '.explore-results .meal-card')
const explore = await page.evaluate(() => {
  const grid = document.querySelector('.explore-results .meal-grid')
  const cs = getComputedStyle(grid)
  const cards = [...grid.querySelectorAll('.meal-card')]
  const rects = cards.map((c) => c.getBoundingClientRect())
  const gaps = rects.slice(1).map((r, i) => Math.round(r.left - (rects[i].left + rects[i].width)))
  const imgOverflow = cards.filter((c) => {
    const img = c.querySelector('.meal-card-media, img')
    if (!img) return false
    const a = c.getBoundingClientRect()
    const b = img.getBoundingClientRect()
    return b.right > a.right + 1 || b.left < a.left - 1 || b.bottom > a.bottom + 1
  }).length
  return {
    gap: cs.columnGap,
    minWidth: Math.min(...rects.map((r) => Math.round(r.width))),
    maxWidth: Math.max(...rects.map((r) => Math.round(r.width))),
    gapValues: [...new Set(gaps)],
    imgOverflow,
    count: cards.length
  }
})
check('discover grid gap >= 14px', parseFloat(explore.gap) >= 14, explore.gap)
check('discover card min width >= 180px (4 columns)', explore.minWidth >= 180, `min=${explore.minWidth} max=${explore.maxWidth}`)
check('discover card widths consistent (max-min <= 8)', explore.maxWidth - explore.minWidth <= 8, `min=${explore.minWidth} max=${explore.maxWidth}`)
check('discover images bounded by cards', explore.imgOverflow === 0, `overflowing=${explore.imgOverflow}`)
check('unfiltered discover has no infinite sentinel', !(await page.$('.grid-sentinel')))
await greenScan(page, 'discover')

// ---------- 6. CATEGORY + EXPLORE INFINITE SCROLL ----------
const apiCount = (cat) =>
  fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`)
    .then((r) => r.json())
    .then((d) => (d.meals || []).length)
const pastaTotal = await apiCount('Pasta')
const beefTotal = await apiCount('Beef')

const gridState = (scopeSel) =>
  page.evaluate((scope) => {
    const root = document.querySelector(scope) || document
    const cards = [...root.querySelectorAll('.meal-card')]
    const imgs = [...root.querySelectorAll('.meal-card-img')]
    return {
      count: cards.length,
      ids: cards.map((c) => c.querySelector('a')?.getAttribute('href')),
      unique: new Set(cards.map((c) => c.querySelector('a')?.getAttribute('href'))).size,
      sentinel: !!root.querySelector('.grid-sentinel'),
      statusText: [...root.querySelectorAll('.grid-status-msg')].map((e) => e.textContent.trim()).join('|'),
      endMessage: root.querySelector('.grid-status-msg--end')?.textContent.trim() || '',
      eagerFlags: imgs.slice(0, 6).map((i) => `${i.getAttribute('loading')}/${i.getAttribute('fetchpriority')}`),
      lazyFlags: imgs.slice(6).map((i) => i.getAttribute('loading')),
      dims: imgs.every((i) => i.getAttribute('width') === '680' && i.getAttribute('height') === '510'),
      y: Math.round(window.scrollY)
    }
  }, scopeSel)

await page.setViewport({ width: 1280, height: 900 })
currentSection = 'category-infinite'
await go(page, '/categories/Pasta', '.meal-card')
await waitForSplash(page)
await new Promise((r) => setTimeout(r, 500))
const p1 = await gridState('main')
check(`category: initial batch is exactly 8 (of ${pastaTotal})`, p1.count === 8, `count=${p1.count}`)
check('category: initial state has sentinel and no messages', p1.sentinel && !p1.statusText && !p1.endMessage, `status="${p1.statusText}" end="${p1.endMessage}"`)
check('category: first 6 images eager + high priority', p1.eagerFlags.length === 6 && p1.eagerFlags.every((v) => v === 'eager/high'), p1.eagerFlags.join(','))
check('category: off-screen images lazy', p1.lazyFlags.every((v) => v === 'lazy'), p1.lazyFlags.join(','))
check('category: image dimension attrs 680x510', p1.dims, '')

await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForFunction(
  () => /end of this category/i.test(document.querySelector('.grid-status-msg--end')?.textContent || ''),
  { timeout: 10000 }
)
const p2 = await gridState('main')
check(`category: all ${pastaTotal} meals revealed after scrolling`, p2.count === pastaTotal && p2.unique === pastaTotal, `count=${p2.count} unique=${p2.unique}`)
check('category: end message shown', /end of this category/i.test(p2.endMessage), p2.endMessage)
check('category: sentinel removed at the end', !p2.sentinel)
check('category: loading indicator gone at the end', !/Loading more/i.test(p2.statusText), p2.statusText)
check('category: scroll position kept while appending', p2.y > 0, `y=${p2.y}`)
const pastaRequests = await page.evaluate(() =>
  performance.getEntriesByType('resource').filter((e) => /filter\.php\?.*c=pasta/i.test(e.name)).length
)
check('category: data fetched once, not per batch', pastaRequests === 1, `requests=${pastaRequests}`)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await new Promise((r) => setTimeout(r, 800))
const p3 = await gridState('main')
check('category: no extra loads once ended', p3.count === pastaTotal && !p3.sentinel, `count=${p3.count}`)

// Long category: batches of 8, rapid scrolling stays deduped
await go(page, '/categories/Seafood', '.meal-card')
await waitForSplash(page)
await new Promise((r) => setTimeout(r, 500))
const s1 = await gridState('main')
check('long category: initial batch is 8', s1.count === 8, `count=${s1.count}`)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForFunction((n) => document.querySelectorAll('main .meal-card').length > n, { timeout: 10000 }, s1.count)
await new Promise((r) => setTimeout(r, 600))
const s2 = await gridState('main')
check('long category: next batch appears in multiples of 8', s2.count > s1.count && (s2.count - s1.count) % 8 === 0, `count=${s2.count} growth=${s2.count - s1.count}`)
check('long category: earlier cards preserved', s2.ids.slice(0, s1.count).join(',') === s1.ids.join(','), '')
await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight)
  window.scrollTo(0, document.documentElement.scrollHeight)
})
await new Promise((r) => setTimeout(r, 1400))
const s3 = await gridState('main')
check('long category: rapid scrolling keeps cards unique', s3.unique === s3.count, `unique=${s3.unique} count=${s3.count}`)
check('long category: still progressive, not all 84 at once', s3.count < 84 && s3.count % 8 === 0, `count=${s3.count}`)

// Short category: all meals, no indicator / end message
currentSection = 'category-short'
await go(page, '/categories/Vegan', '.meal-card')
await waitForSplash(page)
await new Promise((r) => setTimeout(r, 500))
const v1 = await gridState('main')
check('short category: all 7 meals rendered', v1.count === 7, `count=${v1.count}`)
check('short category: no indicator, sentinel or end message', !v1.sentinel && !v1.statusText && !v1.endMessage, `status="${v1.statusText}" end="${v1.endMessage}"`)

// Explore: filters use the same progressive grid and reset on switch
currentSection = 'explore-infinite'
await go(page, '/explore?category=Pasta', '.explore-results .meal-card')
await waitForSplash(page)
await page.waitForFunction(() => /^8 of 12 meals$/.test(document.querySelector('.results-count')?.textContent.trim() || ''), { timeout: 15000 })
const e1 = await page.evaluate(() => ({
  count: document.querySelectorAll('.explore-results .meal-card').length,
  countText: document.querySelector('.results-count')?.textContent.trim() || '',
  sentinel: !!document.querySelector('.explore-results .grid-sentinel')
}))
check('explore filter: 8 initial + progress text', e1.count === 8 && e1.sentinel, `count=${e1.count} text="${e1.countText}"`)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForFunction(() => /^12 of 12 meals$/.test(document.querySelector('.results-count')?.textContent.trim() || ''), { timeout: 10000 })
const e2 = await page.evaluate(() => ({
  count: document.querySelectorAll('.explore-results .meal-card').length,
  end: !!document.querySelector('.explore-results .grid-status-msg--end')
}))
check('explore filter: scrolling reaches the end (12 of 12)', e2.count === 12 && e2.end, `count=${e2.count} end=${e2.end}`)
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise((r) => setTimeout(r, 250))
await page.waitForFunction(
  () => [...document.querySelectorAll('.filter-options label')].some((l) => /^Beef$/.test(l.textContent.trim())),
  { timeout: 10000 }
)
await page.evaluate(() => {
  const label = [...document.querySelectorAll('.filter-options label')].find((l) => /^Beef$/.test(l.textContent.trim()))
  label?.querySelector('input')?.click()
})
await page.waitForFunction(() => new URLSearchParams(location.search).get('category') === 'Beef', { timeout: 10000 })
await page.waitForFunction(
  (total) => document.querySelector('.results-count')?.textContent.trim() === `8 of ${total} meals`,
  { timeout: 15000 },
  beefTotal
)
const e3 = await page.evaluate(() => ({
  count: document.querySelectorAll('.explore-results .meal-card').length,
  countText: document.querySelector('.results-count')?.textContent.trim() || '',
  end: !!document.querySelector('.explore-results .grid-status-msg--end')
}))
check('explore filter switch resets to first batch', e3.count === 8 && !e3.end, `count=${e3.count} end=${e3.end}`)
check('explore filter switch updates totals', new RegExp(`^8 of ${beefTotal} meals$`).test(e3.countText), e3.countText)

// ---------- 7. MEAL DETAILS two-column ----------
currentSection = 'meal-details'
const mealRes = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=chicken').then((r) => r.json())
const mealId = mealRes.meals[0].idMeal
await go(page, `/meal/${mealId}`, '.meal-detail-layout')
await page.waitForSelector('.meal-detail-title', { timeout: 15000 })
const md = await page.evaluate(() => {
  const layout = document.querySelector('.meal-detail-layout')
  const media = document.querySelector('.meal-detail-media')
  const img = document.querySelector('.meal-detail-img')
  const panels = [...document.querySelectorAll('.meal-detail-content .recipe-panel')]
  const lr = layout.getBoundingClientRect()
  const ir = img.getBoundingClientRect()
  return {
    layoutTag: layout.tagName,
    cols: getComputedStyle(layout).gridTemplateColumns.split(' ').length,
    mediaTag: media.tagName,
    imgRatio: +(ir.height / ir.width).toFixed(2),
    panelOrder: panels.map((p) => (p.querySelector('h2')?.textContent || '').trim()),
    zoomBadge: !!document.querySelector('.meal-detail-zoom'),
    heroActions: [...document.querySelectorAll('.meal-detail-actions .button')].map((b) => b.textContent.trim()),
    h1s: document.querySelectorAll('h1').length,
    layoutTop: Math.round(lr.top)
  }
})
check('layout is a container div with grid', md.layoutTag === 'DIV' && md.cols >= 2, `tag=${md.layoutTag} cols=${md.cols}`)
check('media element is a <button> (zoom)', md.mediaTag === 'BUTTON', md.mediaTag)
check('desktop image aspect ~4:3', Math.abs(md.imgRatio - 0.75) < 0.06, `ratio=${md.imgRatio}`)
check('ingredients panel before instructions', /ingredient/i.test(md.panelOrder[0] || '') && /instruction/i.test(md.panelOrder[1] || ''), md.panelOrder.join(' > '))
check('zoom badge present', md.zoomBadge)
check('hero actions: Start cooking / Save / Surprise me', md.heroActions.join('|').includes('Start cooking') && md.heroActions.join('|').includes('Save') && md.heroActions.join('|').includes('Surprise me'), md.heroActions.join(','))
check('single h1 on meal page', md.h1s === 1, String(md.h1s))
// image viewer
await waitForSplash(page)
await page.click('.meal-detail-media')
await page.waitForSelector('.image-viewer[role], .image-viewer .image-viewer-inner', { timeout: 5000 })
const viewerOpen = await page.evaluate(() => {
  const v = document.querySelector('.image-viewer')
  const dialog = v?.querySelector('[role="dialog"]')
  return { visible: !!v && v.getBoundingClientRect().height > 100, modal: dialog?.getAttribute('aria-modal'), focus: document.activeElement?.className || '' }
})
check('image viewer opens as modal dialog', viewerOpen.visible && viewerOpen.modal === 'true', JSON.stringify(viewerOpen))
await page.keyboard.press('Escape')
await page.waitForFunction(() => !document.querySelector('.image-viewer'), { timeout: 5000 })
check('Escape closes image viewer', true)
await greenScan(page, 'meal-details')
await a11yButtons(page, 'meal-details')
// mobile layout
await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.meal-detail-img', { timeout: 15000 })
await page.waitForSelector('.meal-detail-content .recipe-panel', { timeout: 15000 })
const mdMobile = await page.evaluate(() => {
  const layout = document.querySelector('.meal-detail-layout')
  const img = document.querySelector('.meal-detail-img')
  const ir = img.getBoundingClientRect()
  const hero = document.querySelector('.meal-detail-hero').getBoundingClientRect()
  const content = document.querySelector('.meal-detail-content').getBoundingClientRect()
  return {
    cols: getComputedStyle(layout).gridTemplateColumns.split(' ').length,
    imgRatio: +(ir.height / ir.width).toFixed(2),
    stacked: content.top >= hero.bottom - 2
  }
})
check('mobile: single column stack', mdMobile.cols === 1 && mdMobile.stacked, `cols=${mdMobile.cols} stacked=${mdMobile.stacked}`)
check('mobile: image aspect ~16:10', Math.abs(mdMobile.imgRatio - 0.625) < 0.06, `ratio=${mdMobile.imgRatio}`)
await noOverflow(page, 'mobile meal-details')

// ---------- 8. HASH REDIRECTS ----------
currentSection = 'terms-consolidation'
const redirects = [
  ['/about', '#about'],
  ['/privacy', '#privacy'],
  ['/privacy#cookies', '#cookies']
]
for (const [from, hash] of redirects) {
  await page.goto(BASE + from, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => location.pathname === '/terms', { timeout: 10000 })
  await new Promise((r) => setTimeout(r, 600))
  const state = await page.evaluate((h) => ({
    hash: location.hash,
    exists: !!document.getElementById(h.slice(1)),
    top: document.getElementById(h.slice(1))?.getBoundingClientRect().top ?? -999
  }), hash)
  check(`${from} redirects to /terms${hash}`, state.hash === hash && state.exists, `hash=${state.hash} exists=${state.exists}`)
  check(`${from}: target scrolled near top`, state.top >= -10 && state.top < 220, `top=${Math.round(state.top)}`)
}
await go(page, '/terms', '.static-toc')
const terms = await page.evaluate(() => {
  const toc = [...document.querySelectorAll('.static-toc a')].map((a) => a.getAttribute('href'))
  const ids = ['about', 'terms', 'privacy', 'cookies', 'third-party', 'contact']
  const text = document.querySelector('.prose')?.innerText || ''
  return {
    toc,
    missingIds: ids.filter((id) => !document.getElementById(id)),
    h1s: document.querySelectorAll('h1').length,
    hasAbout: /Pikawise was built for anyone/.test(text),
    hasVersion: /You're using Pikawise v|You&/.test(text) || /progressive web app that works offline/.test(text),
    hasTerms: /you agree to these terms/.test(text),
    hasPrivacy: /No account required/.test(text),
    hasCookies: /essential cookies/.test(text),
    hasThirdParty: /Third-party recipe content/.test(text),
    hasContact: /contact the\s+application operator|application operator directly/.test(text),
    tocChipBg: getComputedStyle(document.querySelector('.static-toc a')).backgroundColor
  }
})
check('TOC has all 6 anchors', terms.toc.length === 6 && ['about', 'terms', 'privacy', 'cookies', 'third-party', 'contact'].every((id, i) => terms.toc[i] === `#${id}`), terms.toc.join(','))
check('all section ids exist', terms.missingIds.length === 0, terms.missingIds.join(','))
check('single h1 on terms page', terms.h1s === 1, String(terms.h1s))
for (const [key, label] of [['hasAbout', 'about content'], ['hasTerms', 'terms content'], ['hasPrivacy', 'privacy content'], ['hasCookies', 'cookies content'], ['hasThirdParty', 'third-party content'], ['hasContact', 'contact content'], ['hasVersion', 'version info']]) {
  check(`${label} present`, terms[key], '')
}
await greenScan(page, 'terms')

// ---------- 9. SETTINGS links ----------
currentSection = 'settings'
await go(page, '/settings', '.settings-links')
const settingsLinks = await page.evaluate(() =>
  [...document.querySelectorAll('.settings-links a')].map((a) => `${a.textContent.trim().split('\n')[0]}->${a.getAttribute('href')}`)
)
const joined = settingsLinks.join(' | ')
check('settings: About -> /terms#about', joined.includes('About Pikawise->/terms#about'), joined)
check('settings: Privacy -> /terms#privacy', joined.includes('Privacy Policy->/terms#privacy'), joined)
check('settings: Cookies -> /terms#cookies', joined.includes('Cookies->/terms#cookies'), joined)
await greenScan(page, 'settings')
await a11yButtons(page, 'settings')

// ---------- 10. RANDOM RESULT IMAGE ----------
currentSection = 'random'
await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
await go(page, '/random', '.random-empty h1')
await waitForSplash(page)
await page.click('.random-empty .button--primary')
await page.waitForSelector('.random-result-image-button img', { timeout: 20000 })
await page
  .waitForFunction(() => {
    const img = document.querySelector('.random-result-image-button img')
    return img && img.complete && img.naturalWidth > 0
  }, { timeout: 20000 })
  .catch(() => {})
await new Promise((r) => setTimeout(r, 250))
const randomMobile = await page.evaluate(() => {
  const el = document.querySelector('.random-result-image-button img')
  const rect = el.getBoundingClientRect()
  return { ratio: rect.height / rect.width, width: Math.round(rect.width), height: Math.round(rect.height) }
})
check('random result image is 16:10 on mobile (shorter, like recipe page)', Math.abs(randomMobile.ratio - 0.625) < 0.02, `${randomMobile.width}x${randomMobile.height}`)
await page.setViewport({ width: 1280, height: 900 })
await waitForSplash(page)
await page.waitForSelector('.random-empty h1', { timeout: 10000 })
await page.click('.random-empty .button--primary')
await page.waitForSelector('.random-result-image-button img', { timeout: 20000 })
await page
  .waitForFunction(() => {
    const img = document.querySelector('.random-result-image-button img')
    return img && img.complete && img.naturalWidth > 0
  }, { timeout: 20000 })
  .catch(() => {})
await new Promise((r) => setTimeout(r, 250))
const randomDesktop = await page.evaluate(() => {
  const el = document.querySelector('.random-result-image-button img')
  const rect = el.getBoundingClientRect()
  return { ratio: rect.height / rect.width, width: Math.round(rect.width), height: Math.round(rect.height) }
})
check('random result image is 4:3 on desktop (matches recipe page)', Math.abs(randomDesktop.ratio - 0.75) < 0.02, `${randomDesktop.width}x${randomDesktop.height}`)

// ---------- 10b. FOOTER + header checks on another page, mobile overflow ----------
currentSection = 'responsive'
const overflowPages = ['/', '/explore', '/categories', '/categories/Seafood', '/explore?category=Seafood', '/terms', '/settings', `/meal/${mealId}`]
await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true })
for (const p of overflowPages) {
  await go(page, p, 'main')
  await noOverflow(page, `mobile ${p.split('?')[0]}`)
}
// small phone 320
await page.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true })
for (const p of ['/', '/explore', '/terms']) {
  await go(page, p, 'main')
  await noOverflow(page, `320px ${p}`)
}
// desktop
await page.setViewport({ width: 1280, height: 900 })
for (const p of ['/', '/explore', '/terms']) {
  await go(page, p, 'main')
  await noOverflow(page, `desktop ${p}`)
}

// ---------- 12. NOTIFICATIONS / REMINDERS ----------
currentSection = 'notifications'
await page.setViewport({ width: 1280, height: 900 })
await go(page, '/settings', 'button[aria-label="Meal reminders"]')
await waitForSplash(page)
const permBefore = await page.evaluate(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'))
check('no notification prompt before opt-in', permBefore === 'default', String(permBefore))

await page.click('button[aria-label="Meal reminders"]')
await page.waitForSelector('.reminder-meal input[type="time"]', { timeout: 5000 })
const rem = await page.evaluate(() => {
  const times = [...document.querySelectorAll('.reminder-meal input[type="time"]')].map((i) => ({
    label: i.getAttribute('aria-label'),
    value: i.value
  }))
  const toggles = [...document.querySelectorAll('.reminder-meals input[type="checkbox"]')].slice(0, 6).map((t) => t.checked)
  const master = document.querySelector('button[aria-label="Meal reminders"]')
  const buttons = [...document.querySelectorAll('button')]
  const testBtn = buttons.find((b) => /send test/i.test(b.textContent))
  const limits = document.querySelector('.reminder-limits')?.textContent || ''
  const hints = [...document.querySelectorAll('.settings-hint')].map((p) => p.textContent.trim())
  return {
    enabled: master?.getAttribute('aria-checked'),
    times,
    toggles,
    testBtn: !!testBtn,
    testDisabled: testBtn?.disabled,
    enableHint: hints.find((t) => /enable notifications above/i.test(t)) || '',
    limits,
    days: [...document.querySelectorAll('.settings-chip-row .chip')]
      .filter((c) => /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.test(c.textContent.trim()))
      .map((c) => c.getAttribute('aria-pressed'))
  }
})
const timeMap = Object.fromEntries(rem.times.map((t) => [t.label, t.value]))
check('master reminder switch turns on', rem.enabled === 'true')
check('default breakfast reminder 07:00', timeMap['Breakfast time'] === '07:00', JSON.stringify(timeMap))
check('default lunch reminder 12:30', timeMap['Lunch time'] === '12:30', JSON.stringify(timeMap))
check('default dinner reminder 19:00', timeMap['Dinner time'] === '19:00', JSON.stringify(timeMap))
check('breakfast/lunch/dinner on, snacks off', JSON.stringify(rem.toggles) === '[true,false,true,false,true,false]', JSON.stringify(rem.toggles))
check('all weekdays selected by default', rem.days.length === 7 && rem.days.every((d) => d === 'true'), rem.days.join(','))
check('test notification button present', rem.testBtn)
check('test disabled until permission granted', rem.testDisabled === true && /enable notifications above/i.test(rem.enableHint), `disabled=${rem.testDisabled}`)
check('best-effort + closed-app limitation disclosed', /best effort/i.test(rem.limits) && /closed app|push service/i.test(rem.limits), rem.limits.slice(0, 100))

await page.reload({ waitUntil: 'domcontentloaded' })
await waitForSplash(page)
await page.waitForSelector('button[aria-label="Meal reminders"]', { timeout: 10000 })
const persisted = await page.evaluate(() => ({
  enabled: document.querySelector('button[aria-label="Meal reminders"]')?.getAttribute('aria-checked'),
  stored: (() => {
    try {
      return JSON.parse(localStorage.getItem('chakula_reminders') || 'null')
    } catch {
      return null
    }
  })()
}))
check('reminder settings persist across reload', persisted.enabled === 'true' && persisted.stored?.meals?.lunch?.time === '12:30', `enabled=${persisted.enabled} lunch=${persisted.stored?.meals?.lunch?.time}`)

await page.click('button[aria-label="Meal reminders"]')
await new Promise((r) => setTimeout(r, 400))
const offState = await page.evaluate(() => ({
  enabled: document.querySelector('button[aria-label="Meal reminders"]')?.getAttribute('aria-checked'),
  mealRows: document.querySelectorAll('.reminder-meal').length
}))
check('turning reminders off hides all reminder controls', offState.enabled === 'false' && offState.mealRows === 0, JSON.stringify(offState))
await page.click('button[aria-label="Meal reminders"]')
await page.waitForSelector('.reminder-meal input[type="time"]', { timeout: 5000 })

await browser.defaultBrowserContext().overridePermissions(BASE, ['notifications'])
await page.reload({ waitUntil: 'domcontentloaded' })
await waitForSplash(page)
await page.waitForFunction(() => Notification.permission === 'granted', { timeout: 10000 })
await page.waitForSelector('.reminder-meal input[type="time"]', { timeout: 10000 })
const granted = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const testBtn = buttons.find((b) => /send test/i.test(b.textContent))
  return {
    allowed: [...document.querySelectorAll('.reminder-status')].some((s) => /allowed/i.test(s.textContent)),
    enableCount: buttons.filter((b) => /^Enable$/.test(b.textContent.trim())).length,
    testDisabled: testBtn?.disabled,
    hasNote: !!document.querySelector('.permission-note')
  }
})
check('granted: Allowed status shown, no Enable prompt', granted.allowed && granted.enableCount === 0 && !granted.hasNote, JSON.stringify(granted))
check('granted: test button enabled', granted.testDisabled === false)
await page.evaluate(() => {
  const testBtn = [...document.querySelectorAll('button')].find((b) => /send test/i.test(b.textContent))
  testBtn?.click()
})
try {
  await page.waitForFunction(
    () => [...document.querySelectorAll('.toast')].some((t) => /test notification sent/i.test(t.textContent)),
    { timeout: 10000 }
  )
  check('test notification sends + confirms via toast', true)
} catch (err) {
  check('test notification sends + confirms via toast', false, err.message)
}

await browser.defaultBrowserContext().overridePermissions(BASE, [])
await page.reload({ waitUntil: 'domcontentloaded' })
await waitForSplash(page)
await page.waitForFunction(() => Notification.permission === 'denied', { timeout: 10000 })
await page.waitForSelector('.permission-note', { timeout: 10000 })
const denied = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const testBtn = buttons.find((b) => /send test/i.test(b.textContent))
  return {
    note: document.querySelector('.permission-note')?.textContent || '',
    testDisabled: testBtn?.disabled,
    enableCount: buttons.filter((b) => /^Enable$/.test(b.textContent.trim())).length
  }
})
check('denied: inline explanation with how to enable', /blocked/i.test(denied.note) && /settings|address bar/i.test(denied.note), denied.note.slice(0, 90))
check('denied: no re-prompt button, test disabled', denied.testDisabled === true && denied.enableCount === 0, JSON.stringify(denied))
await browser.defaultBrowserContext().clearPermissionOverrides()

// ---------- 13. DARK MODE ----------
currentSection = 'dark-theme'
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
await go(page, '/', '.header-cta')
const dark = await page.evaluate(() => ({
  cls: document.documentElement.className,
  bg: getComputedStyle(document.documentElement).backgroundColor || getComputedStyle(document.body).backgroundColor,
  meta: document.querySelector('meta[name="theme-color"]')?.content
}))
check('dark theme class applied', /theme-dark/.test(dark.cls), dark.cls)
const darkBg = /rgb\((\d+), (\d+), (\d+)\)/.exec(dark.bg)
check('dark theme background is dark neutral', !!darkBg && +darkBg[1] < 30 && +darkBg[2] < 30 && +darkBg[3] < 30, dark.bg)
check('theme-color meta dark', dark.meta === '#0a0a0a', String(dark.meta))
await greenScan(page, 'dark-theme')
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])

// ---------- 14. Console errors ----------
currentSection = 'console'
const realErrors = consoleErrors.filter((e) => !/favicon|manifest/i.test(e))
check('no console/page errors across session', realErrors.length === 0, realErrors.slice(0, 5).join(' || '))

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n===== ${results.length - failed.length}/${results.length} checks passed =====`)
if (failed.length) {
  console.log('FAILURES:')
  for (const f of failed) console.log(`  - [${f.section}] ${f.name} ${f.detail}`)
  process.exit(1)
}
