import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:5173'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
})

const errors = []
const page = await browser.newPage()
page.on('pageerror', (err) => errors.push(err.message))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const check = (cond, label) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) fails++
}

// ---- Mobile viewport ----
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 45000 })
await sleep(2000)

// bottom nav visible
const bottomNav = await page.$('.bottom-nav')
check(Boolean(bottomNav), 'bottom nav present on mobile')
check((await page.$eval('.bottom-nav', (el) => getComputedStyle(el).display)) !== 'none', 'bottom nav visible')

// hamburger opens menu
await page.click('.menu-toggle')
await sleep(600)
check(Boolean(await page.$('.mobile-menu')), 'mobile menu opens')
check((await page.$$('.mobile-menu-link')).length >= 7, 'mobile menu has 7 links')
await page.keyboard.press('Escape')
await sleep(400)
check(!(await page.$('.mobile-menu')), 'Escape closes menu')

// navigate via bottom nav to Explore
await page.evaluate(() => { document.querySelectorAll('.bottom-nav-link')[1].click() })
await sleep(2500)
check(page.url().includes('/explore'), 'bottom nav navigates to /explore')
check(Boolean(await page.$('.explore-filters')), 'explore filters sidebar exists')

// filters toggle on mobile
const filtersBtn = await page.$('.button--filters')
check(Boolean(filtersBtn), 'mobile filters button present')
await page.click('.button--filters')
await sleep(400)
check((await page.$eval('.explore-filters', (el) => el.classList.contains('explore-filters--open'))), 'filters panel opens')

// ---- Meal detail flow ----
await page.goto(BASE + '/meal/52772', { waitUntil: 'networkidle2', timeout: 45000 })
await sleep(2500)
const mealTitle = await page.evaluate(() => document.querySelector('.meal-detail-title')?.textContent)
check(Boolean(mealTitle), `meal detail loads: "${mealTitle}"`)
const ingCount = await page.evaluate(() => document.querySelectorAll('.ingredient-item').length)
check(ingCount > 0, `ingredients list rendered (${ingCount} items)`)

// ---- Meal detail actions ----
const shareBtn = await page.$('.meal-detail-actions .button--secondary')
check(Boolean(shareBtn), 'meal detail actions render (Share)')

// ---- Random meal flow ----
await page.goto(BASE + '/random', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
await page.evaluate(() => { const btns = document.querySelectorAll('.random-empty button'); if (btns[0]) btns[0].click() })
await sleep(3000)
const randomTitle = await page.evaluate(() => document.querySelector('.random-result-title')?.textContent)
check(Boolean(randomTitle), `random meal discovered: "${randomTitle}"`)

// ---- Search flow ----
await page.goto(BASE + '/search', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
await page.type('.search-input', 'pasta')
await page.keyboard.press('Enter')
await sleep(2500)
check(page.url().includes('q=pasta'), 'search reflected in URL')
const searchText = await page.evaluate(() => document.body.innerText)
check(searchText.includes('meals found') || /pasta/i.test(searchText), `search results rendered`)

console.log('\nPage errors:', errors.length ? errors.join(' | ') : 'none')
console.log('Failures:', fails)
await browser.close()
process.exit(fails > 0 || errors.length > 0 ? 1 : 0)