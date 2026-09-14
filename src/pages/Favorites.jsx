import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MealGrid from '../components/MealGrid'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import { getFavorites, clearFavorites } from '../utils/favorites'

function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  const handleClear = useCallback(() => {
    clearFavorites()
    setFavorites([])
    setConfirmOpen(false)
  }, [])

  return (
    <main className="favorites-page">
      <header className="page-header">
        <div className="container page-header-inner">
          <p className="page-eyebrow">
            <Icon name="heart" size={14} />
            Your collection
          </p>
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">
            Recipes you've saved for later. They stay on this device, even offline.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {favorites.length > 0 ? (
            <>
              <div className="results-head">
                <div>
                  <h2 className="results-head-title">{favorites.length} saved {favorites.length === 1 ? 'meal' : 'meals'}</h2>
                  <p className="results-count">Tap a card to open the recipe.</p>
                </div>
                <button type="button" className="button button--ghost button--small" onClick={() => setConfirmOpen(true)}>
                  <Icon name="trash" size={16} />
                  Clear all
                </button>
              </div>
              <MealGrid meals={favorites} />
            </>
          ) : (
            <EmptyState
              title="No favorites yet"
              message="Save meals you love and they'll appear here, ready even when you're offline."
              icon={<Icon name="heart" size={28} />}
              action={
                <Link to="/explore" className="button button--primary button--small">
                  Explore meals
                  <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear all favorites?"
        message="This will remove every saved meal from your favorites. You can always save them again later."
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  )
}

export default Favorites