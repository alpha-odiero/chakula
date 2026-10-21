import { useEffect, useRef } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'

function ConfirmDialog({ open = true, title, message = '', onConfirm, onCancel, confirmLabel, cancelLabel, danger = false }) {
  const { t } = useTranslation()
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

  const resolvedTitle = title === undefined ? t('app.confirmTitle') : title
  const resolvedConfirmLabel = confirmLabel === undefined ? t('app.confirmAction') : confirmLabel
  const resolvedCancelLabel = cancelLabel === undefined ? t('common.cancel') : cancelLabel

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
        <h3 className="confirm-title" id="confirm-title">{resolvedTitle}</h3>
        {message && <p className="confirm-message" id="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>{resolvedCancelLabel}</button>
          <button type="button" className={`button ${danger ? 'button--danger' : 'button--primary'}`} onClick={onConfirm}>{resolvedConfirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
