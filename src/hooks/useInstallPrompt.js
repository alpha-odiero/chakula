import { useEffect, useState } from 'react'
import { isStandalone } from '../utils/platform'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const checkStandalone = () => setIsInstalled(isStandalone())

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    checkStandalone()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('resize', checkStandalone)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('resize', checkStandalone)
    }
  }, [])

  // Reports exactly what happened with the native prompt so callers can react
  // to a dismissed prompt instead of treating it as success.
  const promptInstall = async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' }
    deferredPrompt.prompt()
    let outcome = 'dismissed'
    try {
      const choice = await deferredPrompt.userChoice
      if (choice?.outcome === 'accepted') outcome = 'accepted'
    } catch {
      outcome = 'dismissed'
    } finally {
      setDeferredPrompt(null)
    }
    return { outcome }
  }

  // Legacy boolean API: true when a native prompt was shown (accepted or
  // dismissed), false when installation is unavailable in this browser.
  const install = async () => {
    const { outcome } = await promptInstall()
    return outcome !== 'unavailable'
  }

  return { canInstall: Boolean(deferredPrompt), isInstalled, install, promptInstall, deferredPrompt }
}