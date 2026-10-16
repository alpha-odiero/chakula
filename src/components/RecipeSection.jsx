import { Link } from 'react-router-dom'
import Icon from './Icon'

function RecipeSection({ title, actionTo = null, actionLabel = 'See all', children, id = null }) {
  return (
    <section className="section recipe-section" aria-label={title} id={id}>
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">{title}</h2>
          {actionTo && (
            <Link to={actionTo} className="section-link">
              {actionLabel}
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
