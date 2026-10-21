import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import MealGrid from '../components/MealGrid'
import Icon from '../components/Icon'
import { usePreferences } from '../components/PreferencesProvider'
import { useReminders } from '../components/ReminderProvider'
import { periodById } from '../config/reminders'
import { fetchReminderSuggestions } from '../services/reminderContent'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

function Reminder() {
  const { t } = useTranslation()
  useSeo({
    title: t('reminder.seoTitle'),
    description: t('reminder.seoDescription'),
    path: '/reminder',
    robots: 'noindex,follow'
  })
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const { reminders } = useReminders()

  const periodId = params.get('period') || ''
  const period = periodById(periodId)
  const label = period ? t(`config.period.${period.id}`) : t('config.period.default')

  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const count = reminders?.suggestionCount || 3

  const loadSuggestions = useMemo(
    () => async () => {
      setLoading(true)
      setError(null)
      try {
        const picks = await fetchReminderSuggestions(reminders, preferences, count)
        setMeals(picks)
      } catch (err) {
        setError(err)
        setMeals([])
      } finally {
        setLoading(false)
      }
    },
    [reminders, preferences, count]
  )

  useEffect(() => {
    let active = true
    if (active) loadSuggestions()
    return () => {
      active = false
    }
  }, [loadSuggestions])

  return (
    <main className="reminder-page">
      <PageHeader
        eyebrow={period ? t('reminder.eyebrowPeriod', { label }) : t('reminder.eyebrow')}
        title={t('reminder.title', { label })}
        subtitle={t('reminder.subtitle')}
      />
      <section className="container reminder-body">
        <div className="reminder-actions">
          <button type="button" className="button button--primary" onClick={() => navigate('/random')}>
            <Icon name="sparkles" size={16} /> {t('common.surpriseMe')}
          </button>
          <Link to="/explore" className="button button--secondary">
            <Icon name="globe" size={16} /> {t('reminder.browseIdeas')}
          </Link>
          <button type="button" className="button button--ghost" onClick={loadSuggestions}>
            <Icon name="refresh" size={16} /> {t('reminder.newIdeas')}
          </button>
        </div>

        <h2 className="reminder-section-title">
          <Icon name="utensils" size={16} /> {t('reminder.ideasFor', { label })}
        </h2>
        <MealGrid
          meals={meals}
          loading={loading}
          error={error}
          onRetry={loadSuggestions}
          emptyTitle={t('reminder.emptyTitle')}
          emptyMessage={t('reminder.emptyMessage')}
        />
      </section>
    </main>
  )
}

export default Reminder
