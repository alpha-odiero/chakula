import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import ReminderSettings from '../components/ReminderSettings'
import logo from '../assets/LOGO.png'
import { usePreferences } from '../components/PreferencesProvider'
import { useToast } from '../components/Toast'
import { useTheme } from '../hooks/useTheme'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import {
  clearMealPlans,
  clearShoppingChecks,
  getMealPlans
} from '../utils/storage'
import { getIOSDevice } from '../utils/platform'
import { APP_VERSION } from '../config/app'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

const DIET_OPTIONS = [
  { value: 'any' },
  { value: 'vegetarian' },
  { value: 'high-protein' },
  { value: 'lower-meat' }
]
const TIME_OPTIONS = [
  { value: 'any' },
  { value: 'quick' },
  { value: 'moderate' },
  { value: 'longer' }
]

function TagField({ id, label, hint, values, onChange, placeholder }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')

  const addFromDraft = () => {
    const items = draft
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (!items.length) return
    onChange([...new Set([...values, ...items])])
    setDraft('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addFromDraft()
    } else if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="settings-field">
      <label className="settings-label" htmlFor={id}>
        {label}
      </label>
      {hint && <p className="settings-hint">{hint}</p>}
      {values.length > 0 && (
        <div className="settings-chip-row">
          {values.map((value) => (
            <span key={value} className="chip chip--removable">
              {value}
              <button
                type="button"
                className="chip-remove"
                aria-label={t('a11y.removeTag', { name: value })}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <Icon name="close" size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="settings-tag-input">
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addFromDraft}
        />
        <button type="button" className="button button--secondary" onClick={addFromDraft}>
          {t('common.add')}
        </button>
      </div>
    </div>
  )
}

function Settings() {
  const { t, locale, setLocale, locales } = useTranslation()
  useSeo({
    title: t('settings.seoTitle'),
    description: t('settings.seoDescription'),
    path: '/settings',
    robots: 'noindex,follow'
  })
  const [theme, setTheme] = useTheme()
  const { preferences, update } = usePreferences()
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [clearCheckConfirm, setClearCheckConfirm] = useState(false)
  const [reducedPrefsConfirm, setReducedPrefsConfirm] = useState(false)
  const [iosGuide, setIosGuide] = useState(false)
  const [updateState, setUpdateState] = useState('idle')
  const toast = useToast()

  const showMessage = (text, variant = 'success') => toast.notify(text, { variant })

  const handleLanguageChange = (event) => {
    const next = event.target.value
    if (!next) return
    setLocale(next)
    const meta = locales.find((l) => l.code === next)
    if (meta) showMessage(t('settings.languageChanged', { language: meta.native }))
  }

  const handleInstall = async () => {
    const ok = await install()
    if (!ok) {
      if (getIOSDevice() && !isInstalled) setIosGuide(true)
      else showMessage(t('settings.installUnavailableToast'), 'info')
    }
  }

  const handleClearData = () => {
    clearMealPlans()
    clearShoppingChecks()
    setClearAllConfirm(false)
    showMessage(t('settings.savedPlansClearedToast'))
  }

  const handleCheckForUpdates = async () => {
    setUpdateState('checking')
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (!registration || !registration.update) {
        setUpdateState('error')
        showMessage(t('settings.updateCheckFailedToast'), 'error')
        return
      }
      await registration.update()
      setUpdateState('current')
      showMessage(t('settings.upToDateToast'))
    } catch {
      setUpdateState('error')
      showMessage(t('settings.updateCheckOfflineToast'), 'error')
    }
  }

  const handleClearCachedData = async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      setClearCheckConfirm(false)
      showMessage(t('settings.cachedFilesCleared', { count: keys.length }))
    } catch {
      setClearCheckConfirm(false)
      showMessage(t('settings.clearCacheFailedToast'), 'error')
    }
  }

  return (
    <main className="settings-page">
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />
      <section className="container settings-body">
        <div className="settings-hero">
          <img
            src={logo}
            alt=""
            className="settings-hero-logo"
            width="88"
            height="62"
            aria-hidden="true"
          />
          <div className="settings-hero-info">
            <h2 className="settings-hero-name">Pikawise</h2>
            <p className="settings-hero-tagline">{t('common.tagline')}</p>
            <span className="settings-hero-version">
              <Icon name="check" size={13} />
              {t('settings.version', { version: APP_VERSION })}
            </span>
          </div>
        </div>

        {/* ---- Language ---- */}
        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="globe" size={17} />
            </span>
            {t('settings.languageGroup')}
          </h2>
          <div className="settings-row settings-row--wrap">
            <div>
              <p className="settings-label">{t('settings.languageLabel')}</p>
              <p className="settings-hint">{t('settings.languageHint')}</p>
            </div>
            <select
              id="settings-language"
              className="settings-select"
              value={locale}
              onChange={handleLanguageChange}
              aria-label={t('settings.languageAria')}
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ---- Appearance ---- */}
        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="sliders" size={17} />
            </span>
            {t('settings.appearanceGroup')}
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.themeLabel')}</p>
              <p className="settings-hint">{t('settings.themeHint')}</p>
            </div>
            <div className="segmented" role="group" aria-label={t('settings.themeLabel')}>
              <button
                type="button"
                className={theme === 'light' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <Icon name="sun" size={15} /> {t('settings.themeLight')}
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <Icon name="moon" size={15} /> {t('settings.themeDark')}
              </button>
              <button
                type="button"
                className={theme === 'system' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'system'}
                onClick={() => setTheme('system')}
              >
                {t('settings.themeSystem')}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.reduceMotionLabel')}</p>
              <p className="settings-hint">{t('settings.reduceMotionHint')}</p>
            </div>
            <button
              type="button"
              className={`toggle${preferences.reduceMotion ? ' toggle--on' : ''}`}
              role="switch"
              aria-label={t('settings.reduceMotionLabel')}
              aria-checked={preferences.reduceMotion}
              onClick={() => update({ reduceMotion: !preferences.reduceMotion })}
            >
              <span className="toggle-track" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="leaf" size={17} />
            </span>
            {t('settings.preferencesGroup')}
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.mealsPerDayLabel')}</p>
              <p className="settings-hint">{t('settings.mealsPerDayHint')}</p>
            </div>
            <div className="segmented" role="group" aria-label={t('settings.mealsPerDayAria')}>
              {[2, 3, 4].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  className={preferences.mealsPerDay === opt ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                  aria-pressed={preferences.mealsPerDay === opt}
                  onClick={() => update({ mealsPerDay: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <p className="settings-label">{t('settings.dietLabel')}</p>
            <div className="settings-chip-row">
              {DIET_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`chip${preferences.dietaryPreference === opt.value ? ' chip--active' : ''}`}
                  aria-pressed={preferences.dietaryPreference === opt.value}
                  onClick={() => update({ dietaryPreference: opt.value })}
                >
                  {t(`settings.diet.${opt.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <p className="settings-label">{t('settings.cookingTimeLabel')}</p>
            <div className="settings-chip-row">
              {TIME_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`chip${preferences.cookingTime === opt.value ? ' chip--active' : ''}`}
                  aria-pressed={preferences.cookingTime === opt.value}
                  onClick={() => update({ cookingTime: opt.value })}
                >
                  {t(`settings.time.${opt.value}`)}
                </button>
              ))}
            </div>
          </div>

          <TagField
            id="settings-allergies"
            label={t('settings.allergiesLabel')}
            hint={t('settings.allergiesHint')}
            values={preferences.allergies || []}
            onChange={(allergies) => update({ allergies })}
            placeholder={t('settings.allergiesPlaceholder')}
          />

          <TagField
            id="settings-excluded"
            label={t('settings.excludedLabel')}
            hint={t('settings.excludedHint')}
            values={preferences.excludedIngredients || []}
            onChange={(excludedIngredients) => update({ excludedIngredients })}
            placeholder={t('settings.excludedPlaceholder')}
          />

          <TagField
            id="settings-cuisines"
            label={t('settings.cuisinesLabel')}
            hint={t('settings.cuisinesHint')}
            values={preferences.preferredCuisines || []}
            onChange={(preferredCuisines) => update({ preferredCuisines })}
            placeholder={t('settings.cuisinesPlaceholder')}
          />

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.resetPrefsLabel')}</p>
              <p className="settings-hint">{t('settings.resetPrefsHint')}</p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setReducedPrefsConfirm(true)}
            >
              {t('common.reset')}
            </button>
          </div>
        </div>

        <ReminderSettings />

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="database" size={17} />
            </span>
            {t('settings.myStuffGroup')}
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.clearPlansLabel')}</p>
              <p className="settings-hint">
                {t('settings.clearPlansHint', { count: getMealPlans().length })}
              </p>
            </div>
            <button
              type="button"
              className="button button--danger"
              onClick={() => setClearAllConfirm(true)}
            >
              {t('common.clear')}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.clearCacheLabel')}</p>
              <p className="settings-hint">{t('settings.clearCacheHint')}</p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setClearCheckConfirm(true)}
            >
              {t('common.clear')}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.checkUpdatesLabel')}</p>
              <p className="settings-hint">{t('settings.checkUpdatesHint')}</p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleCheckForUpdates}
              disabled={updateState === 'checking'}
            >
              {updateState === 'checking' ? t('settings.checkUpdatesChecking') : t('settings.checkUpdatesCheck')}
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="install" size={17} />
            </span>
            {t('settings.applicationGroup')}
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">{t('settings.installLabel')}</p>
              <p className="settings-hint">
                {isInstalled ? t('settings.installHintInstalled') : t('settings.installHint')}
              </p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={handleInstall}
              disabled={isInstalled && !canInstall}
            >
              {isInstalled ? t('settings.installed') : t('settings.install')}
            </button>
          </div>

          {iosGuide && (
            <div className="settings-guide" role="note">
              <h3>{t('settings.iosGuideTitle')}</h3>
              <ol>
                <li>{t('settings.iosGuideStep1')}</li>
                <li>{t('settings.iosGuideStep2')}</li>
                <li>{t('settings.iosGuideStep3')}</li>
              </ol>
            </div>
          )}
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="info" size={17} />
            </span>
            {t('settings.informationGroup')}
          </h2>
          <nav className="settings-links" aria-label={t('settings.informationGroup')}>
            <Link to="/terms#about" className="settings-link">
              {t('settings.linkAbout')}
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/terms#privacy" className="settings-link">
              {t('settings.linkPrivacy')}
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/terms#cookies" className="settings-link">
              {t('settings.linkCookies')}
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/terms" className="settings-link">
              {t('settings.linkTerms')}
              <Icon name="arrowRight" size={16} />
            </Link>
          </nav>
        </div>
      </section>

      {clearAllConfirm && (
        <ConfirmDialog
          title={t('settings.confirmClearPlansTitle')}
          message={t('settings.confirmClearPlansMessage')}
          confirmLabel={t('common.clearAll')}
          onConfirm={handleClearData}
          onCancel={() => setClearAllConfirm(false)}
        />
      )}

      {clearCheckConfirm && (
        <ConfirmDialog
          title={t('settings.confirmClearCacheTitle')}
          message={t('settings.confirmClearCacheMessage')}
          confirmLabel={t('settings.confirmClearCacheConfirm')}
          onConfirm={handleClearCachedData}
          onCancel={() => setClearCheckConfirm(false)}
        />
      )}

      {reducedPrefsConfirm && (
        <ConfirmDialog
          title={t('settings.confirmResetTitle')}
          message={t('settings.confirmResetMessage')}
          confirmLabel={t('common.reset')}
          onConfirm={() => {
            update({ mealsPerDay: 3, cookingTime: 'any', dietaryPreference: 'any', reduceMotion: false })
            setReducedPrefsConfirm(false)
            showMessage(t('settings.preferencesResetToast'))
          }}
          onCancel={() => setReducedPrefsConfirm(false)}
        />
      )}
    </main>
  )
}

export default Settings