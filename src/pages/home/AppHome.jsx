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

function AppHome() {
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
      <h1 className="visually-hidden">Pikawise — discover meals and cook with what you have</h1>
      <section className="app-home-top">
        <div className="container">
          <SearchBar
            size="large"
            placeholder="Find recipes, meals or ingredients…"
            filterTo="/explore"
            filterLabel="Filter recipes"
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

      <RecipeSection title="Recommended for you" actionTo="/explore">
        {loading ? (
          <MealGrid loading skeletonCount={4} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : recommended.length ? (
          <MealGrid meals={recommended} fallbackCategory={category} />
        ) : (
          <EmptyState
            title="Nothing to show yet"
            message="We couldn't load recipe ideas right now. Try again or browse all recipes."
            action={
              <button type="button" className="button button--primary" onClick={reload}>
                Retry
              </button>
            }
          />
        )}
      </RecipeSection>

      {areas.length > 0 && (
        <RecipeSection title="Explore cuisines" actionTo="/explore" actionLabel="Browse all">
          <CuisineChips areas={areas} />
        </RecipeSection>
      )}

      {saved.length > 0 && (
        <RecipeSection title="Saved for later" actionTo="/favorites">
          <MealGrid meals={saved} className="meal-grid--rail" skeletonCount={4} />
        </RecipeSection>
      )}

      <RecipeSection title="More ways to cook" actionTo={null}>
        <div className="home-actions-grid">
          <button type="button" className="home-action-tile" onClick={() => navigate('/random')}>
            <Icon name="random" size={20} />
            <strong>Surprise me</strong>
            <span>A random recipe to cook</span>
          </button>
          <button
            type="button"
            className="home-action-tile"
            onClick={() => navigate('/balanced-diet?focus=ingredients')}
          >
            <Icon name="leaf" size={20} />
            <strong>Plan a balanced day</strong>
            <span>Build meals from your food</span>
          </button>
          <button type="button" className="home-action-tile" onClick={() => navigate('/meal-plans')}>
            <Icon name="calendar" size={20} />
            <strong>Saved meal plans</strong>
            <span>Pick up where you left off</span>
          </button>
          <button type="button" className="home-action-tile" onClick={() => navigate('/shopping-list')}>
            <Icon name="list" size={20} />
            <strong>Shopping list</strong>
            <span>What you still need to buy</span>
          </button>
        </div>
      </RecipeSection>
    </main>
  )
}

export default AppHome
