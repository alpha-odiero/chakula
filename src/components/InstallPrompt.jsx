import { useState, useEffect } from 'react'
import { getInstallDismissed, setInstallDismissed } from '../utils/storage'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { getIOSDevice, isStandalone } from '../utils/platform'
import Icon from './Icon'

function InstallPrompt({ autoShow = true }) {
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => getInstallDismissed())
  const [visible, setVisible] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(() => getIOSDevice() && !isStandalone())

  useEffect(() => {
    if (isInstalled) return
    const timer = setTimeout(() => {
      if (autoShow) setVisible(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [autoShow, isInstalled])

  const hide = () => {
    setVisible(false)
  }

  const handleDismiss = () => {
    setInstallDismissed(true)
    setDismissed(true)
    hide()
  }

  const handleInstall = async () => {
    const ok = await install()
    if (!ok && getIOSDevice()) setShowIOSGuide(true)
    hide()
  }

  if (isInstalled || dismissed || !visible) return null
  if (!canInstall && !showIOSGuide) return null

  return (
    <div className="install-prompt" role="dialog" aria-modal="false" aria-label="Install Chakula">
      {showIOSGuide && !canInstall ? (
        <>
          <div className="install-prompt-title">
            <Icon name="install" size={20} />
            Install Chakula
          </div>
          <ol className="install-steps">
            <li>Tap the Share button <span aria-hidden="true">↗</span></li>
            <li>Select “Add to Home Screen”</li>
            <li>Tap Add</li>
          </ol>
          <div className="install-prompt-actions">
            <button type="button" className="button button--secondary" onClick={handleDismiss}>
              Got it
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="install-prompt-title">
            <Icon name="install" size={20} />
            Install Chakula
          </div>
          <p className="install-prompt-text">Get a faster app-like experience on your device.</p>
          <div className="install-prompt-actions">
            <button type="button" className="button button--primary" onClick={handleInstall}>
              Install
            </button>
            <button type="button" className="button button--ghost" onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default InstallPrompt