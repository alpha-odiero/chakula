import { useState, useEffect } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import { getInstallDismissed, setInstallDismissed } from '../utils/storage'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { getIOSDevice, isStandalone } from '../utils/platform'
import Icon from './Icon'

function InstallPrompt({ autoShow = true }) {
  const { t } = useTranslation()
  const { canInstall, isInstalled, isPrompting, install } = useInstallPrompt()
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
    <div
      className="install-prompt"
      role="dialog"
      aria-modal="false"
      aria-label={t('install.ariaLabel', { app: t('common.appName') })}
    >
      {showIOSGuide && !canInstall ? (
        <>
          <div className="install-prompt-title">
            <Icon name="install" size={20} />
            {t('install.title', { app: t('common.appName') })}
          </div>
          <ol className="install-steps">
            <li>{t('install.stepShare')} <span aria-hidden="true">↗</span></li>
            <li>{t('install.stepAddToHome')}</li>
            <li>{t('install.stepTapAdd')}</li>
          </ol>
          <div className="install-prompt-actions">
            <button type="button" className="button button--secondary" onClick={handleDismiss}>
              {t('install.gotIt')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="install-prompt-title">
            <Icon name="install" size={20} />
            {t('install.title', { app: t('common.appName') })}
          </div>
          <p className="install-prompt-text">{t('install.text')}</p>
          <div className="install-prompt-actions">
            <button type="button" className="button button--primary" onClick={handleInstall}>
              {t('install.action')}
            </button>
            <button type="button" className="button button--ghost" onClick={handleDismiss}>
              {t('install.notNow')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default InstallPrompt