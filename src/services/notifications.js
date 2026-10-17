/**
 * Real OS-level notifications via the Notification API and the service worker
 * registration. These are separate from the in-app notification centre: the
 * centre keeps a history, while these surface as system notifications.
 *
 * Delivery guarantees: while a Pikawise tab (or the installed app) is running,
 * notifications fire reliably. When the app is fully closed, delivery depends
 * on Periodic Background Sync, which is best-effort and only available in some
 * Chromium-based browsers. Guaranteed background delivery requires a push
 * service (see README / reminder section).
 */

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

// Show a system notification. Prefers the service worker registration so the
// notification has a stable tag, deep-links via `data`, and behaves like a real
// app notification; falls back to the constructor where unsupported.
export async function showOsNotification({ id, title, body, tag, data, requireInteraction = false }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false

  const options = {
    body,
    tag: tag || id || 'pikawise',
    data: data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    renotify: false,
    requireInteraction: Boolean(requireInteraction)
  }

  try {
    if (isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, {
          ...options,
          data: { ...(data || {}), url: data?.url || '/' }
        })
        return true
      }
    }
  } catch {
    // Fall through to the constructor below.
  }

  try {
    const notification = new Notification(title, { ...options, tag: notification_tag(tag) })
    notification.onclick = () => {
      if (typeof window !== 'undefined') window.focus()
    }
    return true
  } catch {
    return false
  }
}

function notification_tag(tag) {
  return typeof tag === 'string' ? tag : undefined
}

export function closeNotification(tag) {
  if (!tag || !isServiceWorkerSupported()) return
  navigator.serviceWorker.ready
    .then((registration) => registration.getNotifications({ tag }))
    .then((list) => list.forEach((item) => item.close()))
    .catch(() => {})
}
