import { useCallback, useEffect, useState } from 'react'
import {
  subscribeToInstallState,
  getInstallState,
  promptInstall as sharedPromptInstall
} from '../utils/installPrompt'

// Thin React binding over the shared install-prompt store. Every consumer
// sees the same event, so one component prompting the browser no longer
// breaks the others.
export function useInstallPrompt() {
  const [state, setState] = useState(getInstallState)

  useEffect(() => {
    const unsubscribe = subscribeToInstallState(() => setState(getInstallState()))
    setState(getInstallState())
    return unsubscribe
  }, [])

  const promptInstall = useCallback(async () => {
    const result = await sharedPromptInstall()
    return result
  }, [])

  // Legacy boolean API: true when a native prompt was shown (accepted or
  // dismissed), false when installation is unavailable in this browser.
  const install = useCallback(async () => {
    const { outcome } = await sharedPromptInstall()
    return outcome !== 'unavailable'
  }, [])

  return {
    canInstall: state.canInstall,
    isInstalled: state.isInstalled,
    isPrompting: state.isPrompting,
    install,
    promptInstall
  }
}
