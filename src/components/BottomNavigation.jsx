import { NavLink } from 'react-router-dom'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'

const items = [
  { to: '/', labelKey: 'nav.home', icon: 'home', end: true },
  { to: '/explore', labelKey: 'nav.discover', icon: 'explore' },
  { to: '/search', labelKey: 'common.search', icon: 'search' },
  { to: '/favorites', labelKey: 'common.saved', icon: 'heart' },
  { to: '/settings', labelKey: 'nav.profile', icon: 'user' }
]

function BottomNavigation() {
  const { t } = useTranslation()

  return (
    <nav className="bottom-nav" aria-label={t('nav.primary')}>
      <ul>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                <Icon name={item.icon} size={21} />
              </span>
              <span className="bottom-nav-label">{t(item.labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNavigation
