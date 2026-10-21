import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MealGrid from '../components/MealGrid'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import { getFavorites, clearFavorites } from '../utils/favorites'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

function Favorites() {
  const { t } = useTranslation()
  useSeo({
    title: t('favorites.seoTitle'),
    description: t('favorites.seoDescription'),
    path: '/favorites',
    robots: 'noindex,follow'
  })
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
            {t('favorites.eyebrow')}
          </p>
          <h1 className="page-title">{t('favorites.title')}</h1>
          <p className="page-subtitle">{t('favorites.subtitle')}</p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {favorites.length > 0 ? (
            <>
              <div className="results-head">
                <div>
                  <h2 className="results-head-title">{t('favorites.savedCount', { count: favorites.length })}</h2>
                  <p className="results-count">{t('favorites.tapCard')}</p>
                </div>
                <button type="button" className="button button--ghost button--small" onClick={() => setConfirmOpen(true)}>
                  <Icon name="trash" size={16} />
                  {t('common.clearAll')}
                </button>
              </div>
              <MealGrid meals={favorites} />
            </>
          ) : (
            <EmptyState
              title={t('favorites.emptyTitle')}
              message={t('favorites.emptyMessage')}
              icon={<Icon name="heart" size={28} />}
              action={
                <Link to="/explore" className="button button--primary button--small">
                  {t('common.exploreMeals')}
                  <Icon name="arrowRight" size={16} />
                </Link>
              }
            />
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t('favorites.clearTitle')}
        message={t('favorites.clearMessage')}
        confirmLabel={t('common.clearAll')}
        cancelLabel={t('favorites.keepThem')}
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  )
}

export default Favorites