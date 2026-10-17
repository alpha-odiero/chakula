/*
 * Pikawise notification service-worker extensions.
 *
 * This file is imported into the generated Workbox service worker. It handles
 * best-effort background reminder delivery and web-push messages. Periodic
 * Background Sync is not supported everywhere and is not guaranteed by the
 * platform; reliable background delivery requires a push backend.
 */

/* eslint-env serviceworker */

const PIKAWISE_DB = 'pikawise'
const PIKAWISE_DB_VERSION = 1
const SCHEDULE_STORE = 'reminder-schedule'
const FIRED_STORE = 'reminder-fired'
const SCHEDULE_KEY = 'upcoming'
const NOTIFICATION_SYNC_TAG = 'pikawise-reminders'
const DEFAULT_GRACE_MS = 90 * 60 * 1000
const ICON = '/icons/icon-192.png'

function openPikawiseDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(PIKAWISE_DB, PIKAWISE_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SCHEDULE_STORE)) db.createObjectStore(SCHEDULE_STORE)
      if (!db.objectStoreNames.contains(FIRED_STORE)) db.createObjectStore(FIRED_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function readStore(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function writeStore(db, store, value, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function anyClientVisible() {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    return clients.some((client) => client.visibilityState === 'visible' || client.focused)
  } catch {
    return false
  }
}

async function runReminderSync() {
  const db = await openPikawiseDb()
  try {
    const schedule = (await readStore(db, SCHEDULE_STORE, SCHEDULE_KEY)) || []
    const now = Date.now()

    // If a Pikawise window is open, the in-app scheduler owns delivery.
    if (await anyClientVisible()) return

    for (const occurrence of schedule) {
      if (!occurrence || typeof occurrence.at !== 'number') continue
      if (occurrence.at > now || now - occurrence.at > DEFAULT_GRACE_MS) continue
      const fired = await readStore(db, FIRED_STORE, occurrence.key)
      if (fired) continue

      const label = occurrence.label || 'Meal'
      await self.registration.showNotification(`${label} time`, {
        body: `Open Pikawise for ${label.toLowerCase()} ideas.`,
        tag: `pikawise-${occurrence.periodId || label}`,
        icon: ICON,
        data: { url: `/reminder?period=${encodeURIComponent(occurrence.periodId || '')}` }
      })
      await writeStore(db, FIRED_STORE, now, occurrence.key)
    }
  } finally {
    db.close()
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== NOTIFICATION_SYNC_TAG) return
  event.waitUntil(runReminderSync().catch(() => {}))
})

self.addEventListener('push', (event) => {
  let payload = { title: 'Pikawise', body: 'You have a new reminder.' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    if (event.data) payload.body = event.data.text()
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag || 'pikawise-push',
      icon: ICON,
      data: { url: payload.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin).href
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.length && 'focus' in clients[0]) {
        await clients[0].focus()
        if ('navigate' in clients[0]) return clients[0].navigate(url)
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    })()
  )
})
