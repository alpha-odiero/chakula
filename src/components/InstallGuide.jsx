import { useEffect, useRef } from 'react'
import Icon from './Icon'
import { getInstallGuide } from '../utils/platform'

function InstallGuide({ onClose, message }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    if (dialogRef.current) dialogRef.current.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
  }, [onClose])

  const guide = getInstallGuide()
  const text =
    message ||
    `Pikawise is not in the app stores yet. On ${guide.platform}, install it from your browser in a few steps:`

  return (
    <div className="confirm-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="confirm-dialog install-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        aria-describedby="install-guide-message"
        tabIndex="-1"
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon" aria-hidden="true">
          <Icon name="install" size={24} />
        </div>
        <h3 className="confirm-title" id="install-guide-title">
          Get Pikawise
        </h3>
        <p className="confirm-message" id="install-guide-message">
          {text}
        </p>
        <ol className="install-guide-steps">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="confirm-actions">
          <button type="button" className="button button--primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallGuide
