import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useSeo } from '../hooks/useSeo'

function NotFound() {
  useSeo({
    title: 'Page not found — Pikawise',
    description: 'The page you are looking for does not exist on Pikawise.',
    path: '/404',
    robots: 'noindex,follow'
  })
  return (
    <main className="not-found">
      <div className="container not-found-inner">
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 className="page-title">Meal not found</h1>
        <p className="page-subtitle">The page you're looking for doesn't exist.</p>
        <Link to="/" className="button button--primary button--large">
          <Icon name="home" size={18} />
          Back Home
        </Link>
      </div>
    </main>
  )
}

export default NotFound