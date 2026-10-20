import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import MealGrid from '../../components/MealGrid'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import CategoryCard from '../../components/CategoryCard'
import { useHomeData } from '../../hooks/useHomeData'
import sundayRoast from '../../assets/food/sunday-roast.jpg'
import sukuma from '../../assets/food/sukuma-wiki.jpg'
import ingredients from '../../assets/food/breakfast.jpg'

const STEPS = [
  {
    icon: 'search',
    title: 'Discover a meal',
    text: 'Search by name or ingredient, browse categories, or see what the community is cooking.'
  },
  {
    icon: 'check',
    title: 'Check the ingredients',
    text: 'See exactly what you need, scale the servings, and tick off what you already have.'
  },
  {
    icon: 'cookingPot',
    title: 'Follow the cooking instructions',
    text: 'Follow clear, numbered steps in a distraction-free cooking mode built for the kitchen.'
  }
]

function SiteHome() {
  const { featured, recommended, category, categories, loading, error, reload } = useHomeData()

  const featuredName = featured?.name ?? featured?.strMeal
  const featuredCategory = featured?.category ?? featured?.strCategory
  const featuredArea = featured?.area ?? featured?.strArea
  const featuredMeta = [featuredCategory, featuredArea].filter(Boolean).join(' · ')

  return (
    <main className="site-home">
      <section className="site-hero">
        <div className="container site-hero-inner">
          <div className="site-hero-copy">
            <p className="site-hero-eyebrow">
              <Icon name="cookingPot" size={15} />
              Your everyday cooking companion
            </p>
            <h1 className="site-hero-title">
              Discover what to cook.
              <span className="site-hero-accent"> Learn how to make it.</span>
            </h1>
            <p className="site-hero-lead">
              Find inspiring meals, explore recipes using ingredients you already have, and follow
              clear cooking instructions from preparation to the final plate.
            </p>
            <div className="site-hero-actions">
              <Link to="/explore" className="button button--primary button--large">
                Explore recipes
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/#how-it-works" className="button button--secondary button--large">
                How it works
              </Link>
            </div>
            <ul className="site-hero-benefits">
              <li>
                <Icon name="check" size={15} /> Discover new meals
              </li>
              <li>
                <Icon name="check" size={15} /> Cook with what you have
              </li>
              <li>
                <Icon name="check" size={15} /> Follow step-by-step recipes
              </li>
            </ul>
          </div>

          <div className="site-hero-media">
            <div className="site-hero-photo site-hero-photo--main">
              <img
                src={sundayRoast}
                alt="A hearty Sunday roast plated with vegetables"
                width="720"
                height="720"
                decoding="async"
              />
            </div>
            <div className="site-hero-photo site-hero-photo--accent">
              <img
                src={sukuma}
                alt="A colourful plate of greens and vegetables"
                width="360"
                height="360"
                loading="lazy"
                decoding="async"
              />
            </div>
            {featuredName && (
              <div className="site-hero-panel">
                <p className="site-hero-panel-eyebrow">Today&apos;s idea</p>
                <p className="site-hero-panel-title">{featuredName}</p>
                {featuredMeta && <p className="site-hero-panel-meta">{featuredMeta}</p>}
                <Link to={`/meal/${featured.id ?? featured.idMeal}`} className="site-hero-panel-link">
                  View recipe
                  <Icon name="arrowRight" size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section site-section" aria-labelledby="site-discover">
        <div className="container">
          <div className="site-section-head">
            <p className="site-eyebrow">Meal discovery</p>
            <h2 id="site-discover" className="site-section-title">
              Find your next favorite meal
            </h2>
            <p className="site-section-lead">
              Explore recipes and discover dishes for every kind of day.
            </p>
          </div>

          {loading ? (
            <div className="category-grid category-grid--cards">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="category-card" key={i} aria-hidden="true">
                  <span className="skeleton-block skeleton-category-img" />
                </div>
              ))}
            </div>
          ) : (
            <div className="category-grid category-grid--cards">
              {categories
                .slice(0, 6)
                .filter((cat) => (cat.name ?? cat.strCategory) !== 'Pasta')
                .map((cat) => (
                  <CategoryCard key={cat.name ?? cat.strCategory} category={cat} />
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="site-ingredients" aria-labelledby="site-ingredients">
        <div className="container site-ingredients-inner">
          <div className="site-ingredients-media">
            <img
              src={ingredients}
              alt="Fresh ingredients laid out on a table"
              width="640"
              height="520"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="site-ingredients-copy">
            <p className="site-eyebrow">Cook with what you have</p>
            <h2 id="site-ingredients" className="site-section-title">
              Make something delicious with what you have
            </h2>
            <p className="site-section-lead">
              Tell Pikawise which ingredients are already in your kitchen and we will suggest meals
              you can actually make today — with a shopping list for anything you are missing.
            </p>
            <Link to="/balanced-diet?focus=ingredients" className="button button--primary button--large">
              Find recipes
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section site-section" id="how-it-works" aria-labelledby="site-how">
        <div className="container">
          <div className="site-section-head site-section-head--center">
            <p className="site-eyebrow">How Pikawise works</p>
            <h2 id="site-how" className="site-section-title">
              From &ldquo;what&rsquo;s for dinner?&rdquo; to the first bite
            </h2>
          </div>
          <ol className="site-steps">
            {STEPS.map((step, index) => (
              <li className="site-step" key={step.title}>
                <span className="site-step-icon" aria-hidden="true">
                  <Icon name={step.icon} size={20} />
                </span>
                <span className="site-step-index">Step {index + 1}</span>
                <h3 className="site-step-title">{step.title}</h3>
                <p className="site-step-text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section site-section" aria-labelledby="site-featured">
        <div className="container">
          <div className="site-section-head">
            <p className="site-eyebrow">Featured recipes</p>
            <h2 id="site-featured" className="site-section-title">
              Straight from the kitchen
            </h2>
            <p className="site-section-lead">
              A hand-picked selection of recipes to cook this week.
            </p>
          </div>

          {loading ? (
            <MealGrid loading skeletonCount={4} />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : recommended.length ? (
            <MealGrid meals={recommended.slice(0, 4)} fallbackCategory={category} />
          ) : (
            <EmptyState
              title="Recipes are on the way"
              message="We couldn't load recipes right now. Please try again."
              action={
                <button type="button" className="button button--primary" onClick={reload}>
                  Retry
                </button>
              }
            />
          )}
        </div>
      </section>

      <section className="site-cta">
        <div className="container site-cta-inner">
          <div>
            <h2 className="site-cta-title">Your next great meal starts here.</h2>
            <p className="site-cta-text">
              Find inspiration, explore recipes, and make cooking feel easier.
            </p>
          </div>
          <div className="site-cta-actions">
            <Link to="/explore" className="button button--primary button--large">
              Start exploring
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/random" className="button button--secondary button--large">
              <Icon name="random" size={18} />
              Surprise me
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default SiteHome
