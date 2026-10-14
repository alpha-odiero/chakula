import { useState, useEffect, useCallback } from 'react'
import { getTheme, saveTheme } from '../utils/storage'

function listenToSystemTheme(listener) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }
  media.addListener(listener)
  return () => media.removeListener(listener)
}

export function useTheme() {
  const [pref, setPref] = useState(() => {
    const stored = getTheme()
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const meta = document.querySelector('meta[name="theme-color"]')

    const apply = () => {
      const isDark =
        pref === 'dark' ||
        (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.remove('theme-light', 'theme-dark')
      root.classList.add(isDark ? 'theme-dark' : 'theme-light')
      if (meta) meta.setAttribute('content', isDark ? '#14151a' : '#e8590c')
    }

    apply()

    if (pref === 'system') return listenToSystemTheme(apply)
    return undefined
  }, [pref])

  const setTheme = useCallback((next) => {
    setPref(next)
    saveTheme(next)
  }, [])

  return [pref, setTheme]
}