/**
 * Best-effort bridge between the in-app reminder scheduler and the service
 * worker. The app writes the next occurrences to IndexedDB and asks the browser
 * for periodic background sync. When the app is fully closed, the service
 * worker may deliver those reminders — but Periodic Background Sync is only
 * available in some Chromium browsers and is not guaranteed. Reliable
 * background delivery needs a push backend.
 */

const DB_NAME = 'pikawise'
const DB_VERSION = 1
const STORE = 'reminder-schedule'
const FIRED_STORE = 'reminder-fired'
const SCHEDULE_KEY = 'upcoming'
const SYNC_TAG = 'pikawise-reminders'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      if (!db.objectStoreNames.contains(FIRED_STORE)) db.createObjectStore(FIRED_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function writeReminderSchedule(occurrences) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(Array.isArray(occurrences) ? occurrences : [], SCHEDULE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
    return true
  } catch {
    return false
  }
}

export async function requestPeriodicBackgroundSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    if (!registration.periodicSync || typeof registration.periodicSync.register !== 'function') {
      return false
    }
    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
        if (status.state !== 'granted') return false
      } catch {
        return false
      }
    }
    const tags = await registration.periodicSync.getTags()
    if (!tags.includes(SYNC_TAG)) {
      await registration.periodicSync.register(SYNC_TAG, { minInterval: 15 * 60 * 1000 })
    }
    return true
  } catch {
    return false
  }
}

export async function cancelPeriodicBackgroundSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    if (!registration.periodicSync) return
    const tags = await registration.periodicSync.getTags()
    if (tags.includes(SYNC_TAG)) await registration.periodicSync.unregister(SYNC_TAG)
  } catch {
    // ignore
  }
}
