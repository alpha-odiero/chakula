import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const logoPath = join(root, 'src', 'assets', 'logo.svg')
const svgText = readFileSync(logoPath, 'utf8')
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

async function renderIcons() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  })
  const page = await browser.newPage()
  const result = await page.evaluate(async ({ dataUrl, sizes }) => {
    const img = new Image()
    img.src = dataUrl
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    const out = {}
    for (const { size, name, fraction, opaque } of sizes) {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      if (opaque) {
        ctx.fillStyle = '#e8590c'
        ctx.fillRect(0, 0, size, size)
      }
      const dw = size * fraction
      const dh = (dw * img.naturalHeight) / img.naturalWidth
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
      out[name] = canvas.toDataURL('image/png')
    }
    return out
  }, {
    dataUrl,
    sizes: [
      { size: 16, name: 'favicon-16', fraction: 1 },
      { size: 32, name: 'favicon-32', fraction: 1 },
      { size: 48, name: 'favicon-48', fraction: 1 },
      { size: 32, name: 'icon-32', fraction: 1 },
      { size: 192, name: 'icon-192', fraction: 1 },
      { size: 512, name: 'icon-512', fraction: 1 },
      { size: 192, name: 'icon-maskable-192', fraction: 0.86 },
      { size: 512, name: 'icon-maskable-512', fraction: 0.86 },
      { size: 180, name: 'apple-touch-icon', fraction: 1, opaque: true },
      { size: 256, name: 'logo', fraction: 1, opaque: true }
    ]
  })
  await browser.close()
  return result
}

function writeIco(filePath, sizes) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(sizes.length, 4)
  const entries = []
  const pngBuffers = []
  let offset = 6 + sizes.length * 16
  for (const { size, dataUrl } of sizes) {
    const buf = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64')
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += buf.length
    entries.push(entry)
    pngBuffers.push(buf)
  }
  writeFileSync(filePath, Buffer.concat([header, ...entries, ...pngBuffers]))
}

const pngs = await renderIcons()
for (const [name, dataUrl] of Object.entries(pngs)) {
  if (name === 'favicon-16' || name === 'favicon-32' || name === 'favicon-48') continue
  const base64 = dataUrl.slice('data:image/png;base64,'.length)
  writeFileSync(join(outDir, name === 'logo' ? '../../src/assets/LOGO.png' : `${name}.png`), Buffer.from(base64, 'base64'))
}

writeIco(join(root, 'public', 'favicon.ico'), [
  { size: 16, dataUrl: pngs['favicon-16'] },
  { size: 32, dataUrl: pngs['favicon-32'] },
  { size: 48, dataUrl: pngs['favicon-48'] }
])

console.log('Chakula brand icons generated in', outDir)