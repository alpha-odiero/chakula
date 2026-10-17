import { Link } from 'react-router-dom'
import Icon from './Icon'
import SaveButton from './SaveButton'

function MealCard({ meal, fallbackCategory = null, fallbackArea = null }) {
  if (!meal) return null
  const id = meal.id ?? meal.idMeal
  const name = meal.name ?? meal.strMeal
  const image = meal.image ?? meal.strMealThumb
  const category = (meal.category ?? meal.strCategory ?? meal.strMealCategory ?? fallbackCategory) || null
  const area = (meal.area ?? meal.strArea ?? fallbackArea) || null

  return (
    <article className="meal-card">
      <Link className="meal-card-link" to={`/meal/${id}`} aria-label={`Open ${name} recipe`}>
        <div className="meal-card-media">
          <img
            className="meal-card-img"
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            width="680"
            height="480"
          />
          {category && <span className="meal-card-category">{category}</span>}
        </div>
        <div className="meal-card-body">
          <h3 className="meal-card-title">{name}</h3>
          {(area || category) && (
            <p className="meal-card-meta">
              {area ? (
                <span>
                  <Icon name="globe" size={13} />
                  <em>{area}</em>
                </span>
              ) : (
                <span>
                  <Icon name="utensils" size={13} />
                  <em>{category}</em>
                </span>
              )}
            </p>
          )}
        </div>
      </Link>
      <SaveButton meal={meal} />
    </article>
  )
}

export default MealCard
