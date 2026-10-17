import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.png'
import StoreButtons from './StoreButtons'
import Icon from './Icon'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useToast } from './Toast'
import { isStandalone, getIOSDevice } from '../utils/platform'

// How long the "coming soon" toast stays on screen before the install button
// starts glowing.
const STORE_MESSAGE_MS = 3800

// Three orange pulses. Driven with the Web Animations API (not a CSS class) so
// the cue cannot be silenced by the global reduced-motion rules — this glow is
// an explicit, deliberate signal the user asked for.
const FLASH_KEYFRAMES = [
  { backgroundColor: '#198a43', boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)' },
  {
    backgroundColor: '#f97316',
    boxShadow: '0 0 0 10px rgba(249, 115, 22, 0.28), 0 0 24px 8px rgba(249, 115, 22, 0.6)'
  },
  { backgroundColor: '#198a43', boxShadow: '0 0 0 0 rgba(249, 115, 22, 0)' }
]

function blinkInstallButton(el) {
  if (typeof el.animate === 'function') {
    if (typeof el.getAnimations === 'function') {
      el.getAnimations().forEach((animation) => {
        if (animation.id === 'pikawise-install-blink') animation.cancel()
      })
    }
    el.animate(FLASH_KEYFRAMES, {
      id: 'pikawise-install-blink',
      duration: 900,
      delay: 250,
      iterations: 3,
      easing: 'ease-in-out'
    })
    return
  }
  // Fallback for browsers without the Web Animations API.
  el.classList.remove('footer-install-btn--flash')
  void el.offsetWidth
  el.classList.add('footer-install-btn--flash')
}

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
    if (canInstall) {
      const ok = await install()
      if (ok) toast.success('Thanks for installing Pikawise!')
      return
    }
    // No native prompt on this browser: point the user to the manual route so
    // the Install button is never a dead end.
    toast.info(
      getIOSDevice()
        ? 'To install Pikawise: tap Share, then "Add to Home Screen".'
        : 'To install Pikawise: open your browser menu and choose "Install app" or "Add to Home screen".'
    )
  }

  // A store button was tapped but that app isn't published yet: show the
  // "coming soon" message, then once it has disappeared guide the user to the
  // install button and make it glow orange a few times.
  const handleStoreUnavailable = (store) => {
    if (store?.comingSoon) toast.info(store.comingSoon, { duration: STORE_MESSAGE_MS })
    const button = installRef.current
    if (!button) return
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => {
      const target = installRef.current
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      blinkInstallButton(target)
    }, STORE_MESSAGE_MS + 250)
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
