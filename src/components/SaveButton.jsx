import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useToast } from './Toast'
import { isFavorite, toggleFavorite } from '../utils/favorites'

function SaveButton({ meal, className = '' }) {
  const id = meal?.id ?? meal?.idMeal
  const [saved, setSaved] = useState(() => (id ? isFavorite(id) : false))
  const toast = useToast()

  useEffect(() => {
    setSaved(id ? isFavorite(id) : false)
  }, [id])

  if (!id) return null

  const name = meal.name ?? meal.strMeal ?? 'recipe'

  const handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    toggleFavorite(meal)
    const nowSaved = isFavorite(id)
    setSaved(nowSaved)
    if (nowSaved) toast.success('Recipe saved.')
    else toast.info('Removed from saved recipes.')
  }

  return (
    <button
      type="button"
      className={`meal-save ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved recipes` : `Save ${name} to saved recipes`}
      onClick={handleClick}
    >
      <Icon name={saved ? 'heartFilled' : 'heart'} size={18} />
    </button>
  )
}

export default SaveButton
