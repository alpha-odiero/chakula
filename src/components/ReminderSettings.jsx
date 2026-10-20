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
      toast.notify('Keep at least one day selected.', { variant: 'info' })
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
      toast.notify('Keep at least one reminder style selected.', { variant: 'info' })
      return
    }
    update({ modes })
  }

  const saveChanges = () => {
    update({})
    refresh()
    toast.success('Reminder settings saved.')
  }

  const enableNotifications = async () => {
    if (!isNotificationSupported()) {
      toast.notify('This browser does not support notifications.', { variant: 'error' })
      return
    }
    setRequesting(true)
    const result = await requestNotificationPermission()
    setRequesting(false)
    refresh()
    if (result === 'granted') {
      toast.notify('Notifications enabled. Reminders will appear on your device.', { variant: 'success' })
    } else if (result === 'denied') {
      toast.notify('Notifications are blocked. Enable them in your browser settings.', { variant: 'error' })
    }
  }

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      toast.notify('Enable notifications above first, then send a test.', { variant: 'info' })
      return
    }
    setTesting(true)
    const sent = await showOsNotification({
      id: 'pikawise-test',
      title: 'Pikawise test notification',
      body: 'Notifications are working. Meal reminders will appear like this.',
      tag: 'pikawise-test',
      data: { url: '/' }
    })
    setTesting(false)
    if (sent) {
      toast.success('Test notification sent — check your notifications.')
    } else {
      toast.notify('Could not show a notification. Check that notifications are allowed for this site.', {
        variant: 'error'
      })
    }
  }

  const permissionLabel = {
    granted: 'Allowed',
    denied: 'Blocked in browser',
    default: 'Not enabled yet',
    unsupported: 'Not supported'
  }[permission] || 'Unknown'

  return (
    <div className="settings-group">
      <h2 className="settings-group-title">
        <span className="settings-group-icon">
          <Icon name="bell" size={17} />
        </span>
        Meal reminders
      </h2>

      <div className="settings-row">
        <div>
          <p className="settings-label">Meal reminders</p>
          <p className="settings-hint">
            Gently remind you when it is time to decide what to eat.
          </p>
        </div>
        <button
          type="button"
          className={`toggle${reminders.enabled ? ' toggle--on' : ''}`}
          role="switch"
          aria-label="Meal reminders"
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
              <p className="settings-label">Device notifications</p>
              <p className="settings-hint">
                {permission === 'granted'
                  ? 'Reminders appear as system notifications.'
                  : permission === 'denied'
                    ? 'Notifications are blocked for this site — see below to re-enable them.'
                    : permission === 'unsupported'
                      ? 'This browser does not support notifications. Reminders still appear inside Pikawise.'
                      : 'Allow notifications so reminders reach you outside the app.'}
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
                {requesting ? 'Requesting…' : 'Enable'}
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="permission-note" role="note">
              <p className="permission-note-title">
                <Icon name="bell" size={14} /> Notifications are blocked
              </p>
              <p className="settings-hint">
                Allow notifications for this site in your browser settings (the lock or tune icon
                next to the address bar), then reload the page.
              </p>
              {iosDevice && (
                <p className="settings-hint">
                  On iPhone and iPad, notifications only work from the installed app: open
                  Pikawise from your Home Screen and allow notifications when asked.
                </p>
              )}
            </div>
          )}

          <div className="settings-row">
            <div>
              <p className="settings-label">Test notification</p>
              <p className="settings-hint">
                {permission === 'granted'
                  ? 'Send one now to check sound and delivery while Pikawise is open.'
                  : 'Enable notifications above to send a test.'}
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={sendTestNotification}
              disabled={permission !== 'granted' || testing}
            >
              {testing ? 'Sending…' : 'Send test'}
            </button>
          </div>

          {nextReminder && (
            <p className="reminder-next">
              <Icon name="bell" size={14} /> Next reminder: {formatDateTime(nextReminder.at)}
            </p>
          )}

          <div className="settings-field">
            <p className="settings-label">Meals to remind you about</p>
            <ul className="reminder-meals">
              {MEAL_PERIODS.map((period) => {
                const meal = reminders.meals[period.id]
                return (
                  <li key={period.id} className="reminder-meal">
                    <label className="reminder-meal-toggle">
                      <input
                        type="checkbox"
                        checked={meal.enabled}
                        onChange={(event) => updateMeal(period.id, { enabled: event.target.checked })}
                      />
                      <span className="reminder-meal-name">
                        <Icon name={period.icon} size={15} /> {period.label}
                      </span>
                    </label>
                    <input
                      type="time"
                      value={meal.time}
                      onChange={(event) => updateMeal(period.id, { time: event.target.value })}
                      aria-label={`${period.label} time`}
                      disabled={!meal.enabled}
                    />
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="settings-field">
            <p className="settings-label">Reminder style</p>
            <p className="settings-hint">Pick one or more — you can mix them.</p>
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
                      <span className="reminder-meal-name">{mode.label}</span>
                      <span className="reminder-style-hint">{mode.hint}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="settings-field">
            <p className="settings-label">Days</p>
            <div className="settings-chip-row">
              {WEEKDAYS.map((day) => (
                <button
                  type="button"
                  key={day.value}
                  className={`chip${reminders.days.includes(day.value) ? ' chip--active' : ''}`}
                  aria-pressed={reminders.days.includes(day.value)}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Quiet hours</p>
              <p className="settings-hint">
                No reminders between {formatTimeOfDay(reminders.quietHours.start)} and{' '}
                {formatTimeOfDay(reminders.quietHours.end)}.
              </p>
            </div>
            <button
              type="button"
              className={`toggle${reminders.quietHours.enabled ? ' toggle--on' : ''}`}
              role="switch"
              aria-label="Quiet hours"
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
                label="Quiet hours start"
                value={reminders.quietHours.start}
                onChange={(time) => update({ quietHours: { ...reminders.quietHours, start: time } })}
              />
              <span>to</span>
              <SegmentedTime
                label="Quiet hours end"
                value={reminders.quietHours.end}
                onChange={(time) => update({ quietHours: { ...reminders.quietHours, end: time } })}
              />
            </div>
          )}

          <p className="settings-hint reminder-tz">
            <Icon name="globe" size={13} /> Times use your device time zone ({timeZone}).
          </p>

          <p className="settings-hint reminder-limits">
            Reminders are best effort and stay on this device. They run while Pikawise is open or
            installed; browsers cannot wake a fully closed app without a push service.
            {iosDevice
              ? ' On iPhone and iPad, notifications only work from the Home Screen app and may stop after a while — reinstall it from Share → Add to Home Screen to restore them.'
              : ''}
          </p>

          <div className="reminder-save">
            <button type="button" className="button button--primary" onClick={saveChanges}>
              Save changes
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ReminderSettings
