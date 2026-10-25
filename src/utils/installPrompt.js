import { isStandalone } from './platform'

// The browser dispatches `beforeinstallprompt` at most once per page load and
// the event may only be consumed once. Several parts of the app ask for it
// (the header CTA, the mobile menu, the auto install sheet and Settings), so
// one shared store owns the event.
//
// Previously every component kept its own copy of the hook state. The first
// component to call prompt() consumed the event, and every other component
// then called prompt() again on an already-used event. Chrome rejects that
// with InvalidStateError, which was thrown outside the try/catch and left the
// "Get app" button looking permanently broken.
const listeners = new Set()

let deferredPrompt = null
let installed = false
let prompting = false
let started = false

function emit() {
  listeners.forEach((listener) => listener())
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true

  const checkStandalone = () => {
    const standalone = isStandalone()
    if (standalone === installed) return
    installed = standalone
    if (standalone) deferredPrompt = null
    emit()
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    emit()
  })

  window.addEventListener('appinstalled', () => {
    installed = true
    deferredPrompt = null
    emit()
  })

  window.addEventListener('resize', checkStandalone)

  installed = isStandalone()
}

// Capture beforeinstallprompt as soon as this module loads. On repeat visits
// the service worker is already active, so the browser can fire the event
// before React effects subscribe — losing it would leave "Get app" with no
// native prompt on mobile even though the app is installable.
start()

export function subscribeToInstallState(listener) {
  start()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getInstallState() {
  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled: installed,
    isPrompting: prompting
  }
}

export function markInstalled() {
  installed = true
  deferredPrompt = null
  emit()
}

// Shows the browser's own install dialog. The event is single-use, so it is
// cleared before the prompt is awaited: a second click while the dialog is
// open must fall back to the manual guide instead of calling prompt() again.
export async function promptInstall() {
  if (prompting) return { outcome: 'busy' }
  if (!deferredPrompt) return { outcome: 'unavailable' }

  prompting = true
  const event = deferredPrompt
  deferredPrompt = null
  emit()

  let outcome = 'dismissed'
  try {
    await event.prompt()
    const choice = await event.userChoice
    if (choice?.outcome === 'accepted') outcome = 'accepted'
  } catch {
    // Chrome throws InvalidStateError when the event was already used and
    // NotAllowedError when there is no user gesture. Both mean "no native
    // prompt", so the caller shows the manual guide instead.
    outcome = 'dismissed'
  } finally {
    prompting = false
    emit()
  }

  return { outcome }
}
