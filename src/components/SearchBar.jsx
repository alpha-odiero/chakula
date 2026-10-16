import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'

function SearchBar({
  defaultValue = '',
  placeholder = 'Find recipes, meals or ingredients…',
  size = 'normal',
  onSearch = null,
  filterTo = null,
  filterLabel = 'Open filters'
}) {
  const [value, setValue] = useState(defaultValue)
  const navigate = useNavigate()

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    const q = value.trim()
    if (!q) {
      if (filterTo) navigate(filterTo)
      return
    }
    if (onSearch) {
      onSearch(q)
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form
      className={`search-bar search-bar--${size}`}
      onSubmit={handleSubmit}
      role="search"
      aria-label="Search recipes"
    >
      <span className="search-icon" aria-hidden="true">
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search recipes, meals or ingredients"
        enterKeyHint="search"
      />
      <button type="submit" className="search-button">
        Search
      </button>
      {filterTo && (
        <Link to={filterTo} className="search-filter" aria-label={filterLabel}>
          <Icon name="sliders" size={18} />
        </Link>
      )}
    </form>
  )
}

export default SearchBar
