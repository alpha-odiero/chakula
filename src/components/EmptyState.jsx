import { useTranslation } from '../i18n/LocaleContext'

function EmptyState({ title, message = '', action = null, icon = null }) {
  const { t } = useTranslation()
  const resolvedTitle = title === undefined ? t('app.emptyTitle') : title

  return (
    <div className="empty-state" role="status">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h2 className="empty-state-title">{resolvedTitle}</h2>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}

export default EmptyState
