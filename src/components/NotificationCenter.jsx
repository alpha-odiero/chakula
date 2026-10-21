/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { usePwa } from './PwaProvider'
import { getNotifications, markAllNotificationsRead, dismissNotification } from '../utils/storage'
import { useTranslation } from '../i18n/LocaleContext'

function formatTime(timestamp, t) {
  const diff = Date.now() - (timestamp || Date.now())
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('notifications.hoursAgo', { count: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return t('notifications.daysAgo', { count: days })
  return new Date(timestamp).toLocaleDateString()
}

// Notifications are stored with translation keys so a notification created in
// one language still renders correctly after the user switches language.
// Older entries keep their plain title/body and are shown as they are.
function notificationText(item, t) {
  const periodLabel = item.periodId ? t(`config.period.${item.periodId}`) : t('config.period.default')
  const title = item.titleKey
    ? t(item.titleKey, { ...(item.titleParams || {}), label: periodLabel })
    : item.title
  const body = item.bodyKey
    ? t(item.bodyKey, { ...(item.bodyParams || {}), label: periodLabel })
    : item.body
  return { title, body }
}

function NotificationCenter({ className = '' }) {
  const { t } = useTranslation()
  const { updateAvailable, update } = usePwa()
  const navigate = useNavigate()
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

  const handleReminder = (item) => {
    setOpen(false)
    const period = item.periodId ? `?period=${encodeURIComponent(item.periodId)}` : ''
    navigate(`/reminder${period}`)
  }

  const handleOpenReminder = (periodId) => {
    setOpen(false)
    navigate(periodId ? `/reminder?period=${encodeURIComponent(periodId)}` : '/reminder')
  }

  return (
    <div className="notif" ref={wrapRef}>
      <button
        type="button"
        className={`notif-button ${className}`.trim()}
        aria-label={
          unread > 0
            ? t('notifications.ariaUnread', { count: unread })
            : t('notifications.ariaButton')
        }
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
        <div className="notif-panel" role="dialog" aria-label={t('notifications.title')}>
          <div className="notif-panel-head">
            <h2>{t('notifications.title')}</h2>
            <button
              type="button"
              className="notif-close"
              aria-label={t('notifications.closeAria')}
              onClick={() => setOpen(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">{t('notifications.empty')}</p>
          ) : (
            <ul className="notif-list">
              {items.map((item) => {
                const { title, body } = notificationText(item, t)
                return (
                  <li key={item.id} className={`notif-item${item.read ? ' notif-item--read' : ''}`}>
                    <span className="notif-item-mark" aria-hidden="true" />
                    <div className="notif-item-main">
                      <p className="notif-item-title">{title}</p>
                      {body && <p className="notif-item-body">{body}</p>}
                      <p className="notif-item-time">{formatTime(item.timestamp, t)}</p>
                      {item.type === 'update' && (
                        <button
                          type="button"
                          className="button button--primary notif-item-action"
                          onClick={handleUpdate}
                        >
                          {t('notifications.updateNow')}
                        </button>
                      )}
                      {item.type === 'reminder' && (
                        <button
                          type="button"
                          className="button button--primary notif-item-action"
                          onClick={() => handleReminder(item)}
                        >
                          {t('notifications.pickMeal')}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="notif-item-dismiss"
                      aria-label={t('notifications.dismissAria', { title })}
                      onClick={() => handleDismiss(item.id)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
