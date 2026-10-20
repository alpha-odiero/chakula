import MealCard from './MealCard'
import LoadingSkeleton from './LoadingSkeleton'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import { getErrorMessage } from '../hooks/useApi'

function MealGrid({
  meals,
  loading = false,
  error = null,
  emptyTitle = 'No recipes found',
  emptyMessage = 'Try a different search.',
  onRetry,
  fallbackCategory = null,
  fallbackArea = null,
  className = '',
  skeletonCount = 4
}) {
  if (loading) {
    return (
      <div className={`meal-grid ${className}`.trim()} role="status" aria-label="Loading recipes">
        {Array.from({ length: skeletonCount }).map((_, i) => (
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
    const mealId = String(meal.id ?? meal.idMeal)
    if (!mealId || seen.has(mealId)) continue
    seen.add(mealId)
    uniqueMeals.push(meal)
  }

  // The first row is almost always in view on load, so its images get
  // priority; everything below stays lazy until the user scrolls near it.
  const EAGER_COUNT = 6

  return (
    <div className={`meal-grid ${className}`.trim()}>
      {uniqueMeals.map((meal, index) => (
        <MealCard
          key={meal.id ?? meal.idMeal}
          meal={meal}
          eager={index < EAGER_COUNT}
          fallbackCategory={fallbackCategory}
          fallbackArea={fallbackArea}
        />
      ))}
    </div>
  )
}

export default MealGrid
