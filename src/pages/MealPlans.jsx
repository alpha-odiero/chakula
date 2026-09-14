import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import InteractiveShoppingList from '../components/ShoppingList'
import { getMealPlans, removeMealPlan, clearMealPlans } from '../utils/storage'
import { supportsWebShare, supportsClipboard } from '../utils/platform'

function MealPlans() {
  const [plans, setPlans] = useState(() => getMealPlans())
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [message, setMessage] = useState(null)

  const showMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 2500)
  }

  const handleDelete = (id) => {
    const next = removeMealPlan(id)
    setPlans(next)
    setConfirmDelete(null)
    if (expandedId === id) setExpandedId(null)
    showMessage('Plan deleted.')
  }

  const handleClearAll = () => {
    setPlans(clearMealPlans())
    setConfirmDeleteAll(false)
    setExpandedId(null)
    showMessage('All plans cleared.')
  }

  const copyPlan = async (plan) => {
    const text = formatPlanText(plan)
    if (supportsWebShare()) {
      try {
        await navigator.share({ title: plan.label || 'Meal Plan', text })
        return
      } catch {
        /* fall back to copy */
      }
    }
    if (supportsClipboard()) {
      try {
        await navigator.clipboard.writeText(text)
        showMessage('Plan copied!')
        return
      } catch {
        /* fall through */
      }
    }
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showMessage('Plan copied!')
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <main className="about-page">
      <PageHeader eyebrow="Meal Plans" title="Your Saved Plans">
        <p className="page-subtitle">
          Saved plans are stored on this device. Open a plan to see its meals and shopping list.
        </p>
      </PageHeader>

      <section className="container">
        {message && <p className="toast toast--success" role="status">{message}</p>}

        {plans.length === 0 ? (
          <EmptyState
            title="No saved plans yet"
            message="Build a balanced meal plan and save it — it'll stay here until you need it."
          >
            <Link to="/balanced-diet" className="button button--primary">
              <Icon name="sparkles" size={18} /> Build a Meal Plan
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="plan-toolbar">
              <p className="plan-count">{plans.length} saved plan{plans.length === 1 ? '' : 's'}</p>
              <button type="button" className="button button--ghost button--small" onClick={() => setConfirmDeleteAll(true)}>
                Clear all
              </button>
            </div>

            <div className="saved-plans-list">
              {plans.map((plan, index) => {
                const isExpanded = expandedId === plan.id
                return (
                  <article key={plan.id} className="saved-plan-card">
                    <button
                      type="button"
                      className="saved-plan-toggle"
                      onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="saved-plan-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="saved-plan-heading">
                        <strong>{plan.label || `${plan.days}-Day Meal Plan`}</strong>
                        <span>
                          {plan.days} day{plan.days > 1 ? 's' : ''} · {plan.mealsPerDay} meals/day ·{' '}
                          {plan.ingredients.length} ingredient{plan.ingredients.length === 1 ? '' : 's'}
                        </span>
                      </span>
                      <span className="plan-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Copy this plan"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyPlan(plan)
                          }}
                        >
                          <Icon name="copy" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Delete this plan"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(plan.id)
                          }}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                        <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="saved-plan-detail">
                        {plan.meals.map((day) => (
                          <div key={day.day} className="saved-plan-day">
                            <h4>Day {day.day}</h4>
                            <ul className="saved-plan-meals">
                              {day.meals.map((slot) => (
                                <li key={slot.meal.idMeal + slot.slot}>
                                  <img
                                    src={slot.meal.strMealThumb}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    width="48"
                                    height="48"
                                  />
                                  <span>
                                    <strong>{slot.slot}</strong>
                                    <Link to={`/meal/${slot.meal.idMeal}`}>{slot.meal.strMeal}</Link>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <InteractiveShoppingList plan={plan} />
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this meal plan?"
          message="You won't be able to undo this."
          confirmLabel="Delete plan"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmDialog
          title="Clear all saved plans?"
          message="All saved meal plans on this device will be removed."
          confirmLabel="Clear all"
          onConfirm={handleClearAll}
          onCancel={() => setConfirmDeleteAll(false)}
        />
      )}
    </main>
  )
}

function formatPlanText(plan) {
  const lines = [plan.label || `Your ${plan.days}-Day Meal Plan`]
  plan.meals.forEach((day) => {
    lines.push(`\nDay ${day.day}`)
    day.meals.forEach((slot) => {
      lines.push(`${slot.slot}: ${slot.meal.strMeal}`)
    })
  })
  return lines.join('\n')
}

export default MealPlans