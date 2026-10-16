import { Link } from 'react-router-dom'
import Icon from './Icon'

function IngredientDiscoveryCard({ to = '/balanced-diet?focus=ingredients' }) {
  return (
    <Link to={to} className="ingredient-card">
      <span className="ingredient-card-icon" aria-hidden="true">
        <Icon name="shoppingBag" size={22} />
      </span>
      <span className="ingredient-card-body">
        <strong>Cook with what you have</strong>
        <span>Choose your ingredients and discover meals you can make.</span>
      </span>
      <span className="ingredient-card-cta">
        Choose ingredients
        <Icon name="arrowRight" size={16} />
      </span>
    </Link>
  )
}

export default IngredientDiscoveryCard
