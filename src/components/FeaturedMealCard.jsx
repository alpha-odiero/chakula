import { Link } from 'react-router-dom'
import Icon from './Icon'

function FeaturedMealCard({ meal, eyebrow = "TODAY'S INSPIRATION" }) {
  if (!meal) return null

  const id = meal.id ?? meal.idMeal
  const name = meal.name ?? meal.strMeal
  const image = meal.image ?? meal.strMealThumb
  const category = meal.category ?? meal.strCategory
  const area = meal.area ?? meal.strArea
  const meta = [category, area].filter(Boolean).join(' · ')

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
