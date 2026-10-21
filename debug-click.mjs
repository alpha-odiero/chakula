import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
})
const page = await browser.newPage()
page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))
await page.setViewport({ width: 1024, height: 800 })
await page.goto('http://127.0.0.1:4173/')
await new Promise((r) => setTimeout(r, 600))

const info = await page.evaluate(async () => {
  const btn = document.querySelector('.header-cta')
  if (!btn) return { btnExists: false }
  btn.click()
  await new Promise((r) => setTimeout(r, 400))
  const modal = document.querySelector('.install-guide')
  const confirm = document.querySelector('.confirm-dialog')
  return {
    btnExists: true,
    btnDisabled: btn.disabled,
    modalExists: Boolean(modal),
    confirmExists: Boolean(confirm),
    guideHTML: modal ? modal.outerHTML.slice(0, 200) : null
  }
})

console.log('Result:', info)
await browser.close()
