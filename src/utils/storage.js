import { DEFAULT_REMINDERS, mergeReminders } from '../config/reminders'

const PREFIX = 'chakula_'

const KEYS = {
  theme: `${PREFIX}theme`,
  installDismissed: `${PREFIX}install_dismissed`,
  mealPlans: `${PREFIX}meal_plans`,
  shoppingChecks: `${PREFIX}shopping_checks`,
  personalShopping: `${PREFIX}personal_shopping`,
  preferences: `${PREFIX}preferences`,
  cookieConsent: `${PREFIX}cookie_consent`,
  notifications: `${PREFIX}notifications`,
  notificationsAck: `${PREFIX}notifications_ack`,
  reminders: `${PREFIX}reminders`,
  reminderLog: `${PREFIX}reminder_log`
}

export const DEFAULT_PREFERENCES = {
  onboarded: false,
  mealsPerDay: 3,
  cookingTime: 'any',
  preferredMealTypes: ['breakfast', 'lunch', 'dinner'],
  dietaryPreference: 'any',
  allergies: [],
  excludedIngredients: [],
  preferredCuisines: [],
  reduceMotion: false,
  acceptedDisclaimer: false
}

function isStorageAvailable() {
  try {
    const testKey = `${PREFIX}__test__`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function read(key, fallback) {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked — fail quietly, app continues in-memory.
  }
}

function remove(key) {
  if (!isStorageAvailable()) return
  window.localStorage.removeItem(key)
}

/* ---------- Theme ---------- */

export function getTheme() {
  return read(KEYS.theme, 'light')
}

export function saveTheme(theme) {
  write(KEYS.theme, theme)
}

/* ---------- Install prompt ---------- */

export function getInstallDismissed() {
  return read(KEYS.installDismissed, false) === true
}

export function setInstallDismissed(value = true) {
  write(KEYS.installDismissed, value)
}

export function clearInstallDismissed() {
  remove(KEYS.installDismissed)
}

/* ---------- Meal plans ---------- */

export function getMealPlans() {
  const value = read(KEYS.mealPlans, [])
  return Array.isArray(value) ? value : []
}

export function saveMealPlans(plans) {
  write(KEYS.mealPlans, plans)
}

export function addMealPlan(plan) {
  const plans = getMealPlans()
  const next = [plan, ...plans.filter((p) => p.id !== plan.id)]
  saveMealPlans(next)
  return next
}

export function removeMealPlan(id) {
  const plans = getMealPlans()
  const next = plans.filter((p) => p.id !== id)
  saveMealPlans(next)
  return next
}

export function clearMealPlans() {
  saveMealPlans([])
  return []
}

/* ---------- Shopping list check-offs ---------- */

export function getShoppingChecks() {
  const value = read(KEYS.shoppingChecks, {})
  return value && typeof value === 'object' ? value : {}
}

export function saveShoppingChecks(checks) {
  write(KEYS.shoppingChecks, checks)
}

export function setShoppingItemChecked(planId, itemId, checked) {
  const checks = getShoppingChecks()
  const planChecks = { ...(checks[planId] || {}) }
  if (checked) planChecks[itemId] = true
  else delete planChecks[itemId]
  const next = { ...checks, [planId]: planChecks }
  saveShoppingChecks(next)
  return next
}

export function clearShoppingChecks() {
  saveShoppingChecks({})
  return {}
}

/* ---------- Personal shopping list ---------- */

export function getPersonalShopping() {
  const value = read(KEYS.personalShopping, [])
  return Array.isArray(value) ? value : []
}

export function savePersonalShopping(items) {
  write(KEYS.personalShopping, items)
}

export function addPersonalShoppingItem(name) {
  const items = getPersonalShopping()
  const cleaned = String(name || '').trim()
  if (!cleaned) return items
  if (items.some((item) => item.name.toLowerCase() === cleaned.toLowerCase())) return items
  const next = [...items, { id: `p-${Date.now()}-${items.length}`, name: cleaned, checked: false }]
  savePersonalShopping(next)
  return next
}

export function togglePersonalShoppingItem(id) {
  const next = getPersonalShopping().map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  )
  savePersonalShopping(next)
  return next
}

export function removePersonalShoppingItem(id) {
  const next = getPersonalShopping().filter((item) => item.id !== id)
  savePersonalShopping(next)
  return next
}

export function clearPersonalShoppingCollected() {
  const next = getPersonalShopping().filter((item) => !item.checked)
  savePersonalShopping(next)
  return next
}

/* ---------- Preferences ---------- */

export function getPreferences() {
  const stored = read(KEYS.preferences, null)
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_PREFERENCES }
  return { ...DEFAULT_PREFERENCES, ...stored }
}

export function savePreferences(preferences) {
  write(KEYS.preferences, preferences)
}

/* ---------- Meal reminders ---------- */

// Returns the stored reminder configuration merged over the defaults so new
// fields always have a value and existing users keep their settings.
export function getReminders() {
  const stored = read(KEYS.reminders, null)
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_REMINDERS }
  return mergeReminders(DEFAULT_REMINDERS, stored)
}

