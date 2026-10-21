import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocaleMeta,
  isSupportedLocale,
  loadDictionary,
  resolveInitialLocale,
  translate
} from './index'
import { getLocale, saveLocale } from '../utils/storage'

const LocaleContext = createContext(null)

// Keeps <html lang> and <html dir> in sync. The same function runs in
// index.html before React boots, so the first paint is already correct.
function applyDocumentLocale(code) {
  if (typeof document === 'undefined') return
  const meta = getLocaleMeta(code)
  document.documentElement.lang = meta.htmlLang
  document.documentElement.dir = meta.dir
}

const initialLocale = resolveInitialLocale(getLocale())

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(initialLocale)
  const [dictionary, setDictionary] = useState(null)

  useEffect(() => {
    let alive = true
    loadDictionary(locale).then((dict) => {
      if (alive) setDictionary(dict)
    })
    applyDocumentLocale(locale)
    return () => {
      alive = false
    }
  }, [locale])

  const setLocale = useCallback((next) => {
    if (!isSupportedLocale(next)) return
    saveLocale(next)
    applyDocumentLocale(next)
    setLocaleState(next)
  }, [])

  const value = useMemo(() => {
    const active = dictionary || null
    const t = (key, params) => translate(active, key, params, locale)
    return {
      locale,
      setLocale,
      locales: LOCALES,
      dir: getLocaleMeta(locale).dir,
      t
    }
  }, [dictionary, locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useTranslation() {
  const context = useContext(LocaleContext)
  if (!context) {
    // Outside the provider (e.g. a lazily mounted portal) fall back to English
    // so components keep rendering instead of throwing.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      locales: LOCALES,
      dir: 'ltr',
      t: (key, params) => translate(null, key, params, DEFAULT_LOCALE)
    }
  }
  return context
}

export default LocaleProvider
