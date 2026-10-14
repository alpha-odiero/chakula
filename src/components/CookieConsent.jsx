import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { getCookieConsent, saveCookieConsent } from '../utils/storage'

function CookieConsent() {
  const [dismissed, setDismissed] = useState(() => getCookieConsent() !== null)

  if (dismissed) return null

  const choose = (value) => {
    saveCookieConsent(value)
    setDismissed(true)
  }

  return (
    <aside className="cookie-consent" role="region" aria-label="Cookie notice">
      <div className="cookie-consent-inner">
        <Icon name="info" size={18} className="cookie-consent-icon" />
        <p className="cookie-consent-text">
          Chakula keeps everything on your device — no tracking cookies. We do use a few essential
          cookies so your meal plans, preferences, and shopping lists stick around.{' '}
          <Link to="/privacy#cookies">Learn more</Link>
        </p>
        <div className="cookie-consent-actions">
          <button
            type="button"
            className="button button--primary button--small"
            onClick={() => choose('accepted')}
          >
            Got it
          </button>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => choose('dismissed')}
          >
            Close
          </button>
        </div>
      </div>
    </aside>
  )
}

export default CookieConsent