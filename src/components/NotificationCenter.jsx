/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { usePwa } from './PwaProvider'
import { getNotifications, markAllNotificationsRead, dismissNotification } from '../utils/storage'

function formatTime(timestamp) {
  const diff = Date.now() - (timestamp || Date.now())
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(timestamp).toLocaleDateString()
}

function NotificationCenter({ className = '' }) {
  const { updateAvailable, update } = usePwa()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(getNotifications)
  const wrapRef = useRef(null)

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items])

  useEffect(() => {
    setItems(getNotifications())
  }, [updateAvailable])

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    setItems(markAllNotificationsRead())
    setOpen(true)
  }

  const handleDismiss = (id) => setItems(dismissNotification(id))

  const handleUpdate = async () => {
    setOpen(false)
    await update()
    setItems(getNotifications())
  }

  return (
    <div className="notif" ref={wrapRef}>
      <button
        type="button"
        className={`notif-button ${className}`.trim()}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-head">
            <h2>Notifications</h2>
            <button
              type="button"
              className="notif-close"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notif-list">
              {items.map((item) => (
                <li key={item.id} className={`notif-item${item.read ? ' notif-item--read' : ''}`}>
                  <span className="notif-item-mark" aria-hidden="true" />
                  <div className="notif-item-main">
                    <p className="notif-item-title">{item.title}</p>
                    {item.body && <p className="notif-item-body">{item.body}</p>}
                    <p className="notif-item-time">{formatTime(item.timestamp)}</p>
                    {item.type === 'update' && (
                      <button
                        type="button"
                        className="button button--primary notif-item-action"
                        onClick={handleUpdate}
                      >
                        Update now
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="notif-item-dismiss"
                    aria-label={`Dismiss ${item.title}`}
                    onClick={() => handleDismiss(item.id)}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
