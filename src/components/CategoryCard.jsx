import { Link } from 'react-router-dom'

import { slugify as slugifyCategory } from '../services/meals'

function CategoryCard({ category }) {
  const str = category.name ?? category.strCategory
  const slug = str ? slugifyCategory(str) : ''
  const thumb = category.image ?? category.strCategoryThumb
  const description = category.description ?? category.strCategoryDescription

  return (
    <Link className="category-card" to={`/categories/${slug}`}>
      <div className="category-card-media">
        <img
          className="category-card-img"
          src={thumb}
          alt={str}
          loading="lazy"
          decoding="async"
          width="512"
          height="512"
        />
      </div>
      <div className="category-card-body">
        <h3 className="category-card-title">{str}</h3>
        {description && (
          <p className="category-card-desc">{description}</p>
        )}
        <span className="category-card-cta">
          Browse meals
          <svg className="category-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

export default CategoryCard