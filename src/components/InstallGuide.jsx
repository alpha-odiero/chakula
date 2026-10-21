import { useEffect, useRef } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import { getInstallGuide } from '../utils/platform'

// Translation keys for the platform-specific manual install steps returned by
// getInstallGuide(). The original English strings stay as a fallback.
const guideStepKeys = {
  'iPhone and iPad': ['install.iosStep1', 'install.iosStep2', 'install.iosStep3'],
  Android: ['install.androidStep1', 'install.androidStep2', 'install.androidStep3'],
  desktop: ['install.desktopStep1', 'install.desktopStep2', 'install.desktopStep3']
}

function InstallGuide({ onClose, message }) {
  const { t } = useTranslation()
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    if (dialogRef.current) dialogRef.current.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
  }, [onClose])

  const guide = getInstallGuide()
  const appName = t('common.appName')
  const stepKeys = guideStepKeys[guide.platform]
  const platform = guide.platform === 'desktop' ? t('install.platformDesktop') : guide.platform
  const text =
    message ||
    t('install.guideMessage', { app: appName, platform })

  return (
    <div className="confirm-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="confirm-dialog install-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        aria-describedby="install-guide-message"
        tabIndex="-1"
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon" aria-hidden="true">
          <Icon name="install" size={24} />
        </div>
        <h3 className="confirm-title" id="install-guide-title">
          {t('install.guideTitle', { app: appName })}
        </h3>
        <p className="confirm-message" id="install-guide-message">
          {text}
        </p>
        <ol className="install-guide-steps">
          {guide.steps.map((step, index) => (
            <li key={step}>{stepKeys?.[index] ? t(stepKeys[index], { app: appName }) : step}</li>
          ))}
        </ol>
        <div className="confirm-actions">
          <button type="button" className="button button--primary" onClick={onClose}>
            {t('install.gotIt')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallGuide
