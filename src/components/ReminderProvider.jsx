import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  getReminders,
  saveReminders,
  clearReminders,
  getReminderLog,
  markReminderFired,
  addNotification
} from '../utils/storage'
import { mergeReminders, periodById } from '../config/reminders'
import {
  computeNextReminder,
  computeUpcomingOccurrences,
  getDueReminders,
  resolveTimeZone
} from '../utils/reminderSchedule'
import { buildReminderPayload } from '../services/reminderContent'
import {
  getNotificationPermission,
  showOsNotification,
  isNotificationSupported
} from '../services/notifications'
import {
  writeReminderSchedule,
  requestPeriodicBackgroundSync,
  cancelPeriodicBackgroundSync
} from '../utils/reminderSync'
import { usePreferences } from './PreferencesProvider'

const CHECK_INTERVAL_MS = 60 * 1000

const ReminderContext = createContext({
  reminders: null,
  update: () => {},
  reset: () => {},
  refresh: () => {},
  nextReminder: null,
  permission: 'unsupported'
})

export function useReminders() {
  return useContext(ReminderContext)
}

function ReminderProvider({ children }) {
  const { preferences } = usePreferences()
  const [reminders, setReminders] = useState(getReminders)
  const [tick, setTick] = useState(0)

  const remindersRef = useRef(reminders)
  remindersRef.current = reminders
  const prefsRef = useRef(preferences)
  prefsRef.current = preferences
  const runningRef = useRef(false)

  const update = useCallback((partial) => {
    setReminders((prev) => {
      const next = mergeReminders(prev, partial)
      saveReminders(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    clearReminders()
    setReminders(getReminders())
  }, [])

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  // Fire any reminders that are due, both in the notification centre and as a
  // real OS notification when the user has granted permission.
  useEffect(() => {
    if (!reminders.enabled) return undefined
    let stopped = false

    const check = async () => {
      if (stopped || runningRef.current) return
      const config = remindersRef.current
      if (!config.enabled) return
      const timeZone = resolveTimeZone(config)
      const due = getDueReminders(config, getReminderLog(), { timeZone })
      if (!due.length) return

      runningRef.current = true
      try {
        for (const item of due) {
          markReminderFired(item.key)
          const period = periodById(item.periodId) || { label: item.label }
          const payload = await buildReminderPayload(period, config, prefsRef.current)
          const id = `reminder-${item.key}`
          addNotification({
            id,
            type: 'reminder',
            title: payload.title,
            body: payload.body,
            periodId: item.periodId,
            suggestions: payload.suggestions
          })
          if (isNotificationSupported() && getNotificationPermission() === 'granted') {
            await showOsNotification({
              id,
              title: payload.title,
              body: payload.body,
              tag: `pikawise-${item.periodId}`,
              data: { url: `/reminder?period=${item.periodId}` }
            })
          }
        }
        setTick((value) => value + 1)
      } finally {
        runningRef.current = false
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onWake = () => check()
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onWake)
    window.addEventListener('online', onWake)

    return () => {
      stopped = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onWake)
      window.removeEventListener('online', onWake)
    }
  }, [reminders.enabled])

  // Keep the service worker's copy of the schedule and the periodic sync
  // registration in step with the user's settings.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined
    if (!reminders.enabled) {
      cancelPeriodicBackgroundSync()
      writeReminderSchedule([])
      return undefined
    }
    const occurrences = computeUpcomingOccurrences(reminders, { days: 2 })
    writeReminderSchedule(occurrences)
    requestPeriodicBackgroundSync()
    return undefined
  }, [reminders])

  const nextReminder = useMemo(
    () => computeNextReminder(reminders),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reminders, tick]
  )

  const permission = useMemo(() => {
    if (!isNotificationSupported()) return 'unsupported'
    return getNotificationPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const value = useMemo(
    () => ({ reminders, update, reset, refresh, nextReminder, permission }),
    [reminders, update, reset, refresh, nextReminder, permission]
  )

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>
}

export default ReminderProvider
