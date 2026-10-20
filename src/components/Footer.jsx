import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.png'
import StoreButtons from './StoreButtons'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useToast } from './Toast'
import { isStandalone } from '../utils/platform'

// How long the "coming soon" store message stays on screen before the
// browser-install follow-up hint appears.
const STORE_MESSAGE_MS = 3800

const planningLinks = [
  { to: '/meal-plans', label: 'Meal Plans' },
  { to: '/shopping-list', label: 'Shopping List' }
]

const infoLinks = [
  { to: '/terms#about', label: 'About' },
  { to: '/terms#privacy', label: 'Privacy' },
  { to: '/terms#cookies', label: 'Cookies' },
  { to: '/terms', label: 'Terms' }
]

function Footer() {
  const year = new Date().getFullYear()
  const { isInstalled } = useInstallPrompt()
  const toast = useToast()
  const standalone = isStandalone()
  const storeTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(storeTimer.current), [])

  if (isInstalled || standalone) return null

  // A store button was tapped but that app isn't published yet: show the
  // "coming soon" message, then follow up with the actionable browser route
  // so the store buttons are never a dead end.
  const handleStoreUnavailable = (store) => {
    if (store?.comingSoon) toast.info(store.comingSoon, { duration: STORE_MESSAGE_MS })
    window.clearTimeout(storeTimer.current)
    storeTimer.current = window.setTimeout(() => {
      toast.info(
        'Pikawise is not in app stores yet — use "Get app" in the header to install it from your browser.'
      )
    }, STORE_MESSAGE_MS + 350)
  }

  return (
    <footer className="site-footer">
      <div className="container footer-downloads" aria-labelledby="footer-downloads-title">
        <div className="downloads-copy">
          <h2 id="footer-downloads-title">Take Pikawise with you</h2>
          <p>Discover meals and follow your favorite recipes wherever you go.</p>
        </div>
        <StoreButtons onStoreUnavailable={handleStoreUnavailable} />
      </div>

      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand footer-logo">
            <img src={logo} alt="" className="brand-logo brand-logo--lg" width="54" height="38" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </div>
          <p>Discover meals. Cook with what you have.</p>
        </div>

        <nav className="footer-col" aria-label="Planning">
          <h2>Planning</h2>
          <ul>
            {planningLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Information">
          <h2>Information</h2>
          <ul>
            {infoLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>Built by Alpha Odiero</p>
          <p>·</p>
          <p>© {year} Pikawise</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
