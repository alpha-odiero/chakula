import { MEAL_PERIODS, isValidTime } from '../config/reminders'

export const DEFAULT_GRACE_MS = 90 * 60 * 1000

function pad(value) {
  return String(value).padStart(2, '0')
}

export function timeToMinutes(time) {
  if (!isValidTime(time)) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function resolveTimeZone(config) {
  if (config && typeof config.timezone === 'string' && config.timezone && config.timezone !== 'auto') {
    return config.timezone
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// Offset (ms) of `timeZone` from UTC at the instant `date`. Uses the standard
// Intl round-trip so daylight-saving transitions are handled correctly.
export function getTimeZoneOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const parts = {}
  for (const part of dtf.formatToParts(date)) parts[part.type] = part.value
  let hour = Number(parts.hour)
  if (hour === 24) hour = 0
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second)
  )
  return asUTC - date.getTime()
}

// Convert a wall-clock time in `timeZone` to the matching UTC Date.
export function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const offset1 = getTimeZoneOffsetMs(new Date(utcGuess), timeZone)
  let epoch = utcGuess - offset1
  const offset2 = getTimeZoneOffsetMs(new Date(epoch), timeZone)
  if (offset2 !== offset1) epoch = utcGuess - offset2
  return new Date(epoch)
}

export function getZonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const parts = {}
  for (const part of dtf.formatToParts(date)) parts[part.type] = part.value
  let hour = Number(parts.hour)
  if (hour === 24) hour = 0
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second)
  }
}

export function localDateKey(date, timeZone) {
  const { year, month, day } = getZonedParts(date, timeZone)
  return `${year}-${pad(month)}-${pad(day)}`
}

export function isQuietHours(config, date, timeZone) {
  const quiet = config?.quietHours
  if (!quiet || !quiet.enabled) return false
  if (!isValidTime(quiet.start) || !isValidTime(quiet.end)) return false
  const { hour, minute } = getZonedParts(date, timeZone)
  const now = hour * 60 + minute
  const start = timeToMinutes(quiet.start)
  const end = timeToMinutes(quiet.end)
  if (start === end) return false
  if (start < end) return now >= start && now < end
  return now >= start || now < end
}

function weekdayForDate(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
}

// The next enabled, non-quiet reminder strictly after `now`.
export function computeNextReminder(config, { now = new Date(), timeZone } = {}) {
  if (!config?.enabled) return null
  const tz = timeZone || resolveTimeZone(config)
  const base = getZonedParts(now, tz)
  let best = null

  for (const period of MEAL_PERIODS) {
    const meal = config.meals?.[period.id]
    if (!meal?.enabled || !isValidTime(meal.time)) continue
    const [hour, minute] = meal.time.split(':').map(Number)

    for (let offset = 0; offset <= 7; offset += 1) {
      const dayAnchor = new Date(Date.UTC(base.year, base.month - 1, base.day + offset))
      const dayParts = {
        year: dayAnchor.getUTCFullYear(),
        month: dayAnchor.getUTCMonth() + 1,
        day: dayAnchor.getUTCDate()
      }
      if (!config.days?.includes(dayAnchor.getUTCDay())) continue
      const at = zonedTimeToUtc(dayParts.year, dayParts.month, dayParts.day, hour, minute, tz)
      if (at.getTime() <= now.getTime()) continue
      if (isQuietHours(config, at, tz)) continue
      if (!best || at.getTime() < best.at.getTime()) {
        best = { periodId: period.id, label: period.label, at }
      }
      break
    }
  }

  return best
}

// Reminders whose time has just passed today, within the grace window, and that
// have not fired yet. Quiet hours and disabled weekdays are skipped.
export function getDueReminders(config, log, { now = new Date(), timeZone, graceMs = DEFAULT_GRACE_MS } = {}) {
  if (!config?.enabled) return []
  const tz = timeZone || resolveTimeZone(config)
  const parts = getZonedParts(now, tz)
  const dateKey = localDateKey(now, tz)
  const weekday = weekdayForDate(parts)
  const due = []

  for (const period of MEAL_PERIODS) {
    const meal = config.meals?.[period.id]
    if (!meal?.enabled || !isValidTime(meal.time)) continue
    if (!config.days?.includes(weekday)) continue
    const [hour, minute] = meal.time.split(':').map(Number)
    const at = zonedTimeToUtc(parts.year, parts.month, parts.day, hour, minute, tz)
    const delta = now.getTime() - at.getTime()
    if (delta < 0 || delta > graceMs) continue
    const key = `${dateKey}:${period.id}`
    if (log?.fired?.[key]) continue
    if (isQuietHours(config, at, tz)) continue
    due.push({ periodId: period.id, label: period.label, at, key })
  }

  return due
}

// Flatten the next `days` worth of enabled occurrences. Used to hand a concrete
// schedule to the service worker for best-effort background delivery.
export function computeUpcomingOccurrences(config, { from = new Date(), days = 2, limit = 24, timeZone } = {}) {
  if (!config?.enabled) return []
  const tz = timeZone || resolveTimeZone(config)
  const base = getZonedParts(from, tz)
  const out = []

  for (let offset = 0; offset < days; offset += 1) {
    const dayAnchor = new Date(Date.UTC(base.year, base.month - 1, base.day + offset))
    const dayParts = {
      year: dayAnchor.getUTCFullYear(),
      month: dayAnchor.getUTCMonth() + 1,
      day: dayAnchor.getUTCDate()
    }
    if (!config.days?.includes(dayAnchor.getUTCDay())) continue
    const dateKey = `${dayParts.year}-${pad(dayParts.month)}-${pad(dayParts.day)}`

    for (const period of MEAL_PERIODS) {
      const meal = config.meals?.[period.id]
      if (!meal?.enabled || !isValidTime(meal.time)) continue
      const [hour, minute] = meal.time.split(':').map(Number)
      const at = zonedTimeToUtc(dayParts.year, dayParts.month, dayParts.day, hour, minute, tz)
      if (at.getTime() <= from.getTime()) continue
      if (isQuietHours(config, at, tz)) continue
      out.push({ at: at.getTime(), periodId: period.id, label: period.label, key: `${dateKey}:${period.id}` })
    }
  }

  out.sort((a, b) => a.at - b.at)
  return out.slice(0, limit)
}

export function formatTimeOfDay(time) {
  if (!isValidTime(time)) return ''
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${pad(minute)} ${suffix}`
}

export function formatDateTime(date) {
  if (!(date instanceof Date)) return ''
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
  })
}
