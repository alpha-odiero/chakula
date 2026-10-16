import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import logo from '../assets/LOGO.png'
import MobileMenu from './MobileMenu'
import NotificationCenter from './NotificationCenter'

const desktopNavItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Discover' },
  { to: '/categories', label: 'Recipes' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/about', label: 'About' }
]

function WebHeader() {
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
          <Link to="/" className="brand" aria-label="Pikawise — go to Home">
            <img src={logo} alt="" className="brand-logo" width="43" height="30" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
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
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link to="/search" className="header-action" aria-label="Search recipes">
              <Icon name="search" size={20} />
            </Link>
            <NotificationCenter className="header-action" />
            <Link to="/explore" className="header-cta">
              Open Pikawise
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-label="Open menu"
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
