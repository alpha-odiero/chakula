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

  return (
    <div className={`meal-grid ${className}`.trim()}>
      {uniqueMeals.map((meal) => (
        <MealCard
          key={meal.id ?? meal.idMeal}
          meal={meal}
          fallbackCategory={fallbackCategory}
          fallbackArea={fallbackArea}
        />
      ))}
    </div>
  )
}

export default MealGrid
