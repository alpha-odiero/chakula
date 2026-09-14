import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

function SearchBar({ defaultValue = '', placeholder = 'Search meals, ingredients…', size = 'normal', onSearch = null }) {
  const [value, setValue] = useState(defaultValue)
  const navigate = useNavigate()

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    const q = value.trim()
    if (!q) return
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
      aria-label="Search meals"
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
        required
        aria-label="Search for meals or ingredients"
      />
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  )
}

export default SearchBar