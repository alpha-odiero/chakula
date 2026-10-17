// Meal reminder configuration model.
//
// Reminders are entirely optional and device-local. The default config keeps
// three sensible mealtimes (breakfast, lunch, dinner) off until the user opts
// in, so enabling reminders is always an explicit choice.

export const MEAL_PERIODS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sun', defaultTime: '08:00' },
  { id: 'morningSnack', label: 'Morning snack', icon: 'sparkles', defaultTime: '10:30' },
  { id: 'lunch', label: 'Lunch', icon: 'utensils', defaultTime: '13:00' },
  { id: 'afternoonSnack', label: 'Afternoon snack', icon: 'sparkles', defaultTime: '16:00' },
  { id: 'dinner', label: 'Dinner', icon: 'cookingPot', defaultTime: '19:00' },
  { id: 'eveningSnack', label: 'Evening snack', icon: 'moon', defaultTime: '21:00' }
]

export const REMINDER_MODES = [
  { value: 'question', label: 'Ask what I am eating', hint: 'A friendly prompt to log your meal.' },
  { value: 'suggestions', label: 'Suggest meal ideas', hint: 'A few ideas picked for you.' },
  { value: 'both', label: 'Ask and suggest', hint: 'A prompt with ideas to choose from.' }
]

export const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' }
]

function defaultMeals() {
  const meals = {}
  for (const period of MEAL_PERIODS) {
    meals[period.id] = {
      enabled: period.id === 'breakfast' || period.id === 'lunch' || period.id === 'dinner',
      time: period.defaultTime
    }
  }
  return meals
}

export const DEFAULT_REMINDERS = {
  enabled: false,
  timezone: 'auto',
  modes: ['question', 'suggestions'],
  suggestionCount: 3,
  quietHours: { enabled: true, start: '21:30', end: '07:00' },
  days: [0, 1, 2, 3, 4, 5, 6],
  meals: defaultMeals()
}

// Merge a partial/legacy config over the defaults, keeping meal entries in sync
// with the known period list.
export function mergeReminders(base, override) {
  const merged = { ...base, ...(override && typeof override === 'object' ? override : {}) }
  merged.quietHours = { ...base.quietHours, ...(override?.quietHours || {}) }
  const days = Array.isArray(override?.days)
    ? override.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : base.days
  merged.days = days.length ? [...new Set(days)] : base.days
  merged.suggestionCount = Number.isFinite(Number(override?.suggestionCount))
    ? Math.min(5, Math.max(1, Math.round(Number(override.suggestionCount))))
    : base.suggestionCount
  merged.meals = {}
  for (const period of MEAL_PERIODS) {
    const stored = override?.meals?.[period.id] || {}
    merged.meals[period.id] = {
      enabled: stored.enabled ?? base.meals[period.id].enabled,
      time: isValidTime(stored.time) ? stored.time : base.meals[period.id].time
    }
  }
  const validModes = REMINDER_MODES.map((mode) => mode.value)
  let modes = Array.isArray(override?.modes)
    ? override.modes.filter((mode) => validModes.includes(mode))
    : null
  if (!modes || !modes.length) {
    // Back-compat with the old single "mode" field.
    if (validModes.includes(merged.mode)) {
      modes = merged.mode === 'both' ? ['question', 'suggestions'] : [merged.mode]
    } else {
      modes = base.modes
    }
  }
  merged.modes = [...new Set(modes)]
  delete merged.mode
  if (typeof merged.enabled !== 'boolean') merged.enabled = base.enabled
  if (typeof merged.timezone !== 'string' || !merged.timezone) merged.timezone = base.timezone
  return merged
}

export function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function periodById(id) {
  return MEAL_PERIODS.find((period) => period.id === id) || null
}
