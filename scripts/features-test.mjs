import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:4173'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 375, height: 812 })
const pageErrors = []
const consoleErrors = []
page.on('pageerror', (e) => {
  pageErrors.push(`${e.message} @ line:${e.stack ? e.stack.split('\n')[1] : '?'}`)
  console.log('PAGE ERROR STACK:', e.stack || e.message)
})
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0

const ok = (cond, label) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) failures++
}

async function noHorizontalOverflow(label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(overflow <= 1, `${label} — no horizontal overflow (delta ${overflow})`)
}

// 1. Fresh profile → onboarding appears; complete it
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 45000 })
await sleep(1500)
let text = await page.evaluate(() => document.body.innerText)
ok(text.includes('Pikawise') || text.includes('Meal'), 'home shows content')
ok(await page.$('.onboarding') !== null, 'onboarding appears on first launch')

const clickByText = async (selector, needle) => {
  const clicked = await page.evaluate(([sel, n]) => {
    const els = Array.from(document.querySelectorAll(sel))
    const el = els.find((e) => e.textContent.trim().startsWith(n))
    if (el) { el.click(); return true }
    return false
  }, [selector, needle])
  return clicked
}
await clickByText('.onboarding-actions button', 'Get Started')
await sleep(400)
await clickByText('.onboarding-actions button', 'Continue')
await sleep(400)
await clickByText('.onboarding-actions button', 'Done')
await sleep(600)
ok(await page.$('.onboarding') === null, 'onboarding dismisses after completing')

// 2. Home quick actions
text = await page.evaluate(() => document.body.innerText)
ok(text.includes('What food do you have?'), 'home shows use-food card')
ok(text.includes('Meal Plans') && text.includes('Shopping List'), 'home shows quick actions')

// 3. Balanced Diet landing + wide widths
for (const width of [320, 375, 768, 1024, 1440]) {
  await page.setViewport({ width, height: 812 })
  await page.goto(BASE + '/balanced-diet?focus=ingredients&ingredients=chicken,rice', { waitUntil: 'networkidle2', timeout: 45000 })
  await sleep(1800)
  text = await page.evaluate(() => document.body.innerText)
  ok(text.includes('Eat Better, One Meal at a Time'), `balanced-diet hero @ ${width}px`)
  ok(await page.$('#what-do-you-have') !== null, `ingredients panel present @ ${width}px`)
  await noHorizontalOverflow(`balanced-diet @ ${width}px`)
}

// 4. Generate a plan
await page.setViewport({ width: 375, height: 812 })
await page.goto(BASE + '/balanced-diet?ingredients=chicken,rice', { waitUntil: 'networkidle2', timeout: 45000 })
await sleep(1500)
text = await page.evaluate(() => document.body.innerText)
ok(text.includes('Chicken') && text.includes('Rice'), 'query ingredients prefilled as chips')
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Generate My Meal Plan'))
  btn.click()
})
await sleep(500)
ok(await page.$('.plan-loading') !== null, 'shows generation loading state')
try {
  await page.waitForSelector('.plan-summary', { timeout: 90000 })
  ok(true, 'plan generated')
} catch {
  ok(false, 'plan generated (timeout)')
}
text = await page.evaluate(() => document.body.innerText)
ok(/Your \d+-Day Meal Plan/.test(text), 'plan summary shown')
const mealCount = await page.evaluate(() => document.querySelectorAll('.plan-meal-slot').length)
ok(mealCount >= 3, `plan contains day slots (${mealCount})`)
const balanceText = await page.evaluate(() => document.body.innerText)
ok(balanceText.includes('Shopping List'), 'shopping list shown in results')

// 5. Save the plan
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.plan-actions button')).find((b) => b.textContent.includes('Save Plan'))
  btn.click()
})
await sleep(800)
const savedCount = await page.evaluate(() => JSON.parse(localStorage.getItem('chakula_meal_plans') || '[]').length)
ok(savedCount >= 1, 'plan saved to localStorage')

// 6. Meal plans + shopping list pages
await page.goto(BASE + '/meal-plans', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1500)
text = await page.evaluate(() => document.body.innerText)
ok(text.includes('Your Saved Plans') && text.includes('saved plan'), 'meal-plans lists saved plans')
await page.evaluate(() => {
  const toggle = document.querySelector('.saved-plan-toggle')
  if (toggle) toggle.click()
})
await sleep(800)
ok(await page.$('.saved-plan-detail') !== null, 'saved plan expands with detail')
ok(await page.$('.shopping-panel') !== null, 'saved plan includes shopping list')

await page.goto(BASE + '/shopping-list', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1500)
ok(await page.$('.shopping-panel') !== null, 'shopping-list page shows interactive panel')
const checksBefore = await page.evaluate(() => JSON.stringify(localStorage.getItem('chakula_shopping_checks')))
await page.evaluate(() => {
  const cb = document.querySelector('.shopping-panel input[type="checkbox"]')
  if (cb) cb.click()
})
await sleep(700)
const checksAfter = await page.evaluate(() => JSON.stringify(localStorage.getItem('chakula_shopping_checks')))
ok(checksAfter !== checksBefore, 'shopping check-off persists')

// 7. Developer page
await page.goto(BASE + '/developer', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1200)
text = await page.evaluate(() => document.body.innerText)
ok(text.includes('Built by Alpha Odiero') && text.includes('Software Engineer'), 'developer page renders profile')

// 8. Settings: dark theme + confirm dialog
await page.goto(BASE + '/settings', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(1200)
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.segmented-btn')).find((b) => b.textContent.trim().startsWith('Dark'))
  btn.click()
})
await sleep(600)
const darkActive = await page.evaluate(() => document.documentElement.classList.contains('theme-dark'))
ok(darkActive, 'dark theme applies')
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.settings-row .button--secondary')).find((b) => b.textContent.trim() === 'Reset')
  if (btn) btn.click()
})
await sleep(500)
ok(await page.$('.confirm-dialog') !== null, 'settings confirm dialog opens')
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.confirm-actions button')).find((b) => b.textContent.includes('Cancel'))
  btn.click()
})

// 9. No-overflow sweep on key pages at several widths
for (const width of [320, 375, 414, 768, 1024, 1440]) {
  for (const route of ['/', '/balanced-diet', '/meal-plans', '/shopping-list', '/settings', '/developer', '/about']) {
    await page.setViewport({ width, height: 812 })
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(900)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 1) {
      ok(false, `${route} @ ${width}px overflow ${overflow}px`)
    }
  }
}
ok(true, 'width sweep complete (see above for failures)')

console.log('\nPage errors:', pageErrors.length ? pageErrors.join(' | ') : 'none')
console.log('Console errors:', consoleErrors.length ? consoleErrors.join(' | ') : 'none')
console.log('Failures:', failures)
await browser.close()
process.exit(failures > 0 ? 1 : 0)