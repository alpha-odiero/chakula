import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import logo from '../assets/LOGO.png'
import MobileMenu from './MobileMenu'
import NotificationCenter from './NotificationCenter'
import GetAppButton from './GetAppButton'

const desktopNavItems = [
  { to: '/', labelKey: 'nav.home', end: true },
  { to: '/explore', labelKey: 'nav.discover' },
  { to: '/categories', labelKey: 'nav.recipes' },
  { to: '/#how-it-works', labelKey: 'nav.howItWorks' },
  { to: '/terms#about', labelKey: 'nav.about' }
]

function WebHeader() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={`${t('common.appName')} — ${t('nav.goToHome')}`}>
            <img src={logo} alt="" className="brand-logo" width="43" height="30" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </Link>

          <nav className="desktop-nav" aria-label={t('a11y.mainNavigation')}>
            <ul>
              {desktopNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `nav-link${isActive && item.to !== '/#how-it-works' ? ' active' : ''}`
                    }
                  >
                    {t(item.labelKey)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link to="/search" className="header-action" aria-label={t('nav.searchRecipes')}>
              <Icon name="search" size={20} />
            </Link>
            <NotificationCenter className="header-action" />
            <GetAppButton className="header-cta" />
            <button
              type="button"
              className="menu-toggle"
              aria-label={t('a11y.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" size={24} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}

export default WebHeader
