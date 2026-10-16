import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/LOGO.png'
import Icon from './Icon'
import NotificationCenter from './NotificationCenter'
import MobileMenu from './MobileMenu'

function AppHeader({ greeting = 'What shall we cook today?' }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="app-header">
        <div className="container app-header-inner">
          <button
            type="button"
            className="app-menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>

          <Link to="/" className="brand" aria-label="Pikawise — go to Home">
            <img src={logo} alt="" className="brand-logo" width="37" height="26" aria-hidden="true" />
            <span className="brand-name">Pikawise</span>
          </Link>

          <p className="app-greeting">{greeting}</p>

          <div className="app-header-actions">
            <Link to="/search" className="app-header-action" aria-label="Search recipes">
              <Icon name="search" size={20} />
            </Link>
            <NotificationCenter className="app-header-action" />
            <Link to="/settings" className="app-header-action app-avatar" aria-label="Profile and settings">
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
