import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { useToast } from './Toast'
import { isStandalone } from '../utils/platform'
import { addNotification, dismissNotification, unacknowledgeNotification } from '../utils/storage'

const UPDATE_NOTIFICATION_ID = 'app-update'
const WEB_UPDATE_FLAG = 'pikawise-updated'
const AUTO_APPLY_DELAY_MS = 1500
const AUTO_APPLY_RETRY_MS = 5000
const AUTO_APPLY_COOLDOWN_MS = 30000

// Updates are silent on the open web: the page reloads already up to date with
// no notification. The in-app update prompt (notification centre) is reserved
// for the installed app.
const PwaContext = createContext({ updateAvailable: false, update: () => {}, dismiss: () => {} })

export function usePwa() {
  return useContext(PwaContext)
}

// Do not reload under the user's fingers: skip while cooking mode is open or a
// form field is focused. The update is retried until the app is idle.
function isUserBusy() {
  if (typeof document === 'undefined') return false
  if (document.body.classList.contains('cooking-mode-active')) return true
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return active.isContentEditable === true
}

function recentlyAutoApplied() {
  try {
    const last = Number(sessionStorage.getItem(`${WEB_UPDATE_FLAG}-at`) || 0)
    return Date.now() - last < AUTO_APPLY_COOLDOWN_MS
  } catch {
    return false
  }
}

function PwaProvider({ children }) {
  const { notify } = useToast()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const updateSWRef = useRef(null)
  const autoAppliedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!('serviceWorker' in navigator)) return undefined

    let watchInterval = null
    let retryTimer = null

    const applyOnWeb = () => {
      const attempt = () => {
        if (autoAppliedRef.current) return
        if (isUserBusy()) {
          retryTimer = setTimeout(attempt, AUTO_APPLY_RETRY_MS)
          return
        }
        autoAppliedRef.current = true
        dismissNotification(UPDATE_NOTIFICATION_ID)
        try {
          sessionStorage.setItem(`${WEB_UPDATE_FLAG}-at`, String(Date.now()))
        } catch {
          // ignore storage failures
        }
        if (updateSWRef.current) updateSWRef.current(true)
      }
      retryTimer = setTimeout(attempt, AUTO_APPLY_DELAY_MS)
    }

    const updateSW = registerSW({
      onNeedRefresh() {
        // Installed apps (standalone) keep the explicit "Update now" prompt in
        // the notification centre so a background update never surprises the
        // user mid-task. Ordinary browser tabs update silently and seamlessly.
        if (!isStandalone()) {
          if (!recentlyAutoApplied()) applyOnWeb()
          return
        }
        unacknowledgeNotification(UPDATE_NOTIFICATION_ID)
        addNotification({
          id: UPDATE_NOTIFICATION_ID,
          type: 'update',
          title: 'Update available',
          body: 'A new Pikawise update is available. Apply it when you are ready.'
        })
        setUpdateAvailable(true)
      },
      onOfflineReady() {
        notify('Pikawise is ready to work offline.', { variant: 'success' })
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          watchInterval = setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        }
      }
    })
    updateSWRef.current = updateSW

    return () => {
      if (watchInterval) clearInterval(watchInterval)
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [notify])

  const applyUpdate = async () => {
    const cooking = typeof document !== 'undefined' && document.body.classList.contains('cooking-mode-active')
    if (cooking) {
      notify('Finish cooking first — the update will be ready as soon as you are done.', {
        variant: 'info'
      })
      return false
    }

    // Acknowledge before reloading so the notification is not re-shown as unread.
    dismissNotification(UPDATE_NOTIFICATION_ID)
    setUpdateAvailable(false)

    if (updateSWRef.current) {
      // vite-plugin-pwa posts the skip-waiting message and reloads only once the
      // new service worker actually takes control of the page.
      await updateSWRef.current(true)
    } else {
      window.location.reload()
    }
  }

  const dismissUpdate = () => {
    dismissNotification(UPDATE_NOTIFICATION_ID)
    setUpdateAvailable(false)
  }

  return (
    <PwaContext.Provider value={{ updateAvailable, update: applyUpdate, dismiss: dismissUpdate }}>
      {children}
    </PwaContext.Provider>
  )
}

export default PwaProvider
