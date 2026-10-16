import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import logo from '../assets/LOGO.png'
import { usePreferences } from '../components/PreferencesProvider'
import { useToast } from '../components/Toast'
import { useTheme } from '../hooks/useTheme'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import {
  clearMealPlans,
  clearShoppingChecks,
  getMealPlans,
  getStorageUsage
} from '../utils/storage'
import { getIOSDevice } from '../utils/platform'
import { APP_VERSION } from '../config/app'

const DIET_OPTIONS = [
  { value: 'any', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'high-protein', label: 'High-protein' },
  { value: 'lower-meat', label: 'Lower-meat' }
]
const TIME_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'quick', label: 'Under 30 minutes' },
  { value: 'moderate', label: 'Under 60 minutes' },
  { value: 'longer', label: 'Time is not a problem' }
]

function Settings() {
  const [theme, setTheme] = useTheme()
  const { preferences, update } = usePreferences()
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [clearCheckConfirm, setClearCheckConfirm] = useState(false)
  const [reducedPrefsConfirm, setReducedPrefsConfirm] = useState(false)
  const [iosGuide, setIosGuide] = useState(false)
  const [updateState, setUpdateState] = useState('idle')
  const [storageBytes, setStorageBytes] = useState(() => getStorageUsage())
  const toast = useToast()

  const showMessage = (text, variant = 'success') => toast.notify(text, { variant })

  const handleInstall = async () => {
    const ok = await install()
    if (!ok) {
      if (getIOSDevice() && !isInstalled) setIosGuide(true)
      else showMessage('Installation is not available in this browser right now.', 'info')
    }
  }

  const handleClearData = () => {
    clearMealPlans()
    clearShoppingChecks()
    setClearAllConfirm(false)
    setStorageBytes(getStorageUsage())
    showMessage('Saved plans cleared.')
  }

  const handleCheckForUpdates = async () => {
    setUpdateState('checking')
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (!registration || !registration.update) {
        setUpdateState('error')
        showMessage('Could not check for updates.', 'error')
        return
      }
      await registration.update()
      setUpdateState('current')
      showMessage('Pikawise is up to date.')
    } catch {
      setUpdateState('error')
      showMessage('Could not check for updates. You may be offline.', 'error')
    }
  }

  const handleClearCachedData = async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      setClearCheckConfirm(false)
      showMessage(`Cleared ${keys.length} cached file set${keys.length === 1 ? '' : 's'}.`)
    } catch {
      setClearCheckConfirm(false)
      showMessage('Could not clear cached data.', 'error')
    }
  }

  return (
    <main className="settings-page">
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        subtitle="Manage how Pikawise looks, plans your meals, and stores data on this device."
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
            <p className="settings-hero-tagline">Discover meals. Cook with what you have.</p>
            <span className="settings-hero-version">
              <Icon name="check" size={13} />
              Version {APP_VERSION}
            </span>
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="sliders" size={17} />
            </span>
            Appearance
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Theme</p>
              <p className="settings-hint">Follow your device or pick a look.</p>
            </div>
            <div className="segmented" role="group" aria-label="Theme">
              <button
                type="button"
                className={theme === 'light' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                <Icon name="sun" size={15} /> Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                <Icon name="moon" size={15} /> Dark
              </button>
              <button
                type="button"
                className={theme === 'system' ? 'segmented-btn segmented-btn--active' : 'segmented-btn'}
                aria-pressed={theme === 'system'}
                onClick={() => setTheme('system')}
              >
                System
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Reduce motion</p>
              <p className="settings-hint">Turn off decorative animations and transitions.</p>
            </div>
            <button
              type="button"
              className={`toggle${preferences.reduceMotion ? ' toggle--on' : ''}`}
              role="switch"
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
            Meal preferences
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Planned meals per day</p>
              <p className="settings-hint">Pikawise pre-fills your meal plan with this many meals.</p>
            </div>
            <div className="segmented" role="group" aria-label="Meals per day">
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
            <p className="settings-label">Dietary preference</p>
            <div className="settings-chip-row">
              {DIET_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`chip${preferences.dietaryPreference === opt.value ? ' chip--active' : ''}`}
                  aria-pressed={preferences.dietaryPreference === opt.value}
                  onClick={() => update({ dietaryPreference: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <p className="settings-label">Cooking time</p>
            <div className="settings-chip-row">
              {TIME_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`chip${preferences.cookingTime === opt.value ? ' chip--active' : ''}`}
                  aria-pressed={preferences.cookingTime === opt.value}
                  onClick={() => update({ cookingTime: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Reset meal preferences</p>
              <p className="settings-hint">
                Return meals, diet, cooking time, and motion settings to defaults.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setReducedPrefsConfirm(true)}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="database" size={17} />
            </span>
            Data &amp; storage
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Clear saved plans &amp; check-offs</p>
              <p className="settings-hint">
                {getMealPlans().length} meal plan{getMealPlans().length === 1 ? '' : 's'} saved.
              </p>
            </div>
            <button
              type="button"
              className="button button--danger"
              onClick={() => setClearAllConfirm(true)}
            >
              Clear
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Clear cached data</p>
              <p className="settings-hint">
                Removes cached recipe responses. App stays usable offline.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setClearCheckConfirm(true)}
            >
              Clear
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Storage used</p>
              <p className="settings-hint">{(storageBytes / 1024).toFixed(1)} KB used.</p>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Check for updates</p>
              <p className="settings-hint">
                Checks the installed app for newer updates.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleCheckForUpdates}
              disabled={updateState === 'checking'}
            >
              {updateState === 'checking' ? 'Checking…' : 'Check'}
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="install" size={17} />
            </span>
            Application
          </h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Install Pikawise</p>
              <p className="settings-hint">
                {isInstalled
                  ? 'Pikawise is installed on this device.'
                  : 'Install Pikawise to open it like a native app.'}
              </p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={handleInstall}
              disabled={isInstalled && !canInstall}
            >
              {isInstalled ? 'Installed' : 'Install'}
            </button>
          </div>

          {iosGuide && (
            <div className="settings-guide" role="note">
              <h3>To install Pikawise on iOS:</h3>
              <ol>
                <li>Tap the Share button</li>
                <li>Select “Add to Home Screen”</li>
                <li>Tap Add</li>
              </ol>
            </div>
          )}
        </div>

        <div className="settings-group">
          <h2 className="settings-group-title">
            <span className="settings-group-icon">
              <Icon name="info" size={17} />
            </span>
            Information
          </h2>
          <nav className="settings-links" aria-label="Information">
            <Link to="/about" className="settings-link">
              About Pikawise
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/privacy" className="settings-link">
              Privacy Policy
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/privacy#cookies" className="settings-link">
              Cookies
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/terms" className="settings-link">
              Terms
              <Icon name="arrowRight" size={16} />
            </Link>
          </nav>
        </div>
      </section>

      {clearAllConfirm && (
        <ConfirmDialog
          title="Clear saved plans?"
          message="All saved meal plans and their shopping check-offs on this device will be removed."
          confirmLabel="Clear all"
          onConfirm={handleClearData}
          onCancel={() => setClearAllConfirm(false)}
        />
      )}

      {clearCheckConfirm && (
        <ConfirmDialog
          title="Clear cached data?"
          message="Recipe responses cached for offline use will be removed. The app stays usable."
          confirmLabel="Clear cache"
          onConfirm={handleClearCachedData}
          onCancel={() => setClearCheckConfirm(false)}
        />
      )}

      {reducedPrefsConfirm && (
        <ConfirmDialog
          title="Reset preferences?"
          message="Your meal preferences and onboarding choices will be reset."
          confirmLabel="Reset"
          onConfirm={() => {
            update({ mealsPerDay: 3, cookingTime: 'any', dietaryPreference: 'any', reduceMotion: false })
            setReducedPrefsConfirm(false)
            showMessage('Preferences reset.')
          }}
          onCancel={() => setReducedPrefsConfirm(false)}
        />
      )}
    </main>
  )
}

export default Settings