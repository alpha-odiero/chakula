import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const items = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/explore', label: 'Discover', icon: 'explore' },
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/favorites', label: 'Saved', icon: 'heart' },
  { to: '/settings', label: 'Profile', icon: 'user' }
]

function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
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
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNavigation
