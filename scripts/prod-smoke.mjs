import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0

const routes = [
  ['/', 'main content'],
  ['/explore', 'main content'],
  ['/search?q=chicken', 'Search results'],
  ['/categories', 'Seafood'],
  ['/categories/seafood', 'Meals in this category'],
  ['/meal/52772', 'Teriyaki Chicken Casserole'],
  ['/random', 'main content'],
  ['/balanced-diet', 'Balanced Diet'],
  ['/settings', 'Appearance'],
  ['/about', 'About'],
  ['/privacy', 'Privacy'],
  ['/terms', 'Terms'],
  ['/nope', 'Back Home']
]

for (const [route, required] of routes) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 })
  await sleep(3000)
  const text = await page.evaluate(() => document.body.innerText)
  const ok = required !== 'main content' ? text.includes(required) : text.length > 200
  if (required !== 'main content' && route === '/search?q=chicken') {
    if (text.includes('No meals found')) console.log('FAIL  /search?q=chicken (shows empty state instead of results)') && failures++
  }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${route}${ok ? '' : ` (missing "${required}")`}`)
  if (!ok) failures++
}
console.log('\nPage errors:', pageErrors.length ? pageErrors.join(' | ') : 'none')
console.log('Failures:', failures)
await browser.close()
process.exit(failures > 0 ? 1 : 0)