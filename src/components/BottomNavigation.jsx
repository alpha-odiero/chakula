import { NavLink } from 'react-router-dom'
import Icon from './Icon'

const items = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/balanced-diet', label: 'Plan', icon: 'calendar' },
  { to: '/favorites', label: 'Favorites', icon: 'heart' },
  { to: '/settings', label: 'Settings', icon: 'settings' }
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
                <Icon name={item.icon} size={22} />
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
