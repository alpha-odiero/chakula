import { useTranslation } from '../i18n/LocaleContext'

function LoadingSkeleton({ variant = 'meal' }) {
  const { t } = useTranslation()

  const classes = {
    meal: 'skeleton-card',
    category: 'skeleton-category',
    detail: 'skeleton-detail'
  }

  if (variant === 'category') {
    return (
      <div className="skeleton skeleton-category" role="presentation" aria-hidden="true">
        <span className="skeleton-block skeleton-block--image skeleton-category-img" />
        <span className="skeleton-block skeleton-block--text" />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="skeleton-detail" role="status" aria-label={t('loader.loadingRecipe')}>
        <div className="container meal-detail-layout">
          <div className="meal-detail-hero">
            <span className="skeleton-block skeleton-detail-hero" />
            <div className="skeleton-stack skeleton-detail-intro">
              <span className="skeleton-block skeleton-block--title" />
              <span className="skeleton-block skeleton-block--line" />
              <span className="skeleton-block skeleton-block--line" />
            </div>
          </div>
          <div className="meal-detail-content">
            <div className="skeleton skeleton-panel">
              <div className="skeleton-stack">
                <span className="skeleton-block skeleton-block--title" />
                <span className="skeleton-block skeleton-block--line" />
                <span className="skeleton-block skeleton-block--line" />
                <span className="skeleton-block skeleton-block--line" />
              </div>
            </div>
            <div className="skeleton skeleton-panel">
              <div className="skeleton-stack">
                <span className="skeleton-block skeleton-block--title" />
                <span className="skeleton-block skeleton-block--line" />
                <span className="skeleton-block skeleton-block--line" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="skeleton skeleton-card" role="presentation" aria-hidden="true">
      <span className="skeleton-block skeleton-block--image" />
      <span className="skeleton-block skeleton-block--text skeleton-block--title" />
      <span className="skeleton-block skeleton-block--text" />
    </div>
  )
}

export default LoadingSkeleton