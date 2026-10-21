import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import { hasValidCookieConsent, saveCookieConsent } from '../utils/storage'

function CookieConsent() {
  const { t } = useTranslation()
  const [consented, setConsented] = useState(() => hasValidCookieConsent())
  const [managing, setManaging] = useState(false)

  if (consented) return null

  const choose = (choice) => {
    saveCookieConsent(choice)
    setConsented(true)
  }

  return (
    <aside className="cookie-consent" role="region" aria-label={t('cookie.noticeLabel')}>
      <div className="cookie-consent-inner">
        <Icon name="info" size={18} className="cookie-consent-icon" />
        <div className="cookie-consent-text">
          <p>
            {t('cookie.notice', { app: t('common.appName') })}{' '}
            <Link to="/terms#cookies">{t('cookie.learnMore')}</Link>
          </p>
          {managing && (
            <div className="cookie-consent-details" id="cookie-consent-details">
              <p>
                <strong>{t('cookie.essentialLabel')}</strong> {t('cookie.essentialDetail')}
              </p>
              <p>
                {t('cookie.manageIntro')}{' '}
                <Link to="/settings">{t('common.settings')}</Link>.
              </p>
            </div>
          )}
        </div>
        <div className="cookie-consent-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => choose('accepted')}
          >
            {t('common.accept')}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => choose('essential')}
          >
            {t('cookie.essentialOnly')}
          </button>
          <button
            type="button"
            className="button button--ghost cookie-manage"
            aria-expanded={managing}
            aria-controls="cookie-consent-details"
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? t('cookie.hideDetails') : t('cookie.managePreferences')}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default CookieConsent
