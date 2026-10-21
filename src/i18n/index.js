// Locale registry and the translation engine used by LocaleContext.
// Dictionaries are flat `{ 'namespace.key': 'value' }` maps so a missing or
// extra key can never break the object shape of another locale.

import en from './locales/en'

export const DEFAULT_LOCALE = 'en'

// `native` is what the language selector shows; `label` is the English name.
export const LOCALES = [
  { code: 'en', native: 'English', label: 'English', htmlLang: 'en', dir: 'ltr' },
  { code: 'sw', native: 'Kiswahili', label: 'Swahili', htmlLang: 'sw', dir: 'ltr' },
  { code: 'fr', native: 'Français', label: 'French', htmlLang: 'fr', dir: 'ltr' },
  { code: 'es', native: 'Español', label: 'Spanish', htmlLang: 'es', dir: 'ltr' },
  { code: 'ar', native: 'العربية', label: 'Arabic', htmlLang: 'ar', dir: 'rtl' },
  { code: 'pt', native: 'Português', label: 'Portuguese', htmlLang: 'pt', dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi', htmlLang: 'hi', dir: 'ltr' },
  { code: 'zh-CN', native: '简体中文', label: 'Chinese (Simplified)', htmlLang: 'zh-CN', dir: 'ltr' }
]

const DICTIONARY_LOADERS = {
  en: () => Promise.resolve(en),
  sw: () => import('./locales/sw'),
  fr: () => import('./locales/fr'),
  es: () => import('./locales/es'),
  ar: () => import('./locales/ar'),
  pt: () => import('./locales/pt'),
  hi: () => import('./locales/hi'),
  'zh-CN': () => import('./locales/zh-CN')
}

export const SUPPORTED_LOCALES = LOCALES.map((locale) => locale.code)

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(value)
}

// Fallback to the browser's preferred language when the user has not yet
// chosen one in Settings. Matches full tags ('zh-CN') or primary subtags ('fr-CA' -> 'fr').
export function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const list = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || '']
  for (const raw of list) {
    if (!raw) continue
    const tag = String(raw).trim()
    const lower = tag.toLowerCase()
    if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans')) return 'zh-CN'
    for (const code of ['sw', 'fr', 'es', 'ar', 'pt', 'hi', 'en']) {
      if (lower === code || lower.startsWith(`${code}-`)) return code
    }
  }
  return DEFAULT_LOCALE
}

export function resolveInitialLocale(storedValue) {
  if (storedValue && isSupportedLocale(storedValue)) return storedValue
  return detectBrowserLocale()
}

export function getLocaleMeta(code) {
  return LOCALES.find((locale) => locale.code === code) || LOCALES[0]
}

export function isRtl(code) {
  return getLocaleMeta(code).dir === 'rtl'
}

const dictionaryCache = { en }

// Returns the dictionary for `code`, or the English dictionary when the locale
// is unsupported or its chunk has not loaded. Never throws: a failed dynamic
// import must degrade to English rather than blank the interface.
export async function loadDictionary(code) {
  if (!isSupportedLocale(code)) return dictionaryCache.en
  if (dictionaryCache[code]) return dictionaryCache[code]
  try {
    const module = await DICTIONARY_LOADERS[code]()
    const dict = module?.default
    if (dict && typeof dict === 'object') {
      dictionaryCache[code] = dict
      return dict
    }
  } catch (error) {
    // Fall through to English.
  }
  return dictionaryCache.en
}

export function preloadDictionary(code) {
  if (!isSupportedLocale(code) || dictionaryCache[code]) return Promise.resolve(dictionaryCache.en)
  return loadDictionary(code)
}

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g

export function interpolate(template, params) {
  if (!params) return template
  return String(template).replace(PLACEHOLDER, (match, name) => {
    const value = params[name]
    return value === undefined || value === null ? match : String(value)
  })
}

function lookup(dict, key) {
  if (!dict) return undefined
  if (!Object.prototype.hasOwnProperty.call(dict, key)) return undefined
  const value = dict[key]
  // An empty translation is treated as missing so the English copy is used.
  if (value === undefined || value === null || value === '') return undefined
  return value
}

let pluralRulesCache = {}

function pluralCategory(code, count) {
  try {
    if (!pluralRulesCache[code]) pluralRulesCache[code] = new Intl.PluralRules(code)
    return pluralRulesCache[code].select(count)
  } catch {
    return count === 1 ? 'one' : 'other'
  }
}

// `t(key, params)`:
//   1. tries `<key>.<pluralCategory>` in the active dictionary
//   2. then `<key>.other` (covers languages whose plural categories are not
//      translated one by one)
//   3. then `<key>` in the active dictionary
//   4. then the same steps in the English dictionary
//   5. finally the key itself, so missing copy is visible but harmless.
export function translate(dict, key, params, locale = DEFAULT_LOCALE) {
  const count = params && params.count
  const candidates = []
  if (count !== undefined && count !== null && Number.isFinite(Number(count))) {
    const category = pluralCategory(locale, Number(count))
    candidates.push(`${key}.${category}`)
    if (category !== 'other') candidates.push(`${key}.other`)
  }
  candidates.push(key)

  const dicts = [dict, en]
  for (const candidateDict of dicts) {
    for (const candidate of candidates) {
      const found = lookup(candidateDict, candidate)
      if (found !== undefined) return interpolate(found, params)
    }
  }
  return key
}
