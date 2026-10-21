import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import InteractiveShoppingList from '../components/ShoppingList'
import { useToast } from '../components/Toast'
import { getMealPlans, removeMealPlan, clearMealPlans } from '../utils/storage'
import { supportsWebShare, supportsClipboard } from '../utils/platform'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

// Slot names come from a shared planner config, so they are resolved at the
// render site instead of being baked into the plan data.
const SLOT_KEYS = {
  breakfast: 'config.slot.breakfast',
  lunch: 'config.slot.lunch',
  dinner: 'config.slot.dinner',
  snack: 'config.slot.snack'
}

function slotLabel(slot, t) {
  const raw = slot?.slot || slot?.type || ''
  const key = SLOT_KEYS[String(raw).toLowerCase()]
  return key ? t(key) : raw
}

function MealPlans() {
  const { t } = useTranslation()
  useSeo({
    title: t('plans.seoTitle'),
    description: t('plans.seoDescription'),
    path: '/meal-plans',
    robots: 'noindex,follow'
  })
  const [plans, setPlans] = useState(() => getMealPlans())
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const toast = useToast()

  const showMessage = (text, variant = 'success') => toast.notify(text, { variant })

  const handleDelete = (id) => {
    const next = removeMealPlan(id)
    setPlans(next)
    setConfirmDelete(null)
    if (expandedId === id) setExpandedId(null)
    showMessage(t('plans.deletedToast'))
  }

  const handleClearAll = () => {
    setPlans(clearMealPlans())
    setConfirmDeleteAll(false)
    setExpandedId(null)
    showMessage(t('plans.clearedToast'))
  }

  const copyPlan = async (plan) => {
    const text = formatPlanText(plan, t)
    if (supportsWebShare()) {
      try {
        await navigator.share({ title: plan.label || t('plans.defaultTitle'), text })
        return
      } catch {
        /* fall back to copy */
      }
    }
    if (supportsClipboard()) {
      try {
        await navigator.clipboard.writeText(text)
        showMessage(t('plans.copiedToast'))
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
      showMessage(t('plans.copiedToast'))
    } catch {
      showMessage(t('plans.copyFailedToast'), 'error')
    }
  }

  return (
    <main className="about-page">
      <PageHeader eyebrow={t('plans.eyebrow')} title={t('plans.title')}>
        <p className="page-subtitle">{t('plans.subtitle')}</p>
      </PageHeader>

      <section className="container">
        {plans.length === 0 ? (
          <EmptyState title={t('plans.emptyTitle')} message={t('plans.emptyMessage')}>
            <Link to="/balanced-diet" className="button button--primary">
              <Icon name="sparkles" size={18} /> {t('common.buildMealPlan')}
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="plan-toolbar">
              <p className="plan-count">{t('plans.savedCount', { count: plans.length })}</p>
              <button type="button" className="button button--ghost button--small" onClick={() => setConfirmDeleteAll(true)}>
                {t('common.clearAll')}
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
                        <strong>{plan.label || t('common.dayMealPlan', { days: plan.days })}</strong>
                        <span>
                          {plan.days} {t('common.day', { count: plan.days })} ·{' '}
                          {t('plans.summary.mealsPerDay', { count: plan.mealsPerDay })} ·{' '}
                          {plan.ingredients.length} {t('common.ingredient', { count: plan.ingredients.length })}
                        </span>
                      </span>
                      <span className="plan-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={t('plans.copyPlanAria')}
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
                          aria-label={t('plans.deletePlanAria')}
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
                            <h4>{t('common.day', { n: day.day })}</h4>
                            <ul className="saved-plan-meals">
                              {day.meals.map((slot) => (
                                <li key={(slot.meal.id ?? slot.meal.idMeal) + slot.slot}>
                                  <img
                                    src={slot.meal.image ?? slot.meal.strMealThumb}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    width="48"
                                    height="48"
                                  />
                                  <span>
                                    <strong>{slotLabel(slot, t)}</strong>
                                    <Link to={`/meal/${slot.meal.id ?? slot.meal.idMeal}`}>{slot.meal.name ?? slot.meal.strMeal}</Link>
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
          title={t('plans.deleteTitle')}
          message={t('plans.deleteMessage')}
          confirmLabel={t('plans.deleteConfirm')}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteAll && (
        <ConfirmDialog
          title={t('plans.clearAllTitle')}
          message={t('plans.clearAllMessage')}
          confirmLabel={t('common.clearAll')}
          onConfirm={handleClearAll}
          onCancel={() => setConfirmDeleteAll(false)}
        />
      )}
    </main>
  )
}

function formatPlanText(plan, t) {
  const lines = [plan.label || t('plans.yourPlanTitle', { days: plan.days })]
  plan.meals.forEach((day) => {
    lines.push(`\n${t('common.day', { n: day.day })}`)
    day.meals.forEach((slot) => {
      lines.push(`${slotLabel(slot, t)}: ${slot.meal.name ?? slot.meal.strMeal}`)
    })
  })
  return lines.join('\n')
}

export default MealPlans