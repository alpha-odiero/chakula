import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useTranslation } from '../i18n/LocaleContext'

function RecipeSection({ title, actionTo = null, actionLabel = null, children, id = null }) {
  const { t } = useTranslation()
  return (
    <section className="section recipe-section" aria-label={title} id={id}>
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">{title}</h2>
          {actionTo && (
            <Link to={actionTo} className="section-link">
              {actionLabel ?? t('meal.seeAll')}
              <Icon name="arrowRight" size={15} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

export default RecipeSection