export function saveReminders(config) {
  write(KEYS.reminders, mergeReminders(DEFAULT_REMINDERS, config))
}

export function clearReminders() {
  remove(KEYS.reminders)
}

// Reminder firing bookkeeping. `fired` is keyed by `${localDate}:${periodId}` so
// a period only ever fires once per day, even across reloads or multiple tabs.
export function getReminderLog() {
  const value = read(KEYS.reminderLog, null)
  if (!value || typeof value !== 'object') return { fired: {} }
  return { fired: value.fired && typeof value.fired === 'object' ? value.fired : {} }
}

export function saveReminderLog(log) {
  write(KEYS.reminderLog, log)
}

export function markReminderFired(key, timestamp = Date.now()) {
  if (!key) return getReminderLog()
  const log = getReminderLog()
  log.fired[key] = timestamp
  // Keep the log small: drop entries older than 14 days.
  const cutoff = timestamp - 14 * 24 * 60 * 60 * 1000
  const fired = {}
  for (const [entryKey, at] of Object.entries(log.fired)) {
    if (Number(at) >= cutoff) fired[entryKey] = at
  }
  const next = { fired }
  saveReminderLog(next)
  return next
}

export function clearReminderLog() {
  remove(KEYS.reminderLog)
}

/* ---------- Cookie consent ---------- */

// Bump only when the technologies used or the consent requirements change,
// so returning users are asked again solely for a genuinely new decision.
export const COOKIE_CONSENT_VERSION = 1

// Older builds stored a bare string. Closing a banner was never consent.
const LEGACY_ACCEPTED = ['accepted', 'essential', 'accepted_all']

export function getCookieConsent() {
  return read(KEYS.cookieConsent, null)
}

export function hasValidCookieConsent() {
  const stored = getCookieConsent()
  if (stored === null || stored === undefined) return false
  if (typeof stored === 'object') {
    return Number(stored.version) >= COOKIE_CONSENT_VERSION && Boolean(stored.choice)
  }
  return LEGACY_ACCEPTED.includes(stored)
}

export function getCookieConsentChoice() {
  const stored = getCookieConsent()
  if (stored && typeof stored === 'object') return stored.choice || null
  if (typeof stored === 'string' && LEGACY_ACCEPTED.includes(stored)) return 'accepted'
  return null
}

export function saveCookieConsent(choice) {
  write(KEYS.cookieConsent, {
    version: COOKIE_CONSENT_VERSION,
    choice,
    timestamp: Date.now()
  })
}

/* ---------- Notifications ---------- */

const NOTIFICATIONS_LIMIT = 20

export function getNotifications() {
  const value = read(KEYS.notifications, [])
  return Array.isArray(value) ? value : []
}

function saveNotifications(list) {
  write(KEYS.notifications, Array.isArray(list) ? list.slice(0, NOTIFICATIONS_LIMIT) : [])
}

function getAcknowledgedIds() {
  const value = read(KEYS.notificationsAck, [])
  return Array.isArray(value) ? value : []
}

export function acknowledgeNotification(id) {
  if (!id) return
  const acknowledged = getAcknowledgedIds()
  if (acknowledged.includes(id)) return
  write(KEYS.notificationsAck, [...acknowledged, id])
}

// Allow a fixed-id notification (e.g. "app-update") to resurface for a genuinely
// new event after an earlier one was dismissed.
export function unacknowledgeNotification(id) {
  if (!id) return
  const acknowledged = getAcknowledgedIds()
  if (!acknowledged.includes(id)) return
  write(
    KEYS.notificationsAck,
    acknowledged.filter((item) => item !== id)
  )
}

export function addNotification(notification) {
  if (!notification || !notification.id) return getNotifications()
  if (getAcknowledgedIds().includes(notification.id)) return getNotifications()
  const list = getNotifications()
  if (list.some((item) => item.id === notification.id)) return list
  const next = [{ timestamp: Date.now(), read: false, ...notification }, ...list]
  saveNotifications(next)
  return next
}

export function markNotificationRead(id) {
  const next = getNotifications().map((item) =>
    item.id === id ? { ...item, read: true } : item
  )
  saveNotifications(next)
  return next
}

export function markAllNotificationsRead() {
  const next = getNotifications().map((item) => (item.read ? item : { ...item, read: true }))
  saveNotifications(next)
  return next
}

export function dismissNotification(id) {
  if (!id) return getNotifications()
  acknowledgeNotification(id)
  const next = getNotifications().filter((item) => item.id !== id)
  saveNotifications(next)
  return next
}

export function clearNotifications() {
  saveNotifications([])
  return []
}

export function clearPreferences() {
  remove(KEYS.preferences)
}

export function resetAllPreferences() {
  remove(KEYS.preferences)
  remove(KEYS.theme)
  remove(KEYS.mealPlans)
  remove(KEYS.shoppingChecks)
  remove(KEYS.installDismissed)
  remove(KEYS.cookieConsent)
}

/* ---------- General ---------- */

export function clearLocalData() {
  if (!isStorageAvailable()) return
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
}
