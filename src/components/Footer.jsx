import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.png'
import StoreButtons from './StoreButtons'
import Icon from './Icon'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useToast } from './Toast'
import { isStandalone } from '../utils/platform'

const exploreLinks = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Meals' },
  { to: '/balanced-diet', label: 'Balanced Diet' },
  { to: '/categories', label: 'Categories' },
  { to: '/random', label: 'Random Meal' }
]

const planningLinks = [
  { to: '/balanced-diet', label: 'Balanced Diet' },
  { to: '/meal-plans', label: 'Meal Plans' },
  { to: '/shopping-list', label: 'Shopping List' }
]

const infoLinks = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/privacy#cookies', label: 'Cookies' },
  { to: '/terms', label: 'Terms' }
]

function Footer() {
  const year = new Date().getFullYear()
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const toast = useToast()
  const standalone = isStandalone()
  const installRef = useRef(null)
  const flashTimer = useRef(null)

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  if (isInstalled || standalone) return null

  const handleInstall = async () => {
    const ok = await install()
    if (ok) toast.success('Thanks for installing Pikawise!')
  }

  // A store button was tapped but that app isn't published yet: the "coming
  // soon" message has been shown, so guide the user to the install button and
  // flash it orange a few times to make it obvious.
  const handleStoreUnavailable = () => {
    const button = installRef.current
    if (!button) return
    window.setTimeout(() => {
      button.scrollIntoView({ behavior: 'smooth', block: 'center' })
      button.classList.remove('footer-install-btn--flash')
      void button.offsetWidth
      button.classList.add('footer-install-btn--flash')
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => {
        button.classList.remove('footer-install-btn--flash')
      }, 1900)
    }, 700)
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
          <div className="footer-install">
              <p className="footer-install-text">
                Get Pikawise as a fast, offline-capable app on your device.
              </p>
            {canInstall ? (
              <div className="footer-install-action">
                <button
                  ref={installRef}
                  type="button"
                  className="button button--primary footer-install-btn"
                  onClick={handleInstall}
                >
                  <Icon name="install" size={18} />
                  Install App
                </button>
                <span className="install-nudge" aria-hidden="true">
                  <Icon name="pointer" size={26} />
                </span>
              </div>
            ) : isInstalled ? (
              <span className="footer-install-done">
                <Icon name="check" size={16} />
                Installed
              </span>
            ) : null}
          </div>
        </div>

        <nav className="footer-col" aria-label="Explore">
          <h2>Explore</h2>
          <ul>
            {exploreLinks.map((link) => (
              <li key={link.to + link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

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
