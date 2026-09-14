import { Link } from 'react-router-dom'

function MealCard({ meal, index = 0 }) {
  if (!meal) return null
  const id = meal.idMeal || meal.id
  const name = meal.strMeal || meal.name
  const image = meal.strMealThumb || meal.image
  const category = meal.strMealCategory || null
  const area = meal.strArea || null

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
          {area && <p className="meal-card-meta">{area}</p>}
        </div>
      </Link>
    </article>
  )
}

export default MealCard