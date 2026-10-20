import sharp from 'sharp'

const overlay = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.86"/>
      <stop offset="0.58" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.08"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <text x="72" y="252" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700" letter-spacing="-4" fill="#ffffff">Pikawise</text>
  <text x="76" y="318" font-family="Arial, Helvetica, sans-serif" font-size="33" fill="#f4f4f4">Discover meals. Cook with what you have.</text>
  <rect x="76" y="360" width="92" height="4" rx="2" fill="#ffffff" fill-opacity="0.7"/>
  <text x="76" y="438" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#e8e8e8">Recipes · Ingredients you have · Step-by-step cooking</text>
  <text x="76" y="560" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#d6d6d6">pikawise.vercel.app</text>
</svg>
`)

await sharp('src/assets/food/sunday-roast.jpg')
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og-image.jpg')

const meta = await sharp('public/og-image.jpg').metadata()
console.log(`og-image.jpg ${meta.width}x${meta.height} ${Math.round(meta.size / 1024)}KB`)
