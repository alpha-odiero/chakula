import { useNavigate } from 'react-router-dom'
import SearchBar from '../../components/SearchBar'
import FeaturedMealCard from '../../components/FeaturedMealCard'
import CategoryScroller, { CuisineChips } from '../../components/CategoryScroller'
import IngredientDiscoveryCard from '../../components/IngredientDiscoveryCard'
import RecipeSection from '../../components/RecipeSection'
import MealGrid from '../../components/MealGrid'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import Icon from '../../components/Icon'
import { useHomeData } from '../../hooks/useHomeData'
import { useTranslation } from '../../i18n/LocaleContext'

function AppHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    featured,
    recommended,
    category,
    categories,
    areas,
    saved,
    loading,
    error,
    reload
  } = useHomeData()

  return (
    <main className="app-home">
      <h1 className="visually-hidden">{t('home.appTitle')}</h1>
      <section className="app-home-top">
        <div className="container">
          <SearchBar
            size="large"
            placeholder={t('home.searchPlaceholder')}
            filterTo="/explore"
            filterLabel={t('home.filterRecipes')}
            onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
          />

          <div className="app-home-featured">
            {loading ? (
              <div className="featured-card featured-card--skeleton" aria-hidden="true">
                <span className="skeleton-block featured-skel-line" />
                <span className="skeleton-block featured-skel-line featured-skel-line--lg" />
                <span className="skeleton-block featured-skel-line" />
              </div>
            ) : error ? (
              <ErrorState onRetry={reload} compact />
            ) : (
              <FeaturedMealCard meal={featured} />
            )}
          </div>

          <CategoryScroller categories={categories} loading={loading} />

          <IngredientDiscoveryCard />
        </div>
      </section>

      <RecipeSection title={t('home.recommended.title')} actionTo="/explore">
        {loading ? (
          <MealGrid loading skeletonCount={4} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : recommended.length ? (
          <MealGrid meals={recommended} fallbackCategory={category} />
        ) : (
          <EmptyState
            title={t('home.recommended.emptyTitle')}
            message={t('home.recommended.emptyMessage')}
            action={
              <button type="button" className="button button--primary" onClick={reload}>
                {t('common.retryShort')}
              </button>
            }
          />
        )}
      </RecipeSection>

      {areas.length > 0 && (
        <RecipeSection
          title={t('home.cuisines.title')}
          actionTo="/explore"
          actionLabel={t('home.browseAll')}
        >
          <CuisineChips areas={areas} />
        </RecipeSection>
      )}

      {saved.length > 0 && (
        <RecipeSection title={t('home.saved.title')} actionTo="/favorites">
          <MealGrid meals={saved} className="meal-grid--rail" skeletonCount={4} />
        </RecipeSection>
      )}

      <RecipeSection title={t('home.actions.title')} actionTo={null}>
        <div className="home-actions-grid">
          <button type="button" className="home-action-tile" onClick={() => navigate('/random')}>
            <Icon name="random" size={20} />
            <strong>{t('common.surpriseMe')}</strong>
            <span>{t('home.actions.randomText')}</span>
          </button>
          <button
            type="button"
            className="home-action-tile"
            onClick={() => navigate('/balanced-diet?focus=ingredients')}
          >
            <Icon name="leaf" size={20} />
            <strong>{t('home.actions.balancedTitle')}</strong>
            <span>{t('home.actions.balancedText')}</span>
          </button>
          <button type="button" className="home-action-tile" onClick={() => navigate('/meal-plans')}>
            <Icon name="calendar" size={20} />
            <strong>{t('home.actions.plansTitle')}</strong>
            <span>{t('home.actions.plansText')}</span>
          </button>
          <button type="button" className="home-action-tile" onClick={() => navigate('/shopping-list')}>
            <Icon name="list" size={20} />
            <strong>{t('home.actions.shoppingTitle')}</strong>
            <span>{t('home.actions.shoppingText')}</span>
          </button>
        </div>
      </RecipeSection>
    </main>
  )
}

export default AppHome
