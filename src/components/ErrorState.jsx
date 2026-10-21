import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'

function ErrorState({ message, onRetry = null, compact = false }) {
  const { t } = useTranslation()
  const resolvedMessage = message === undefined ? t('app.errorBody') : message

  return (
    <div className={`error-state${compact ? ' error-state--compact' : ''}`} role="alert">
      <div className="error-state-icon" aria-hidden="true">
        <Icon name="refresh" size={34} />
      </div>
      <h2 className="error-state-title">{t('app.errorTitle')}</h2>
      <p className="error-state-message">
        {resolvedMessage}
        <br />
        {t('app.errorHint')}
      </p>
      {onRetry && (
        <button type="button" className="button button--primary" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export default ErrorState
