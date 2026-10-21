import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'
import { usePreferences } from './PreferencesProvider'

const mealOptions = [2, 3, 4]
const cookOptions = [
  { value: 'quick', labelKey: 'onboarding.cookQuick', hintKey: 'onboarding.cookQuickHint' },
  { value: 'moderate', labelKey: 'onboarding.cookModerate', hintKey: 'onboarding.cookModerateHint' },
  { value: 'longer', labelKey: 'onboarding.cookLonger', hintKey: 'onboarding.cookLongerHint' }
]

function Onboarding({ onClose }) {
  const { t } = useTranslation()
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
        aria-label={t('onboarding.welcome', { app: t('common.appName') })}
        tabIndex="-1"
        ref={dialogRef}
      >
        <div className="onboarding-mark" aria-hidden="true">
          <Icon name="cookingPot" size={28} />
        </div>

        {step === 0 && (
          <>
            <h2 className="onboarding-title">{t('onboarding.welcome', { app: t('common.appName') })}</h2>
            <p className="onboarding-text">{t('onboarding.welcomeText')}</p>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={nextStep}>
                {t('onboarding.getStarted')}
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                {t('onboarding.skip')}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="onboarding-title">{t('onboarding.mealsTitle')}</h2>
            <p className="onboarding-text">{t('onboarding.mealsText')}</p>
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
                  <span className="choice-label">{t('onboarding.meals', { count: num })}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={nextStep}>
                {t('common.continue')}
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                {t('onboarding.skip')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboarding-title">{t('onboarding.cookTitle')}</h2>
            <p className="onboarding-text">{t('onboarding.cookText')}</p>
            <div className="onboarding-options">
              {cookOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`option-row${cookingTime === option.value ? ' option-row--active' : ''}`}
                  aria-pressed={cookingTime === option.value}
                  onClick={() => setCookingTime(option.value)}
                >
                  <span className="option-row-title">{t(option.labelKey)}</span>
                  <span className="option-row-hint">{t(option.hintKey)}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button button--primary" onClick={() => finish()}>
                {t('common.done')}
              </button>
              <button type="button" className="button button--ghost" onClick={() => finish(true)}>
                {t('onboarding.skip')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Onboarding
