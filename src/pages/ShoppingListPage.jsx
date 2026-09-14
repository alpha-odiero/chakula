import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import InteractiveShoppingList from '../components/ShoppingList'
import { getMealPlans } from '../utils/storage'

function ShoppingListPage() {
  const [plans] = useState(() => getMealPlans())
  const [selectedId, setSelectedId] = useState(() => (plans[0] ? plans[0].id : null))
  const selectedPlan = plans.find((p) => p.id === selectedId) || null

  if (plans.length === 0) {
    return (
      <main className="about-page">
        <PageHeader eyebrow="Shopping List" title="Your Shopping Lists">
          <p className="page-subtitle">
            Build a balanced meal plan to see what you already have and what you might need.
          </p>
        </PageHeader>
        <section className="container">
          <EmptyState
            title="No shopping list yet"
            message="Shopping lists come from saved meal plans. Build a plan first and your list will show up here."
          >
            <Link to="/balanced-diet" className="button button--primary">
              <Icon name="sparkles" size={18} /> Build a Meal Plan
            </Link>
          </EmptyState>
        </section>
      </main>
    )
  }

  return (
    <main className="about-page">
      <PageHeader eyebrow="Shopping List" title="Your Shopping Lists">
        <p className="page-subtitle">
          Everything you need for your meal plan, with check-offs saved on this device.
        </p>
      </PageHeader>
      <section className="container">
        <div className="plan-picker" aria-label="Choose a meal plan">
          <label className="visually-hidden" htmlFor="shopping-plan-select">Meal plan</label>
          <select
            id="shopping-plan-select"
            className="ingredient-input"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || `${p.days}-Day Meal Plan`}
              </option>
            ))}
          </select>
        </div>
        {selectedPlan ? (
          <InteractiveShoppingList key={selectedPlan.id} plan={selectedPlan} />
        ) : (
          <EmptyState title="Plan not found" message="Pick a saved plan above." />
        )}
      </section>
    </main>
  )
}

export default ShoppingListPage