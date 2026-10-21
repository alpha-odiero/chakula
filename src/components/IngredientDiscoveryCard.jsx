import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useTranslation } from '../i18n/LocaleContext'

function IngredientDiscoveryCard({ to = '/balanced-diet?focus=ingredients' }) {
  const { t } = useTranslation()
  return (
    <Link to={to} className="ingredient-card">
      <span className="ingredient-card-icon" aria-hidden="true">
        <Icon name="shoppingBag" size={22} />
      </span>
      <span className="ingredient-card-body">
        <strong>{t('mealCard.ingredient.title')}</strong>
        <span>{t('mealCard.ingredient.text')}</span>
      </span>
      <span className="ingredient-card-cta">
        {t('mealCard.ingredient.cta')}
        <Icon name="arrowRight" size={16} />
      </span>
    </Link>
  )
}

export default IngredientDiscoveryCard
