import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import logo from '../assets/LOGO.png'

const menuItems = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/balanced-diet', label: 'Balanced Diet', icon: 'leaf' },
  { to: '/categories', label: 'Categories', icon: 'category' },
  { to: '/random', label: 'Random Meal', icon: 'random' },
  { to: '/meal-plans', label: 'Meal Plans', icon: 'calendar' },
  { to: '/shopping-list', label: 'Shopping List', icon: 'shoppingBag' },
  { to: '/about', label: 'About', icon: 'info' },
  { to: '/settings', label: 'Settings', icon: 'settings' }
]

function MobileMenu({ open, onClose }) {
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
        aria-label="Menu"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mobile-menu-header">
          <span className="mobile-brand">
            <img src={logo} alt="" className="brand-logo brand-logo--sm" width="37" height="30" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </span>
          <button type="button" className="menu-close" aria-label="Close menu" onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label="Mobile navigation">
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
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mobile-menu-footer">Discover meals. Plan better. Cook smarter.</p>
      </aside>
    </div>
  )
}

export default MobileMenu