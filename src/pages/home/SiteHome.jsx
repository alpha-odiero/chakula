import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import MealGrid from '../../components/MealGrid'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import CategoryCard from '../../components/CategoryCard'
import { useHomeData } from '../../hooks/useHomeData'
import { useTranslation } from '../../i18n/LocaleContext'
import sundayRoast from '../../assets/food/sunday-roast.jpg'
import sukuma from '../../assets/food/sukuma-wiki.jpg'
import ingredients from '../../assets/food/breakfast.jpg'

const STEPS = [
  {
    icon: 'search',
    title: 'home.steps.discover.title',
    text: 'home.steps.discover.text'
  },
  {
    icon: 'check',
    title: 'home.steps.ingredients.title',
    text: 'home.steps.ingredients.text'
  },
  {
    icon: 'cookingPot',
    title: 'home.steps.instructions.title',
    text: 'home.steps.instructions.text'
  }
]

function SiteHome() {
  const { t } = useTranslation()
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
              {t('home.hero.eyebrow')}
            </p>
            <h1 className="site-hero-title">
              {t('home.hero.title')}
              <span className="site-hero-accent"> {t('home.hero.titleAccent')}</span>
            </h1>
            <p className="site-hero-lead">{t('home.hero.lead')}</p>
            <div className="site-hero-actions">
              <Link to="/explore" className="button button--primary button--large">
                {t('home.hero.exploreCta')}
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/#how-it-works" className="button button--secondary button--large">
                {t('home.hero.howItWorks')}
              </Link>
            </div>
            <ul className="site-hero-benefits">
              <li>
                <Icon name="check" size={15} /> {t('home.hero.benefitDiscover')}
              </li>
              <li>
                <Icon name="check" size={15} /> {t('home.hero.benefitCook')}
              </li>
              <li>
                <Icon name="check" size={15} /> {t('home.hero.benefitSteps')}
              </li>
            </ul>
          </div>

          <div className="site-hero-media">
            <div className="site-hero-photo site-hero-photo--main">
              <img
                src={sundayRoast}
                alt={t('home.hero.imageAlt')}
                width="720"
                height="720"
                decoding="async"
              />
            </div>
            <div className="site-hero-photo site-hero-photo--accent">
              <img
                src={sukuma}
                alt={t('home.hero.accentImageAlt')}
                width="360"
                height="360"
                loading="lazy"
                decoding="async"
              />
            </div>
            {featuredName && (
              <div className="site-hero-panel">
                <p className="site-hero-panel-eyebrow">{t('home.hero.todayIdea')}</p>
                <p className="site-hero-panel-title">{featuredName}</p>
                {featuredMeta && <p className="site-hero-panel-meta">{featuredMeta}</p>}
                <Link to={`/meal/${featured.id ?? featured.idMeal}`} className="site-hero-panel-link">
                  {t('common.viewRecipe')}
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
            <p className="site-eyebrow">{t('home.discover.eyebrow')}</p>
            <h2 id="site-discover" className="site-section-title">
              {t('home.discover.title')}
            </h2>
            <p className="site-section-lead">{t('home.discover.lead')}</p>
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
              alt={t('home.ingredients.imageAlt')}
              width="640"
              height="520"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="site-ingredients-copy">
            <p className="site-eyebrow">{t('home.ingredients.eyebrow')}</p>
            <h2 id="site-ingredients" className="site-section-title">
              {t('home.ingredients.title')}
            </h2>
            <p className="site-section-lead">{t('home.ingredients.lead')}</p>
            <Link to="/balanced-diet?focus=ingredients" className="button button--primary button--large">
              {t('home.ingredients.cta')}
              <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section site-section" id="how-it-works" aria-labelledby="site-how">
        <div className="container">
          <div className="site-section-head site-section-head--center">
            <p className="site-eyebrow">{t('home.how.eyebrow')}</p>
            <h2 id="site-how" className="site-section-title">
              {t('home.how.title')}
            </h2>
          </div>
          <ol className="site-steps">
            {STEPS.map((step, index) => (
              <li className="site-step" key={step.title}>
                <span className="site-step-icon" aria-hidden="true">
                  <Icon name={step.icon} size={20} />
                </span>
                <span className="site-step-index">{t('home.stepLabel', { n: index + 1 })}</span>
                <h3 className="site-step-title">{t(step.title)}</h3>
                <p className="site-step-text">{t(step.text)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section site-section" aria-labelledby="site-featured">
        <div className="container">
          <div className="site-section-head">
            <p className="site-eyebrow">{t('home.featured.eyebrow')}</p>
            <h2 id="site-featured" className="site-section-title">
              {t('home.featured.title')}
            </h2>
            <p className="site-section-lead">{t('home.featured.lead')}</p>
          </div>

          {loading ? (
            <MealGrid loading skeletonCount={4} />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : recommended.length ? (
            <MealGrid meals={recommended.slice(0, 4)} fallbackCategory={category} />
          ) : (
            <EmptyState
              title={t('home.featured.emptyTitle')}
              message={t('home.featured.emptyMessage')}
              action={
                <button type="button" className="button button--primary" onClick={reload}>
                  {t('common.retryShort')}
                </button>
              }
            />
          )}
        </div>
      </section>

      <section className="site-cta">
        <div className="container site-cta-inner">
          <div>
            <h2 className="site-cta-title">{t('home.cta.title')}</h2>
            <p className="site-cta-text">{t('home.cta.text')}</p>
          </div>
          <div className="site-cta-actions">
            <Link to="/explore" className="button button--primary button--large">
              {t('home.cta.start')}
              <Icon name="arrowRight" size={18} />
            </Link>
            <Link to="/random" className="button button--secondary button--large">
              <Icon name="random" size={18} />
              {t('common.surpriseMe')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default SiteHome
