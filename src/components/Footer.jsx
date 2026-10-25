import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import logo from '../assets/LOGO.png'
import StoreButtons from './StoreButtons'
import GetAppButton from './GetAppButton'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useToast } from './Toast'
import { isStandalone } from '../utils/platform'

// How long the "coming soon" store message stays on screen before the
// browser-install follow-up hint appears.
const STORE_MESSAGE_MS = 3800

const planningLinks = [
  { to: '/meal-plans', labelKey: 'nav.mealPlans' },
  { to: '/shopping-list', labelKey: 'nav.shoppingList' }
]

const infoLinks = [
  { to: '/terms#about', labelKey: 'nav.about' },
  { to: '/terms#privacy', labelKey: 'footer.privacy' },
  { to: '/terms#cookies', labelKey: 'footer.cookies' },
  { to: '/terms', labelKey: 'footer.terms' }
]

// Store "coming soon" copy, keyed by the store id used in StoreButtons.
const storeComingSoonKeys = {
  'google-play': 'footer.androidSoon',
  'app-store': 'footer.iosSoon'
}

function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const { isInstalled } = useInstallPrompt()
  const toast = useToast()
  const standalone = isStandalone()
  const storeTimer = useRef(null)
  const appName = t('common.appName')

  useEffect(() => () => window.clearTimeout(storeTimer.current), [])

  if (isInstalled || standalone) return null

  // A store button was tapped but that app isn't published yet: show the
  // "coming soon" message, then follow up with the actionable browser route
  // so the store buttons are never a dead end.
  const handleStoreUnavailable = (store) => {
    const comingSoonKey = store?.key ? storeComingSoonKeys[store.key] : null
    if (comingSoonKey) toast.info(t(comingSoonKey, { app: appName }), { duration: STORE_MESSAGE_MS })
    else if (store?.comingSoon) toast.info(store.comingSoon, { duration: STORE_MESSAGE_MS })
    window.clearTimeout(storeTimer.current)
    storeTimer.current = window.setTimeout(() => {
      toast.info(
        t('footer.notInStores', { app: appName, getApp: t('install.getApp') })
      )
    }, STORE_MESSAGE_MS + 350)
  }

  return (
    <footer className="site-footer">
      <div className="container footer-downloads" aria-labelledby="footer-downloads-title">
        <div className="downloads-copy">
          <h2 id="footer-downloads-title">{t('footer.downloadsTitle', { app: appName })}</h2>
          <p>{t('footer.downloadsText')}</p>
        </div>
        <div className="footer-download-actions">
          <GetAppButton className="button button--primary footer-get-app" />
          <StoreButtons onStoreUnavailable={handleStoreUnavailable} />
        </div>
      </div>

      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="brand footer-logo">
            <img src={logo} alt="" className="brand-logo brand-logo--lg" width="54" height="38" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </div>
          <p>{t('common.tagline')}</p>
        </div>

        <nav className="footer-col" aria-label={t('footer.planning')}>
          <h2>{t('footer.planning')}</h2>
          <ul>
            {planningLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{t(link.labelKey)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label={t('footer.information')}>
          <h2>{t('footer.information')}</h2>
          <ul>
            {infoLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{t(link.labelKey)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>{t('footer.builtBy')}</p>
          <p>·</p>
          <p>{t('footer.copyright', { year, app: appName })}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
