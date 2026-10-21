import { useEffect, useState } from 'react'
import Icon from './Icon'
import { useReminders } from './ReminderProvider'
import { useToast } from './Toast'
import { MEAL_PERIODS, REMINDER_MODES, WEEKDAYS } from '../config/reminders'
import { formatDateTime, formatTimeOfDay, getBrowserTimeZone } from '../utils/reminderSchedule'
import { getIOSDevice } from '../utils/platform'
import {
  isNotificationSupported,
  requestNotificationPermission,
  showOsNotification
} from '../services/notifications'
import { useTranslation } from '../i18n/LocaleContext'

function SegmentedTime({ value, onChange, label }) {
  return (
    <label className="reminder-time">
      <span className="visually-hidden">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      />
    </label>
  )
}

function ReminderSettings() {
  const { t } = useTranslation()
  const { reminders, update, nextReminder, permission, refresh } = useReminders()
  const toast = useToast()
  const [requesting, setRequesting] = useState(false)
  const [testing, setTesting] = useState(false)
  const iosDevice = getIOSDevice()

  const timeZone = reminders.timezone === 'auto' ? getBrowserTimeZone() : reminders.timezone

  useEffect(() => {
    // Re-read permission when the tab regains focus (it can change in settings).
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const toggleDay = (day) => {
    const days = reminders.days.includes(day)
      ? reminders.days.filter((value) => value !== day)
      : [...reminders.days, day]
    if (!days.length) {
      toast.notify(t('reminder.settings.keepDay'), { variant: 'info' })
      return
    }
    update({ days })
  }

  const updateMeal = (id, partial) => {
    update({ meals: { ...reminders.meals, [id]: { ...reminders.meals[id], ...partial } } })
  }

  const toggleMode = (value) => {
    const modes = reminders.modes.includes(value)
      ? reminders.modes.filter((mode) => mode !== value)
      : [...reminders.modes, value]
    if (!modes.length) {
      toast.notify(t('reminder.settings.keepMode'), { variant: 'info' })
      return
    }
    update({ modes })
  }

  const saveChanges = () => {
    update({})
    refresh()
    toast.success(t('reminder.settings.savedToast'))
  }

  const enableNotifications = async () => {
    if (!isNotificationSupported()) {
      toast.notify(t('reminder.settings.unsupportedToast'), { variant: 'error' })
      return
    }
    setRequesting(true)
    const result = await requestNotificationPermission()
    setRequesting(false)
    refresh()
    if (result === 'granted') {
      toast.notify(t('reminder.settings.enabledToast'), { variant: 'success' })
    } else if (result === 'denied') {
      toast.notify(t('reminder.settings.blockedToast'), { variant: 'error' })
    }
  }

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      toast.notify(t('reminder.settings.enableFirstToast'), { variant: 'info' })
      return
    }
    setTesting(true)
    const sent = await showOsNotification({
      id: 'pikawise-test',
      title: t('reminder.settings.testNotificationTitle'),
      body: t('reminder.settings.testNotificationBody'),
      tag: 'pikawise-test',
      data: { url: '/' }
    })
    setTesting(false)
    if (sent) {
      toast.success(t('reminder.settings.testSentToast'))
    } else {
      toast.notify(t('reminder.settings.testFailedToast'), {
        variant: 'error'
      })
    }
  }

  const permissionLabel = {
    granted: t('reminder.settings.permissionAllowed'),
    denied: t('reminder.settings.permissionDenied'),
    default: t('reminder.settings.permissionDefault'),
    unsupported: t('reminder.settings.permissionUnsupported')
  }[permission] || t('reminder.settings.permissionUnknown')

  return (
    <div className="settings-group">
      <h2 className="settings-group-title">
        <span className="settings-group-icon">
          <Icon name="bell" size={17} />
        </span>
        {t('reminder.settings.groupTitle')}
      </h2>

      <div className="settings-row">
        <div>
          <p className="settings-label">{t('reminder.settings.label')}</p>
          <p className="settings-hint">{t('reminder.settings.hint')}</p>
        </div>
        <button
          type="button"
          className={`toggle${reminders.enabled ? ' toggle--on' : ''}`}
          role="switch"
          aria-label={t('reminder.settings.label')}
          aria-checked={reminders.enabled}
          onClick={() => update({ enabled: !reminders.enabled })}
        >
          <span className="toggle-track" aria-hidden="true" />
        </button>
      </div>

      {reminders.enabled && (
        <>
          <div className="settings-row">
            <div>
              <p className="settings-label">{t('reminder.settings.notificationsLabel')}</p>
              <p className="settings-hint">
                {permission === 'granted'
                  ? t('reminder.settings.notifGranted')
                  : permission === 'denied'
                    ? t('reminder.settings.notifDenied')
                    : permission === 'unsupported'
                      ? t('reminder.settings.notifUnsupported')
                      : t('reminder.settings.notifDefault')}
              </p>
            </div>
            {permission === 'granted' ? (
              <span className="reminder-status reminder-status--ok">
                <Icon name="check" size={14} /> {permissionLabel}
              </span>
            ) : permission === 'denied' ? (
              <span className="reminder-status">{permissionLabel}</span>
            ) : (
              <button
                type="button"
                className="button button--primary"
                onClick={enableNotifications}
                disabled={requesting || !isNotificationSupported()}
              >
                {requesting ? t('reminder.settings.requesting') : t('reminder.settings.enable')}
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="permission-note" role="note">
              <p className="permission-note-title">
                <Icon name="bell" size={14} /> {t('reminder.settings.blockedTitle')}
              </p>
              <p className="settings-hint">{t('reminder.settings.blockedHint')}</p>
              {iosDevice && (
                <p className="settings-hint">{t('reminder.settings.blockedIosHint')}</p>
              )}
            </div>
          )}

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('reminder.settings.testLabel')}</p>
              <p className="settings-hint">
                {permission === 'granted'
                  ? t('reminder.settings.testGrantedHint')
                  : t('reminder.settings.testHint')}
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={sendTestNotification}
              disabled={permission !== 'granted' || testing}
            >
              {testing ? t('reminder.settings.sending') : t('reminder.settings.sendTest')}
            </button>
          </div>

          {nextReminder && (
            <p className="reminder-next">
              <Icon name="bell" size={14} /> {t('reminder.settings.nextReminder', { time: formatDateTime(nextReminder.at) })}
            </p>
          )}

          <div className="settings-field">
            <p className="settings-label">{t('reminder.settings.mealsLabel')}</p>
            <ul className="reminder-meals">
              {MEAL_PERIODS.map((period) => {
                const meal = reminders.meals[period.id]
                const periodLabel = t(`config.period.${period.id}`)
                return (
                  <li key={period.id} className="reminder-meal">
                    <label className="reminder-meal-toggle">
                      <input
                        type="checkbox"
                        checked={meal.enabled}
                        onChange={(event) => updateMeal(period.id, { enabled: event.target.checked })}
                      />
                      <span className="reminder-meal-name">
                        <Icon name={period.icon} size={15} /> {periodLabel}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={meal.time}
                      onChange={(event) => updateMeal(period.id, { time: event.target.value })}
                      aria-label={t('reminder.settings.mealTimeAria', { label: periodLabel })}
                      disabled={!meal.enabled}
                    />
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="settings-field">
            <p className="settings-label">{t('reminder.settings.styleLabel')}</p>
            <p className="settings-hint">{t('reminder.settings.styleHint')}</p>
            <ul className="reminder-meals">
              {REMINDER_MODES.map((mode) => (
                <li key={mode.value} className="reminder-meal">
                  <label className="reminder-meal-toggle">
                    <input
                      type="checkbox"
                      checked={reminders.modes.includes(mode.value)}
                      onChange={() => toggleMode(mode.value)}
                    />
                    <span className="reminder-style-text">
                      <span className="reminder-meal-name">{t(`config.mode.${mode.value}`)}</span>
                      <span className="reminder-style-hint">{t(`config.modeHint.${mode.value}`)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="settings-field">
            <p className="settings-label">{t('reminder.settings.daysLabel')}</p>
            <div className="settings-chip-row">
              {WEEKDAYS.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  className={`chip${reminders.days.includes(day.value) ? ' chip--active' : ''}`}
                  aria-pressed={reminders.days.includes(day.value)}
                  onClick={() => toggleDay(day.value)}
                >
                  {t(`config.weekday.${day.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">{t('reminder.settings.quietLabel')}</p>
              <p className="settings-hint">
                {t('reminder.settings.quietHint', {
                  start: formatTimeOfDay(reminders.quietHours.start),
                  end: formatTimeOfDay(reminders.quietHours.end)
                })}
              </p>
            </div>
            <button
              type="button"
              className={`toggle${reminders.quietHours.enabled ? ' toggle--on' : ''}`}
              role="switch"
              aria-label={t('reminder.settings.quietLabel')}
              aria-checked={reminders.quietHours.enabled}
              onClick={() =>
                update({ quietHours: { ...reminders.quietHours, enabled: !reminders.quietHours.enabled } })
              }
            >
              <span className="toggle-track" aria-hidden="true" />
            </button>
          </div>

          {reminders.quietHours.enabled && (
            <div className="reminder-quiet-times">
              <SegmentedTime
                label={t('reminder.settings.quietStart')}
                value={reminders.quietHours.start}
                onChange={(time) => update({ quietHours: { ...reminders.quietHours, start: time } })}
              />
              <span>{t('reminder.settings.to')}</span>
              <SegmentedTime
                label={t('reminder.settings.quietEnd')}
                value={reminders.quietHours.end}
                onChange={(time) => update({ quietHours: { ...reminders.quietHours, end: time } })}
              />
            </div>
          )}

          <p className="settings-hint reminder-tz">
            <Icon name="globe" size={13} /> {t('reminder.settings.timezone', { timezone: timeZone })}
          </p>

          <p className="settings-hint reminder-limits">
            {t('reminder.settings.limits')}
            {iosDevice ? ` ${t('reminder.settings.limitsIos')}` : ''}
          </p>

          <div className="reminder-save">
            <button type="button" className="button button--primary" onClick={saveChanges}>
              {t('reminder.settings.save')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReminderSettings
