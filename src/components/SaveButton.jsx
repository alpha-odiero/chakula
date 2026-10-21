import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import { useToast } from './Toast'
import { isFavorite, toggleFavorite } from '../utils/favorites'

function SaveButton({ meal, className = '' }) {
  const { t } = useTranslation()
  const id = meal?.id ?? meal?.idMeal
  const [saved, setSaved] = useState(() => (id ? isFavorite(id) : false))
  const toast = useToast()

  useEffect(() => {
    setSaved(id ? isFavorite(id) : false)
  }, [id])

  if (!id) return null

  const name = meal.name ?? meal.strMeal ?? t('app.recipeFallback')

  const handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    toggleFavorite(meal)
    const nowSaved = isFavorite(id)
    setSaved(nowSaved)
    if (nowSaved) toast.success(t('app.recipeSaved'))
    else toast.info(t('app.recipeRemoved'))
  }

  return (
    <button
      type="button"
      className={`meal-save ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? t('app.removeFromSaved', { name }) : t('app.saveToSaved', { name })}
      onClick={handleClick}
    >
      <Icon name={saved ? 'heartFilled' : 'heart'} size={18} />
    </button>
  )
}

export default SaveButton
