import MealCard from './MealCard'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import { getErrorMessage } from '../hooks/useApi'

function MealGrid({ meals, loading = false, error = null, emptyTitle = 'No meals found', emptyMessage = 'Try a different search.', onRetry }) {
  if (loading) {
    return (
      <div className="meal-grid" role="status" aria-label="Loading meals">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="meal" />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
  }

  if (!meals || meals.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  const uniqueMeals = []
  const seen = new Set()
  for (const meal of meals) {
    if (!meal) continue
    const mealId = meal.idMeal || meal.id
    if (!mealId || seen.has(mealId)) continue
    seen.add(mealId)
    uniqueMeals.push(meal)
  }

  return (
    <div className="meal-grid">
      {uniqueMeals.map((meal, index) => (
        <MealCard key={meal.idMeal || meal.id} meal={meal} index={index} />
      ))}
    </div>
  )
}

export default MealGrid