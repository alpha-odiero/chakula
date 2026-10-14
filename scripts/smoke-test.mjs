import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:5173'

const routes = [
  ['/', 'Discover Your Next Meal'],
  ['/explore', 'Discover meals'],
  ['/search?q=chicken', 'Search results for "chicken"'],
  ['/categories', 'Browse by category'],
  ['/meal/52772', null],
  ['/random', 'Feeling hungry'],
  ['/settings', 'Settings'],
  ['/about', 'About Pikawise'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms'],
  ['/does-not-exist', 'Meal not found']
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
})

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const consoleErrors = []
const pageErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(`[console] ${msg.text()}`)
})
page.on('pageerror', (err) => pageErrors.push(`[pageerror] ${err.message}`))

let failures = 0
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
for (const [route, expect] of routes) {
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 45000 })
    await sleep(1500)
    const bodyText = await page.evaluate(() => document.body.innerText)
    const title = await page.title()

    if (expect) {
      const found = bodyText.includes(expect) || title.includes(expect)
      console.log(`${found ? 'PASS' : 'FAIL'}  ${route}  (expect "${expect}")`)
      if (!found) failures++
    } else {
      const nonEmpty = bodyText.trim().length > 80
      console.log(`${nonEmpty ? 'PASS' : 'FAIL'}  ${route}  (content loaded)`)
      if (!nonEmpty) failures++
    }
  } catch (error) {
    console.log(`FAIL  ${route}  (${error.message})`)
    failures++
  }
}

console.log('\nConsole errors:', consoleErrors.length ? consoleErrors.join('\n') : 'none')
console.log('Page errors:', pageErrors.length ? pageErrors.join('\n') : 'none')
console.log('Failures:', failures)
await browser.close()
process.exit(failures > 0 ? 1 : 0)