import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import MobileMenu from './MobileMenu'
import logo from '../assets/logo.svg'

const desktopNavItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
  { to: '/balanced-diet', label: 'Balanced Diet' },
  { to: '/categories', label: 'Categories' },
  { to: '/random', label: 'Random' }
]

function Navbar() {
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
          <Link to="/" className="brand" aria-label="Chakula — go to Home">
            <img src={logo} alt="" className="brand-logo" width="47" height="38" aria-hidden="true" />
            <span className="brand-name">Chakula</span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <ul>
              {desktopNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link to="/search" className="search-shortcut" aria-label="Search meals">
              <Icon name="search" size={20} />
            </Link>
            <Link to="/settings" className="header-settings desktop-settings" aria-label="Settings">
              <Icon name="settings" size={20} />
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

export default Navbar