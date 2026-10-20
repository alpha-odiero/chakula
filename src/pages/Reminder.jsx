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

function Reminder() {
  useSeo({
    title: 'Meal reminder — Pikawise',
    description: 'Meal suggestions for your reminder.',
    path: '/reminder',
    robots: 'noindex,follow'
  })
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const { reminders } = useReminders()

  const periodId = params.get('period') || ''
  const period = periodById(periodId)
  const label = period?.label || 'your meal'

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
        eyebrow={period ? `${label} reminder` : 'Meal reminder'}
        title={`What are you having for ${label.toLowerCase()}?`}
        subtitle="Pick an idea, log your meal, or shuffle for something new."
      />
      <section className="container reminder-body">
        <div className="reminder-actions">
          <button type="button" className="button button--primary" onClick={() => navigate('/random')}>
            <Icon name="sparkles" size={16} /> Surprise me
          </button>
          <Link to="/explore" className="button button--secondary">
            <Icon name="globe" size={16} /> Browse ideas
          </Link>
          <button type="button" className="button button--ghost" onClick={loadSuggestions}>
            <Icon name="refresh" size={16} /> New ideas
          </button>
        </div>

        <h2 className="reminder-section-title">
          <Icon name="utensils" size={16} /> Ideas for {label.toLowerCase()}
        </h2>
        <MealGrid
          meals={meals}
          loading={loading}
          error={error}
          onRetry={loadSuggestions}
          emptyTitle="No ideas right now"
          emptyMessage="You may be offline. Try again or browse all recipes."
        />
      </section>
    </main>
  )
}

export default Reminder
