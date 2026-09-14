import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
})

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const pageErrors = []
const consoleErrors = []
page.on('pageerror', (err) => pageErrors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('net::ERR_INTERNET_DISCONNECTED') && !msg.text().includes('Fetch failed'))
    consoleErrors.push(msg.text())
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const check = (cond, label) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`)
  if (!cond) fails++
}

// 1. manifest served as valid JSON
const manifestResp = await page.goto(BASE + '/manifest.webmanifest', { timeout: 10000 })
check(manifestResp.status() === 200, 'manifest served')
const manifestJson = await manifestResp.json()
check(manifestJson.name === 'Chakula', 'manifest name')
check(manifestJson.display === 'standalone', 'manifest display: standalone')
check(manifestJson.display === 'standalone' && manifestJson.start_url === '/', 'manifest start_url')

// 2. load main page
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(2500)
const heroText = await page.evaluate(() => document.body.innerText)
check(heroText.includes('Discover Your Next Meal'), 'production: hero renders')

// 3. SW registered
const swReady = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false
  try { await navigator.serviceWorker.ready; return true } catch { return false }
})
check(swReady, 'service worker registered in production')

// 4. offline: navigate to a static page (from precache)
await page.evaluate(async () => {
  const regs = await navigator.serviceWorker.getRegistrations()
  if (regs.length && regs[0].active) {
    // simulate offline via devtools protocol
  }
})
// Use CDP to go offline
const client = await page.createCDPSession()
await client.send('Network.enable')
await client.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
await sleep(500)

await page.goto(BASE + '/about', { waitUntil: 'networkidle2', timeout: 20000 })
await sleep(2000)
const aboutContent = await page.evaluate(() => document.body.innerText)
check(aboutContent.includes('About Chakula'), 'about page loads offline')

await page.goto(BASE + '/settings', { waitUntil: 'networkidle2', timeout: 20000 })
await sleep(1500)
const settingsContent = await page.evaluate(() => document.body.innerText)
check(settingsContent.includes('Settings'), 'settings page loads offline')

// 5. restore network
await client.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
await client.detach()

console.log('\nPage errors:', pageErrors.length ? pageErrors.join(' | ') : 'none')
console.log('Console errors:', consoleErrors.length ? consoleErrors.slice(0, 5).join(' | ') : 'none')
console.log('Failures:', fails)
await browser.close()
process.exit(fails > 0 ? 1 : 0)