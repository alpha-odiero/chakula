import { useEffect, useRef } from 'react'
import Icon from './Icon'

function ConfirmDialog({ open = true, title = 'Are you sure?', message = '', onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    if (dialogRef.current) dialogRef.current.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        tabIndex="-1"
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon" aria-hidden="true">
          <Icon name={danger ? 'trash' : 'info'} size={24} />
        </div>
        <h3 className="confirm-title" id="confirm-title">{title}</h3>
        {message && <p className="confirm-message" id="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`button ${danger ? 'button--danger' : 'button--primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog