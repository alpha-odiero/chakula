import { Link } from 'react-router-dom'
import Icon from './Icon'

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function CategoryScroller({ categories = [], loading = false }) {
  if (!loading && (!categories || categories.length === 0)) return null

  return (
    <div className="category-scroller" role="list">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div className="category-scroll-item" key={i} role="listitem" aria-hidden="true">
              <span className="category-scroll-thumb skeleton-block" />
              <span className="category-scroll-label skeleton-block" />
            </div>
          ))
        : categories.map((category) => (
            <Link
              key={category.strCategory}
              to={`/explore?category=${encodeURIComponent(category.strCategory)}`}
              className="category-scroll-item"
              role="listitem"
            >
              <span className="category-scroll-thumb">
                <img
                  src={category.strCategoryThumb}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="80"
                  height="80"
                />
              </span>
              <span className="category-scroll-label">{category.strCategory}</span>
            </Link>
          ))}
    </div>
  )
}

export function CuisineChips({ areas = [] }) {
  if (!areas.length) return null
  return (
    <div className="chip-row">
      {areas.map((area) => (
        <Link
          key={area}
          to={`/explore?area=${encodeURIComponent(area)}`}
          className="chip chip--browse"
        >
          <Icon name="globe" size={14} />
          {area}
        </Link>
      ))}
    </div>
  )
}

export { slugify }
export default CategoryScroller
