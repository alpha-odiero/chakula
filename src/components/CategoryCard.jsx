import { Link } from 'react-router-dom'

function CategoryCard({ category }) {
  const str = category.strCategory
  const slug = str ? str.toLowerCase().replace(/[^a-z0-9]+/g, '') : ''

  return (
    <Link className="category-card" to={`/categories/${slug}`}>
      <div className="category-card-media">
        <img
          className="category-card-img"
          src={category.strCategoryThumb}
          alt={str}
          loading="lazy"
          decoding="async"
          width="512"
          height="512"
        />
      </div>
      <div className="category-card-body">
        <h3 className="category-card-title">{str}</h3>
        {category.strCategoryDescription && (
          <p className="category-card-desc">{category.strCategoryDescription}</p>
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