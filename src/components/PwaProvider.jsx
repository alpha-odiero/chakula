import { createContext, useContext, useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { useToast } from './Toast'
import { addNotification, dismissNotification, unacknowledgeNotification } from '../utils/storage'

const UPDATE_NOTIFICATION_ID = 'app-update'

const PwaContext = createContext({ updateAvailable: false, update: () => {}, dismiss: () => {} })

export function usePwa() {
  return useContext(PwaContext)
}

function PwaProvider({ children }) {
  const { notify } = useToast()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateReg, setUpdateReg] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!('serviceWorker' in navigator)) return undefined

    let watchInterval = null
    const updateSW = registerSW({
      onNeedRefresh() {
        // A new service worker has downloaded and is waiting. Surface it in the
        // notification centre instead of interrupting the user with a popup.
        // Un-acknowledge first so a freshly downloaded update re-surfaces even
        // if the user dismissed a previous one.
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
    setUpdateReg(() => updateSW)

    return () => {
      if (watchInterval) clearInterval(watchInterval)
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

    if (updateReg) {
      // vite-plugin-pwa posts the skip-waiting message and reloads only once the
      // new service worker actually takes control of the page.
      await updateReg(true)
    } else {
      window.location.reload()
    }
    return true
  }

  const dismissUpdate = () => {
    dismissNotification(UPDATE_NOTIFICATION_ID)
    setUpdateAvailable(false)
  }

  return (
    <PwaContext.Provider
      value={{ updateAvailable, update: applyUpdate, dismiss: dismissUpdate }}
    >
      {children}
    </PwaContext.Provider>
  )
}

export default PwaProvider
