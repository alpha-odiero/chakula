import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'src/assets/LOGO.png'
const ICONS_DIR = 'public/icons'
const BG = { r: 255, g: 255, b: 255, alpha: 1 }

await mkdir(ICONS_DIR, { recursive: true })

async function make(size, ratio) {
  const max = Math.round(size * ratio)
  const logo = await sharp(SRC)
    .trim({ threshold: 12 })
    .resize({ width: max, height: max, fit: 'inside' })
    .toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer()
}

const targets = [
  ['icon-32.png', 32, 0.82],
  ['icon-192.png', 192, 0.8],
  ['icon-512.png', 512, 0.8],
  ['icon-maskable-192.png', 192, 0.6],
  ['icon-maskable-512.png', 512, 0.6],
  ['apple-touch-icon.png', 180, 0.76]
]

for (const [name, size, ratio] of targets) {
  const buf = await make(size, ratio)
  await writeFile(path.join(ICONS_DIR, name), buf)
  console.log('wrote', name, `${size}x${size}`, buf.length, 'bytes')
}

function pngToIco(frames) {
  const count = frames.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const entries = []
  const datas = []
  let offset = 6 + count * 16
  for (const { size, buffer } of frames) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(buffer.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    datas.push(buffer)
    offset += buffer.length
  }
  return Buffer.concat([header, ...entries, ...datas])
}

const frames = []
for (const size of [16, 32, 48]) {
  frames.push({ size, buffer: await make(size, 0.84) })
}
const ico = pngToIco(frames)
await writeFile('public/favicon.ico', ico)
console.log('wrote favicon.ico', ico.length, 'bytes')
