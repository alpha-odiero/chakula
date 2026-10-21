import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:4173'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function runTests() {
  console.log('--- Launching Chrome Puppeteer ---')
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  })

  const page = await browser.newPage()

  // Setup initial storage to avoid onboarding blocking tests
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      'chakula_preferences',
      JSON.stringify({ onboarded: true, mealsPerDay: 3, cookingTime: 'any' })
    )
    localStorage.setItem('chakula_cookie_consent', 'accepted')
  })

  const results = []
  function test(name, pass, detail = '') {
    results.push({ name, pass, detail })
    console.log(`${pass ? 'PASS' : 'FAIL'}: ${name} ${detail ? '(' + detail + ')' : ''}`)
  }

  try {
    // ==========================================
    // 1. FOOTER TESTS (320px, 360px, 375px, 390px, 768px, 1280px)
    // ==========================================
    console.log('\n--- 1. Testing Footer Responsive Layout ---')
    const widths = [320, 360, 375, 390, 768, 1280]

    for (const w of widths) {
      await page.setViewport({ width: w, height: 800 })
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
      await sleep(600)

      const footerInfo = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth
        const vw = window.innerWidth
        const overflow = docW - vw

        const footer = document.querySelector('.site-footer')
        if (!footer) return { exists: false, overflow }

        const links = Array.from(footer.querySelectorAll('.footer-col a'))
        const minHeight = links.reduce((min, a) => Math.min(min, a.getBoundingClientRect().height), 999)

        const innerGrid = footer.querySelector('.footer-inner')
        const innerCols = innerGrid
          ? window.getComputedStyle(innerGrid).gridTemplateColumns.split(' ').length
          : 0

        const storeButtons = footer.querySelector('.store-buttons')
        const storeCols = storeButtons
          ? window.getComputedStyle(storeButtons).gridTemplateColumns.split(' ').length
          : 0

        return {
          exists: true,
          overflow,
          minLinkHeight: minHeight,
          innerCols,
          storeCols
        }
      })

      test(`Footer renders at ${w}px`, footerInfo.exists)
      test(`Footer no overflow at ${w}px`, footerInfo.overflow <= 1, `docW - vw = ${footerInfo.overflow}`)
      if (w <= 400) {
        test(`Footer links comfortable touch target at ${w}px`, footerInfo.minLinkHeight >= 40, `minHeight: ${footerInfo.minLinkHeight}px`)
      }
    }

    // ==========================================
    // 2. DISCOVER MEALS GRID TESTS (4 COLUMNS ON DESKTOP)
    // ==========================================
    console.log('\n--- 2. Testing Discover Meals Grid ---')
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' })
    try {
      await page.waitForSelector('.meal-card', { timeout: 15000 })
    } catch {
      // API fallback
    }

    const desktopGrid = await page.evaluate(() => {
      const grid = document.querySelector('.explore-results .meal-grid')
      if (!grid) return null
      const cs = window.getComputedStyle(grid)
      const cols = cs.gridTemplateColumns.split(' ').length
      const cards = Array.from(grid.querySelectorAll('.meal-card'))
      const cardWidths = cards.slice(0, 4).map((c) => Math.round(c.getBoundingClientRect().width))
      return { cols, cardCount: cards.length, cardWidths }
    })

    test('Discover Meals renders meals', desktopGrid && desktopGrid.cardCount >= 4, `cards: ${desktopGrid?.cardCount}`)
    test('Discover Meals has 4 columns on desktop (1280px)', desktopGrid && desktopGrid.cols === 4, `cols: ${desktopGrid?.cols}`)
    if (desktopGrid && desktopGrid.cardWidths.length >= 4) {
      const diff = Math.max(...desktopGrid.cardWidths) - Math.min(...desktopGrid.cardWidths)
      test('4 desktop columns are equal width', diff <= 2, `widths: ${desktopGrid.cardWidths.join(', ')}`)
    }

    // Tablet check at 950px
    await page.setViewport({ width: 950, height: 800 })
    await sleep(300)
    const tabletGrid = await page.evaluate(() => {
      const grid = document.querySelector('.explore-results .meal-grid')
      if (!grid) return null
      const cols = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length
      return { cols }
    })
    test('Discover Meals adaptive tablet columns (950px)', tabletGrid && (tabletGrid.cols === 3 || tabletGrid.cols === 2), `cols: ${tabletGrid?.cols}`)

    // Mobile check at 375px
    await page.setViewport({ width: 375, height: 800 })
    await sleep(300)
    const mobileGrid = await page.evaluate(() => {
      const grid = document.querySelector('.explore-results .meal-grid')
      if (!grid) return null
      const cols = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length
      const docW = document.documentElement.scrollWidth
      const vw = window.innerWidth
      return { cols, overflow: docW - vw }
    })
    test('Discover Meals mobile columns (375px)', mobileGrid && mobileGrid.cols === 2, `cols: ${mobileGrid?.cols}`)
    test('Discover Meals no mobile overflow (375px)', mobileGrid && mobileGrid.overflow <= 1, `overflow: ${mobileGrid?.overflow}`)

    // ==========================================
    // 3. SETTINGS LANGUAGE & TRANSLATION TESTS
    // ==========================================
    console.log('\n--- 3. Testing Settings Language Section & All 8 Locales ---')
    await page.setViewport({ width: 1024, height: 800 })
    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' })
    await sleep(800)

    const langSection = await page.evaluate(() => {
      const select = document.getElementById('settings-language')
      if (!select) return null
      const options = Array.from(select.querySelectorAll('option')).map((o) => ({
        value: o.value,
        text: o.textContent.trim()
      }))
      return { exists: true, options, value: select.value }
    })

    test('Settings language selector exists', langSection && langSection.exists)
    const expectedLocales = ['en', 'sw', 'fr', 'es', 'ar', 'pt', 'hi', 'zh-CN']
    const foundCodes = langSection ? langSection.options.map((o) => o.value) : []
    const allLocalesFound = expectedLocales.every((code) => foundCodes.includes(code))
    test('All 8 locales present in selector', allLocalesFound, `found: ${foundCodes.join(', ')}`)

    // Test switching to each locale
    for (const loc of expectedLocales) {
      await page.select('#settings-language', loc)
      await sleep(400)

      const state = await page.evaluate((expectedCode) => {
        const lang = document.documentElement.lang
        const dir = document.documentElement.dir
        const title = document.querySelector('.page-title')?.textContent.trim()
        const stored = JSON.parse(localStorage.getItem('chakula_locale') || 'null')
        return { lang, dir, title, stored }
      }, loc)

      test(`Locale ${loc}: saved in storage`, state.stored === loc, `stored: ${state.stored}`)
      test(`Locale ${loc}: document lang updated`, state.lang === (loc === 'zh-CN' ? 'zh-CN' : loc), `lang: ${state.lang}`)

      if (loc === 'ar') {
        test('Arabic sets dir="rtl"', state.dir === 'rtl', `dir: ${state.dir}`)
      } else {
        test(`Locale ${loc} sets dir="ltr"`, state.dir === 'ltr', `dir: ${state.dir}`)
      }
    }

    // Verify Arabic RTL icon flipping and styles
    console.log('\n--- 4. Testing Arabic RTL layout & controls ---')
    await page.select('#settings-language', 'ar')
    await sleep(400)

    const rtlCheck = await page.evaluate(() => {
      const dir = document.documentElement.dir
      const arrowIcon = document.querySelector('svg.icon[data-icon="arrowRight"]')
      let arrowTransform = ''
      if (arrowIcon) {
        arrowTransform = window.getComputedStyle(arrowIcon).transform
      }
      return { dir, arrowTransform }
    })
    test('Arabic document has dir="rtl"', rtlCheck.dir === 'rtl')
    test('Arabic mirrors directional arrow icons', rtlCheck.arrowTransform.includes('matrix(-1') || rtlCheck.arrowTransform.includes('-1, 0, 0, 1'), `transform: ${rtlCheck.arrowTransform}`)

    // Persist test: reload page in Arabic
    console.log('\n--- 5. Testing Language Persistence Across Reload ---')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await sleep(600)
    const persistedState = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      stored: JSON.parse(localStorage.getItem('chakula_locale') || 'null')
    }))
    test('Language persisted after reload', persistedState.stored === 'ar' && persistedState.lang === 'ar' && persistedState.dir === 'rtl', `lang=${persistedState.lang} dir=${persistedState.dir}`)

    // Switch back to English
    await page.select('#settings-language', 'en')
    await sleep(400)

    // ==========================================
    // 6. GET APP BUTTON & INSTALL GUIDE
    // ==========================================
    console.log('\n--- 6. Testing Get App Button & Install Guide ---')
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await sleep(500)

    const getAppCheck = await page.evaluate(() => {
      const btn = document.querySelector('.header-cta')
      return { exists: Boolean(btn), text: btn?.textContent.trim() }
    })
    test('Get app button exists in header', getAppCheck.exists, `text: ${getAppCheck.text}`)

    // Test A: Chromium prompt trigger (when canInstall is true)
    const promptTriggered = await page.evaluate(async () => {
      const btn = document.querySelector('.header-cta')
      if (!btn) return false
      btn.click()
      await new Promise((r) => setTimeout(r, 200))
      return btn.disabled // isPrompting is set while native prompt is active
    })
    test('Chromium install prompt triggers on click', promptTriggered)

    // Test B: Unsupported browser fallback guide
    console.log('\n--- 7. Testing Fallback Guide on Unsupported / Dismissed state ---')
    const fallbackPage = await browser.newPage()
    await fallbackPage.evaluateOnNewDocument(() => {
      window.addEventListener('beforeinstallprompt', (e) => e.stopImmediatePropagation(), true)
      localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true }))
      localStorage.setItem('chakula_cookie_consent', 'accepted')
    })
    await fallbackPage.setViewport({ width: 1024, height: 800 })
    await fallbackPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await sleep(500)

    const guideCheck = await fallbackPage.evaluate(async () => {
      const btn = document.querySelector('.header-cta')
      btn.click()
      await new Promise((r) => setTimeout(r, 400))
      const guide = document.querySelector('.install-guide')
      const title = guide?.querySelector('.confirm-title')?.textContent.trim()
      const steps = Array.from(guide?.querySelectorAll('.install-guide-steps li') || []).map((li) => li.textContent.trim())
      return { visible: Boolean(guide), title, steps }
    })
    test('Install guide modal opens when native prompt unavailable', guideCheck.visible, `title: ${guideCheck.title}`)
    test('Install guide contains desktop steps', guideCheck.steps.length >= 2, `steps: ${guideCheck.steps.join(' -> ')}`)

    // Dismiss guide modal
    await fallbackPage.click('.install-guide button')
    await sleep(300)
    const guideDismissed = await fallbackPage.evaluate(() => !document.querySelector('.install-guide'))
    test('Install guide can be dismissed', guideDismissed)
    await fallbackPage.close()

    // Test C: iOS Safari instructions
    console.log('\n--- 8. Testing iOS Safari Instructions ---')
    const iosPage = await browser.newPage()
    await iosPage.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    )
    await iosPage.evaluateOnNewDocument(() => {
      window.addEventListener('beforeinstallprompt', (e) => e.stopImmediatePropagation(), true)
      localStorage.setItem('chakula_preferences', JSON.stringify({ onboarded: true }))
      localStorage.setItem('chakula_cookie_consent', 'accepted')
    })
    await iosPage.setViewport({ width: 375, height: 667 })
    await iosPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await sleep(500)

    const iosGuideCheck = await iosPage.evaluate(async () => {
      const menuBtn = document.querySelector('.menu-toggle')
      menuBtn.click()
      await new Promise((r) => setTimeout(r, 300))
      const cta = document.querySelector('.mobile-menu-cta')
      cta.click()
      await new Promise((r) => setTimeout(r, 300))
      const guide = document.querySelector('.install-guide')
      const steps = Array.from(guide?.querySelectorAll('.install-guide-steps li') || []).map((li) => li.textContent.trim())
      return { visible: Boolean(guide), steps }
    })
    test('iOS guide modal opens from mobile menu', iosGuideCheck.visible)
    const mentionsShareAndHome = iosGuideCheck.steps.some((s) => /share/i.test(s)) && iosGuideCheck.steps.some((s) => /home/i.test(s))
    test('iOS guide explains Share -> Add to Home Screen', mentionsShareAndHome, `steps: ${iosGuideCheck.steps.join(' -> ')}`)
    await iosPage.close()

  } catch (err) {
    console.error('Test run failed with error:', err)
  } finally {
    await browser.close()
    const passed = results.filter((r) => r.pass).length
    console.log(`\n==============================================`)
    console.log(`E2E TEST SUMMARY: ${passed}/${results.length} checks passed`)
    console.log(`==============================================`)
  }
}

runTests()
