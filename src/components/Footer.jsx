import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.png'
import Icon from './Icon'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
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
  const standalone = isStandalone()
  if (isInstalled || standalone) return null

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand footer-logo">
            <img src={logo} alt="" className="brand-logo brand-logo--lg" width="58" height="48" aria-hidden="true" />
            <span className="brand-name">Chakula</span>
          </div>
          <p>Discover meals. Plan balanced diets. Cook smarter.</p>
          <div className="footer-install">
              <p className="footer-install-text">
                Get Pikawise as a fast, offline-capable app on your device.
              </p>
            {canInstall ? (
              <button type="button" className="button button--primary footer-install-btn" onClick={install}>
                <Icon name="install" size={18} />
                Install App
              </button>
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