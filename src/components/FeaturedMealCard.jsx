import { Link } from 'react-router-dom'
import Icon from './Icon'

function FeaturedMealCard({ meal, eyebrow = "TODAY'S INSPIRATION" }) {
  if (!meal) return null

  const id = meal.idMeal || meal.id
  const name = meal.strMeal || meal.name
  const image = meal.strMealThumb || meal.image
  const meta = [meal.strCategory, meal.strArea].filter(Boolean).join(' · ')

  return (
    <article className="featured-card">
      <div className="featured-card-body">
        <p className="featured-card-eyebrow">{eyebrow}</p>
        <h2 className="featured-card-title">{name}</h2>
        <p className="featured-card-text">
          {meta ? `${meta} — ready when you are.` : 'A fresh idea to cook today.'}
        </p>
        <Link to={`/meal/${id}`} className="button button--primary featured-card-cta">
          View recipe
          <Icon name="arrowRight" size={17} />
        </Link>
      </div>
      <Link to={`/meal/${id}`} className="featured-card-media" tabIndex={-1} aria-hidden="true">
        <img src={image} alt="" loading="eager" decoding="async" width="480" height="360" />
      </Link>
    </article>
  )
}

export default FeaturedMealCard
