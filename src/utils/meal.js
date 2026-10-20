export function extractIngredients(meal) {
  if (!meal || typeof meal !== 'object') return []

  // Prefer the normalised internal ingredients array.
  if (Array.isArray(meal.ingredients)) {
    return meal.ingredients
      .map((item) => {
        if (typeof item === 'string') return { name: item.trim(), measure: null }
        if (!item || typeof item !== 'object') return null
        const name = String(item.name ?? item.ingredient ?? '').trim()
        if (!name) return null
        return { name, measure: String(item.measure ?? item.amount ?? '').trim() || null }
      })
      .filter(Boolean)
  }

  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ingredient = String(meal[`strIngredient${i}`] || '').trim()
    const measure = String(meal[`strMeasure${i}`] || '').trim()
    if (ingredient) {
      ingredients.push({ name: ingredient, measure: measure || null })
    }
  }
  return ingredients
}

export function getMealTags(meal) {
  if (!meal) return []
  if (Array.isArray(meal.tags)) {
    return meal.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
  }
  if (typeof meal.strTags === 'string') {
    return meal.strTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }
  return []
}

export function getVideoId(url) {
  const videoUrl = typeof url === 'string' ? url : ''
  if (!videoUrl) return null
  const match = videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)
  return match ? match[1] : null
}

export function mealToCardData(meal) {
  if (!meal) return null
  return {
    id: meal.id ?? meal.idMeal,
    name: meal.name ?? meal.strMeal,
    image: meal.image ?? meal.strMealThumb,
    category: meal.category ?? meal.strCategory ?? null,
    area: meal.area ?? meal.strArea ?? null
  }
}

const INLINE_STEP = /(?:^|\s)(?:step\s*)?(\d{1,2})\s*[.)]\s+/gi
const STEP_PREFIX = /^(?:step\s*)?\d{1,2}\s*(?:[.):]\s*|[-–]\s+)/i
const STEP_LABEL_ONLY = /^(?:step\s*)?\d{1,2}$/i
const ABBREVIATION_END = /(?:^|\s)(?:approx|etc|vs|e\.g|i\.e|mr|mrs|ms|dr|st|co|inc)\.$/i

// Some recipes put every numbered step in a single paragraph instead of one
// per line. Recover those steps without touching numbers like "1.5" or "180C".
function splitInlineNumbered(text) {
  const markers = []
  let match
  INLINE_STEP.lastIndex = 0
  while ((match = INLINE_STEP.exec(text))) {
    const value = Number(match[1])
    if (!Number.isFinite(value)) continue
    const offset = match[0].search(/\d/)
    markers.push({ value, index: match.index + offset })
  }
  if (markers.length < 2) return null

  let best = null
  for (let i = 0; i < markers.length; i += 1) {
    const run = [markers[i]]
    for (let j = i + 1; j < markers.length; j += 1) {
      if (markers[j].value !== run[run.length - 1].value + 1) break
      run.push(markers[j])
    }
    if (run.length >= 2 && (!best || run.length > best.length)) best = run
  }
  if (!best) return null

  const segments = []
  const preamble = text.slice(0, best[0].index).trim()
  if (preamble.length > 12) segments.push(preamble)
  for (let i = 0; i < best.length; i += 1) {
    const end = i + 1 < best.length ? best[i + 1].index : text.length
    const segment = text.slice(best[i].index, end).trim()
    if (segment) segments.push(segment)
  }
  return segments.length > 1 ? segments : null
}

function isStepHeading(text) {
  if (text.length > 72) return false
  if (/:$/.test(text) && !/[.!?]$/.test(text)) return true
  return /[A-Z]/.test(text) && text === text.toUpperCase() && !/[.!?]$/.test(text)
}

// Paragraph-only instructions (no line breaks) still need usable steps.
function splitSentences(text) {
  const parts = text
    .replace(/([.!?])\s+(?=[A-Z(])/g, '$1\u0000')
    .split('\u0000')
    .map((part) => part.trim())
    .filter(Boolean)
  const merged = []
  for (const part of parts) {
    const previous = merged[merged.length - 1]
    if (previous && ABBREVIATION_END.test(previous)) merged[merged.length - 1] = `${previous} ${part}`
    else merged.push(part)
  }
  return merged
}

export function formatInstructionSteps(instructions) {
  if (typeof instructions !== 'string') return []
  const normalized = instructions.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim()
  if (!normalized) return []

  const steps = []
  let heading = ''
  for (const rawLine of normalized.split(/\n+/)) {
    const line = rawLine.trim()
    if (!line) continue
    const pieces = splitInlineNumbered(line) ?? [line]
    for (const piece of pieces) {
      const step = piece.replace(STEP_PREFIX, '').trim()
      if (!step || STEP_LABEL_ONLY.test(step)) continue
      if (isStepHeading(step)) {
        heading = heading ? `${heading} ${step}` : step
        continue
      }
      const text = heading ? `${heading.replace(/:\s*$/, '')}: ${step}` : step
      heading = ''
      steps.push(text)
    }
  }

  if (steps.length === 1 && steps[0].length > 160) {
    const sentences = splitSentences(steps[0])
    if (sentences.length > 1) return sentences
  }

  return steps
}

export function debounce(fn, delay = 350) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/* ---------- Serving scaling (reliable only) ---------- */

const UNICODE_FRACTIONS = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875
}

