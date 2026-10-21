import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import InteractiveShoppingList from '../components/ShoppingList'
import { getMealPlans } from '../utils/storage'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

function ShoppingListPage() {
  const { t } = useTranslation()
  useSeo({
    title: t('shopping.seoTitle'),
    description: t('shopping.seoDescription'),
    path: '/shopping-list',
    robots: 'noindex,follow'
  })
  const [plans] = useState(() => getMealPlans())
  const [selectedId, setSelectedId] = useState(() => (plans[0] ? plans[0].id : null))
  const selectedPlan = plans.find((p) => p.id === selectedId) || null

  if (plans.length === 0) {
    return (
      <main className="about-page">
        <PageHeader eyebrow={t('shopping.eyebrow')} title={t('shopping.title')}>
          <p className="page-subtitle">{t('shopping.emptySubtitle')}</p>
        </PageHeader>
        <section className="container">
          <EmptyState title={t('shopping.emptyTitle')} message={t('shopping.emptyMessage')}>
            <Link to="/balanced-diet" className="button button--primary">
              <Icon name="sparkles" size={18} /> {t('common.buildMealPlan')}
            </Link>
          </EmptyState>
        </section>
      </main>
    )
  }

  return (
    <main className="about-page">
      <PageHeader eyebrow={t('shopping.eyebrow')} title={t('shopping.title')}>
        <p className="page-subtitle">{t('shopping.subtitle')}</p>
      </PageHeader>
      <section className="container">
        <div className="plan-picker" aria-label={t('shopping.choosePlanAria')}>
          <label className="visually-hidden" htmlFor="shopping-plan-select">{t('shopping.planLabel')}</label>
          <select
            id="shopping-plan-select"
            className="ingredient-input"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || t('common.dayMealPlan', { days: p.days })}
              </option>
            ))}
          </select>
        </div>
        {selectedPlan ? (
          <InteractiveShoppingList key={selectedPlan.id} plan={selectedPlan} />
        ) : (
          <EmptyState title={t('shopping.planNotFoundTitle')} message={t('shopping.planNotFoundMessage')} />
        )}
      </section>
    </main>
  )
}

export default ShoppingListPage