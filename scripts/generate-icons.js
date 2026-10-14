import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const LOGO = join(root, 'src', 'assets', 'LOGO.png')
const BG = { r: 0x1c, g: 0x1a, b: 0x17, alpha: 1 }

async function renderSquare(size, fraction) {
  const meta = await sharp(LOGO).metadata()
  const box = Math.round(size * fraction)
  const scale = Math.min(box / meta.width, box / meta.height)
  const w = Math.max(1, Math.round(meta.width * scale))
  const h = Math.max(1, Math.round(meta.height * scale))
  const logo = await sharp(LOGO).resize(w, h, { fit: 'inside' }).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer()
}

function writeIco(filePath, entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  const dirEntries = []
  const pngBuffers = []
  let offset = 6 + entries.length * 16
  for (const { size, buffer } of entries) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buffer.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += buffer.length
    dirEntries.push(entry)
    pngBuffers.push(buffer)
  }
  writeFileSync(filePath, Buffer.concat([header, ...dirEntries, ...pngBuffers]))
}

const sizes = [
  { name: 'icon-32', size: 32, fraction: 0.9 },
  { name: 'icon-192', size: 192, fraction: 0.86 },
  { name: 'icon-512', size: 512, fraction: 0.86 },
  { name: 'icon-maskable-192', size: 192, fraction: 0.68 },
  { name: 'icon-maskable-512', size: 512, fraction: 0.68 },
  { name: 'apple-touch-icon', size: 180, fraction: 0.86 }
]

for (const { name, size, fraction } of sizes) {
  writeFileSync(join(outDir, `${name}.png`), await renderSquare(size, fraction))
}

const faviconEntries = []
for (const size of [16, 32, 48]) {
  faviconEntries.push({ size, buffer: await renderSquare(size, 0.9) })
}
writeIco(join(root, 'public', 'favicon.ico'), faviconEntries)

console.log('Pikawise icons generated from LOGO.png in', outDir)
