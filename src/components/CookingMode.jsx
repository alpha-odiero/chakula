import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { scaleMeasure } from '../utils/meal'

function CookingMode({ mealName, steps, ingredients = [], servings = 1, baseServings = 1, onClose }) {
  const [index, setIndex] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const wakeLockRef = useRef(null)

  const total = steps.length
  const factor = baseServings > 0 ? servings / baseServings : 1

  const isFirst = index === 0
  const isLast = index >= total - 1

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(total - 1, 0)))
  }, [total])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        next()
      } else if (event.key === 'ArrowLeft') {
        prev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, prev, onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('cooking-mode-active')
    return () => {
      document.body.style.overflow = previous
      document.body.classList.remove('cooking-mode-active')
    }
  }, [])

  useEffect(() => {
    let active = true
    const request = navigator?.wakeLock?.request
    if (typeof request === 'function') {
      request
        .call(navigator.wakeLock, 'screen')
        .then((lock) => {
          if (active) wakeLockRef.current = lock
        })
        .catch(() => {})
    }
    return () => {
      active = false
      if (wakeLockRef.current && typeof wakeLockRef.current.release === 'function') {
        try {
          wakeLockRef.current.release()
        } catch {
          /* ignore */
        }
      }
      wakeLockRef.current = null
    }
  }, [])

  const scaledIngredients = useMemo(
    () => ingredients.map(({ ingredient, measure }) => ({
      ingredient,
      measure: scaleMeasure(measure, factor)
    })),
    [ingredients, factor]
  )

  const progress = total > 0 ? ((index + 1) / total) * 100 : 0

  return (
    <div
      className="cooking-mode"
      role="dialog"
      aria-modal="true"
      aria-label={`Cooking mode: ${mealName}`}
    >
      <header className="cooking-mode-bar">
        <button type="button" className="cooking-icon-button" onClick={onClose} aria-label="Exit cooking mode">
          <Icon name="close" size={20} />
        </button>
        <div className="cooking-mode-progress-text">
          <span className="cooking-mode-name">{mealName}</span>
          <span className="cooking-mode-step-label">
            Step {index + 1} of {total}
          </span>
        </div>
        <button
          type="button"
          className={`cooking-icon-button${showIngredients ? ' is-active' : ''}`}
          onClick={() => setShowIngredients((v) => !v)}
          aria-expanded={showIngredients}
          aria-label={showIngredients ? 'Hide ingredients' : 'Show ingredients'}
        >
          <Icon name="utensils" size={20} />
        </button>
      </header>

      <div className="cooking-progress" aria-hidden="true">
        <span className="cooking-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="cooking-mode-body">
        {total === 0 ? (
          <p className="cooking-step-text">
            This recipe doesn&apos;t include written steps. You can still cook it using the
            ingredients list.
          </p>
        ) : (
          <div className="cooking-step" key={index}>
            <span className="cooking-step-number">Step {index + 1}</span>
            <p className="cooking-step-text">{steps[index]}</p>
          </div>
        )}
      </div>

      {showIngredients && (
        <div className="cooking-ingredients" role="region" aria-label="Ingredients">
          <div className="cooking-ingredients-head">
            <h2>Ingredients for {servings} {servings === 1 ? 'serving' : 'servings'}</h2>
          </div>
          <ul>
            {scaledIngredients.map(({ ingredient, measure }) => (
              <li key={ingredient}>
                <span>{ingredient}</span>
                {measure && <em>{measure}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="cooking-mode-actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={prev}
          disabled={isFirst}
        >
          <Icon name="chevronLeft" size={18} />
          Previous
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={isLast ? onClose : next}
        >
          {isLast ? (
            <>
              <Icon name="check" size={18} />
              Finish
            </>
          ) : (
            <>
              Next
              <Icon name="arrowRight" size={18} />
            </>
          )}
        </button>
      </footer>
    </div>
  )
}

export default CookingMode
