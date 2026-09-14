import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const pageErrors = []
page.on('pageerror', (err) => pageErrors.push(err.message))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const check = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) fails++ }

// invalid meal id -> graceful 404 state
await page.goto(BASE + '/meal/99999999', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2500)
let text = await page.evaluate(() => document.body.innerText)
check(text.includes('Meal not found'), 'invalid meal id shows 404 state')
check(text.includes('Back Home'), 'invalid meal offers Back Home button')

// search with results -> meal cards render
await page.goto(BASE + '/search?q=pasta', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2500)
text = await page.evaluate(() => document.body.innerText)
const searchCards = await page.evaluate(() => document.querySelectorAll('main .meal-card').length)
check(searchCards > 0, `search results render meal cards (${searchCards})`)
check(!text.toLowerCase().includes('no meals found'), 'search results do not show empty state')

// search with no results -> empty state
await page.goto(BASE + '/search?q=zzzzzznothing', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2500)
text = await page.evaluate(() => document.body.innerText)
check(text.includes('No meals found'), 'empty search shows empty state')
check(text.includes('Try another ingredient'), 'empty search shows helpful message')

// category detail route
await page.goto(BASE + '/categories/seafood', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2500)
text = await page.evaluate(() => document.body.innerText)
check(/Seafood/.test(text) || /Meals in this category/.test(text), 'category detail page loads')
const cards = await page.evaluate(() => document.querySelectorAll('.meal-card').length)
check(cards > 0, `category meal grid populated (${cards})`)

// 404 route
await page.goto(BASE + '/nope', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1000)
text = await page.evaluate(() => document.body.innerText)
check(text.includes('Meal not found') && text.includes('Back Home'), 'unknown route shows 404')

// theme toggle works
await page.goto(BASE + '/settings', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1500)
await page.evaluate(() => { const btns = document.querySelectorAll('.segmented-btn'); [...btns].find(b => b.textContent.trim() === 'Dark').click() })
await sleep(500)
const isDark = await page.evaluate(() => document.documentElement.classList.contains('theme-dark'))
check(isDark, 'theme toggle switches to dark')

console.log('\nPage errors:', pageErrors.length ? pageErrors.join(' | ') : 'none')
console.log('Failures:', fails)
await browser.close()
process.exit(fails > 0 ? 1 : 0)