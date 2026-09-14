import { createContext, useCallback, useContext, useState } from 'react'
import { getPreferences, savePreferences, clearPreferences } from '../utils/storage'

const PreferencesContext = createContext({
  preferences: null,
  update: () => {},
  reset: () => {}
})

export function usePreferences() {
  return useContext(PreferencesContext)
}

function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(getPreferences)

  const update = useCallback((partial) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial }
      savePreferences(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    clearPreferences()
    setPreferences(getPreferences())
  }, [])

  return (
    <PreferencesContext.Provider value={{ preferences, update, reset }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export default PreferencesProvider