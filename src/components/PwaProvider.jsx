import { createContext, useContext, useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import Icon from './Icon'

const PwaContext = createContext({ updateAvailable: false, update: () => {} })

export function usePwa() {
  return useContext(PwaContext)
}

function PwaProvider({ children }) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateReg, setUpdateReg] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (!('serviceWorker' in navigator)) return undefined

    let watchInterval = null
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
        setTimeout(() => setOfflineReady(false), 4000)
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
  }, [])

  const applyUpdate = async () => {
    if (updateReg) {
      await updateReg(true)
      setUpdateAvailable(false)
    } else {
      window.location.reload()
    }
  }

  const dismissUpdate = () => setUpdateAvailable(false)

  return (
    <PwaContext.Provider value={{ updateAvailable, offlineReady, update: applyUpdate, dismiss: dismissUpdate }}>
      {children}
      {updateAvailable && <UpdateModal onUpdate={applyUpdate} onDismiss={dismissUpdate} />}
      {offlineReady && (
        <div className="toast toast--info" role="status">
          Chakula is ready to work offline.
        </div>
      )}
    </PwaContext.Provider>
  )
}

function UpdateModal({ onUpdate, onDismiss }) {
  return (
    <div className="update-overlay" role="dialog" aria-label="Update available" onClick={onDismiss}>
      <div className="update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="update-modal-brand">
          <div className="update-modal-logo" aria-hidden="true">
            <Icon name="cookingPot" size={22} />
          </div>
        </div>
        <h2 className="update-modal-title">New version available</h2>
        <p className="update-modal-desc">
          Chakula has been updated with improvements and bug fixes. Reload to get the latest version.
        </p>
        <ul className="update-features">
          <li className="update-feature">
            <span className="update-feature-check" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            Performance improvements
          </li>
          <li className="update-feature">
            <span className="update-feature-check" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            Bug fixes and stability
          </li>
          <li className="update-feature">
            <span className="update-feature-check" aria-hidden="true">
              <Icon name="check" size={14} />
            </span>
            Updated meal database
          </li>
        </ul>
        <div className="update-modal-actions">
          <button type="button" className="button button--primary" onClick={onUpdate}>
            Reload now
          </button>
          <button type="button" className="button button--ghost" onClick={onDismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default PwaProvider
