import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { usePreferences } from './PreferencesProvider'

const mealOptions = [2, 3, 4]
const cookOptions = [
  { value: 'quick', label: 'Quick', hint: 'Ideally under 30 minutes' },
  { value: 'moderate', label: 'Moderate', hint: '30–60 minutes is fine' },
  { value: 'longer', label: 'Longer meals are fine', hint: 'Time is not a problem' }
]

function Onboarding({ onClose }) {
  const { preferences, update } = usePreferences()
  const [step, setStep] = useState(0)
  const [mealsPerDay, setMealsPerDay] = useState(preferences?.mealsPerDay || 3)
  const [cookingTime, setCookingTime] = useState(preferences?.cookingTime || 'quick')
  const dialogRef = useRef(null)

  const finish = (skipped = false) => {
    update({
      onboarded: true,
      mealsPerDay: skipped ? preferences?.mealsPerDay || 3 : mealsPerDay,
      cookingTime: skipped ? preferences?.cookingTime || 'any' : cookingTime
    })
    if (onClose) onClose()
  }

  useEffect(() => {
    const previousFocus = document.activeElement
    if (dialogRef.current) dialogRef.current.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') finish(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextStep = () => setStep((s) => s + 1)

  return (
    <div className="onboarding-overlay" role="presentation">
      <div
        className="onboarding"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Chakula"
        tabIndex="-1"
        ref={dialogRef}
      >
        <div className="onboarding-mark" aria-hidden="true">
          <Icon name="cookingPot" size={28} />
        </div>

        {step === 0 && (
          <>
            <h2 className="onboarding-title">Welcome to Chakula</h2>
            <p className="onboarding-text">
              Let's personalize your meal discovery experience. It only takes a moment.
            </p>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={nextStep}>
                Get Started
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                Skip
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="onboarding-title">How many meals do you usually plan per day?</h2>
            <p className="onboarding-text">We'll use this as a default when building plans.</p>
            <div className="onboarding-choices">
              {mealOptions.map((num) => (
                <button
                  type="button"
                  key={num}
                  className={`choice-card${mealsPerDay === num ? ' choice-card--active' : ''}`}
                  aria-pressed={mealsPerDay === num}
                  onClick={() => setMealsPerDay(num)}
                >
                  <span className="choice-value">{num}</span>
                  <span className="choice-label">{num === 2 ? 'meals' : 'meals'}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={nextStep}>
                Continue
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                Skip
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboarding-title">How much time do you usually have to cook?</h2>
            <p className="onboarding-text">Your preferences stay on this device only.</p>
            <div className="onboarding-options">
              {cookOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`option-row${cookingTime === option.value ? ' option-row--active' : ''}`}
                  aria-pressed={cookingTime === option.value}
                  onClick={() => setCookingTime(option.value)}
                >
                  <span className="option-row-title">{option.label}</span>
                  <span className="option-row-hint">{option.hint}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={() => finish()}>
                Done
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Onboarding