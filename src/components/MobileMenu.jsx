import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import logo from '../assets/LOGO.png'
import GetAppButton from './GetAppButton'

const menuItems = [
  { to: '/', labelKey: 'nav.home', icon: 'home', end: true },
  { to: '/explore', labelKey: 'nav.explore', icon: 'explore' },
  { to: '/balanced-diet', labelKey: 'nav.balancedDiet', icon: 'leaf' },
  { to: '/categories', labelKey: 'nav.categories', icon: 'category' },
  { to: '/random', labelKey: 'nav.randomMeal', icon: 'random' },
  { to: '/meal-plans', labelKey: 'nav.mealPlans', icon: 'calendar' },
  { to: '/shopping-list', labelKey: 'nav.shoppingList', icon: 'shoppingBag' },
  { to: '/terms#about', labelKey: 'nav.about', icon: 'info' },
  { to: '/settings', labelKey: 'common.settings', icon: 'settings' }
]

function MobileMenu({ open, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('menu-open')
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('menu-open')
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="mobile-menu-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        id="mobile-menu"
        className="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.menu')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mobile-menu-header">
          <span className="mobile-brand">
            <img src={logo} alt="" className="brand-logo brand-logo--sm" width="34" height="24" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </span>
          <button type="button" className="menu-close" aria-label={t('a11y.closeMenu')} onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label={t('nav.mobileNavigation')}>
          <ul>
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="mobile-menu-icon" aria-hidden="true">
                    <Icon name={item.icon} size={20} />
                  </span>
                  {t(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu-cta-wrap">
          <GetAppButton className="mobile-menu-cta" onNavigate={onClose} />
        </div>
        <p className="mobile-menu-footer">{t('nav.mobileTagline')}</p>
      </aside>
    </div>
  )
}

export default MobileMenu