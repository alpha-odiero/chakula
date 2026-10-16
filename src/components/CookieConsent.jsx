import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { hasValidCookieConsent, saveCookieConsent } from '../utils/storage'

function CookieConsent() {
  const [consented, setConsented] = useState(() => hasValidCookieConsent())
  const [managing, setManaging] = useState(false)

  if (consented) return null

  const choose = (choice) => {
    saveCookieConsent(choice)
    setConsented(true)
  }

  return (
    <aside className="cookie-consent" role="region" aria-label="Cookie notice">
      <div className="cookie-consent-inner">
        <Icon name="info" size={18} className="cookie-consent-icon" />
        <div className="cookie-consent-text">
          <p>
            Pikawise keeps your favorites, preferences, meal plans and shopping list on this device
            only — no tracking or advertising cookies.{' '}
            <Link to="/privacy#cookies">Learn more</Link>
          </p>
          {managing && (
            <div className="cookie-consent-details" id="cookie-consent-details">
              <p>
                <strong>Essential storage only:</strong> theme, saved recipes, meal plans, shopping
                list and this consent choice. Nothing is shared with third parties.
              </p>
              <p>
                You can review or clear this data at any time in{' '}
                <Link to="/settings">Settings</Link>.
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
            Accept
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => choose('essential')}
          >
            Essential only
          </button>
          <button
            type="button"
            className="button button--ghost cookie-manage"
            aria-expanded={managing}
            aria-controls="cookie-consent-details"
            onClick={() => setManaging((value) => !value)}
          >
            {managing ? 'Hide details' : 'Manage preferences'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default CookieConsent
