import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import logo from '../assets/LOGO.png'
import Icon from './Icon'
import NotificationCenter from './NotificationCenter'
import MobileMenu from './MobileMenu'

function AppHeader({ greeting }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const greetingText = greeting === undefined ? t('app.greeting') : greeting

  return (
    <>
      <header className="app-header">
        <div className="container app-header-inner">
          <button
            type="button"
            className="app-menu-toggle"
            aria-label={t('a11y.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>

          <Link to="/" className="brand" aria-label={`${t('common.appName')} — ${t('nav.goToHome')}`}>
            <img src={logo} alt="" className="brand-logo" width="37" height="26" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </Link>

          <p className="app-greeting">{greetingText}</p>

          <div className="app-header-actions">
            <Link to="/search" className="app-header-action" aria-label={t('nav.searchRecipes')}>
              <Icon name="search" size={20} />
            </Link>
            <NotificationCenter className="app-header-action" />
            <Link to="/settings" className="app-header-action app-avatar" aria-label={t('nav.profileAndSettings')}>
              <Icon name="user" size={20} />
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

export default AppHeader