const FRACTION_LABELS = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
  [1 / 3, '⅓'],
  [2 / 3, '⅔'],
  [0.2, '⅕'],
  [0.4, '⅖'],
  [0.6, '⅗'],
  [0.8, '⅘'],
  [1 / 8, '⅛'],
  [3 / 8, '⅜'],
  [5 / 8, '⅝'],
  [7 / 8, '⅞']
]

const COUNTABLE_UNITS = [
  ['cup', 'cups'],
  ['tablespoon', 'tablespoons'],
  ['teaspoon', 'teaspoons'],
  ['tbsp', 'tbsp'],
  ['tsp', 'tsp'],
  ['tbs', 'tbs'],
  ['pinch', 'pinches'],
  ['dash', 'dashes'],
  ['clove', 'cloves'],
  ['slice', 'slices'],
  ['can', 'cans'],
  ['tin', 'tins'],
  ['sprig', 'sprigs'],
  ['stalk', 'stalks'],
  ['piece', 'pieces'],
  ['bunch', 'bunches'],
  ['head', 'heads'],
  ['strip', 'strips'],
  ['stick', 'sticks'],
  ['jar', 'jars'],
  ['pack', 'packs'],
  ['packet', 'packets'],
  ['bottle', 'bottles'],
  ['handful', 'handfuls'],
  ['fillet', 'fillets'],
  ['leaf', 'leaves'],
  ['egg', 'eggs'],
  ['onion', 'onions']
]

function parseLeadingQuantity(text) {
  let match

  match = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)\s*(.*)$/)
  if (match) {
    const denominator = Number(match[3])
    if (!denominator) return null
    return { value: Number(match[1]) + Number(match[2]) / denominator, rest: match[4] }
  }

  match = text.match(/^(\d+)\s*\/\s*(\d+)\s*(.*)$/)
  if (match) {
    const denominator = Number(match[2])
    if (!denominator) return null
    return { value: Number(match[1]) / denominator, rest: match[3] }
  }

  match = text.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (match) {
    return { value: Number(match[1]), rest: match[2] }
  }

  const first = text.charAt(0)
  if (UNICODE_FRACTIONS[first] !== undefined) {
    return { value: UNICODE_FRACTIONS[first], rest: text.slice(1).trim() }
  }

  return null
}

function formatQuantity(value) {
  if (!Number.isFinite(value) || value <= 0) return null
  const rounded = Math.round(value * 100) / 100
  const whole = Math.floor(rounded)
  const remainder = rounded - whole
  const fraction = FRACTION_LABELS.find(([v]) => Math.abs(remainder - v) < 0.02)

  if (fraction) {
    return whole ? `${whole} ${fraction[1]}` : fraction[1]
  }

  if (Math.abs(rounded - Math.round(rounded)) < 0.01) {
    return String(Math.round(rounded))
  }

  return String(rounded)
}

function matchUnit(word) {
  const cleaned = word.toLowerCase().replace(/[.,]$/, '')
  for (const [singular, plural] of COUNTABLE_UNITS) {
    if (cleaned === singular || cleaned === plural) {
      return { singular, plural }
    }
  }
  return null
}

function adjustUnitWord(rest, value) {
  if (!rest) return rest
  const parts = rest.split(/\s+/)
  const unit = matchUnit(parts[0])
  if (!unit) return rest
  const usePlural = value > 1
  parts[0] = usePlural ? unit.plural : unit.singular
  return parts.join(' ')
}

export function scaleMeasure(measure, factor) {
  if (!measure || !Number.isFinite(factor) || factor === 1) return measure
  const parsed = parseLeadingQuantity(measure.trim())
  if (!parsed) return measure

  const value = parsed.value * factor
  const quantity = formatQuantity(value)
  if (!quantity) return measure

  const rest = adjustUnitWord(parsed.rest, value)
  return rest ? `${quantity} ${rest}` : quantity
}

export function canScaleMeasure(measure) {
  if (!measure) return false
  return parseLeadingQuantity(measure.trim()) !== null
}
