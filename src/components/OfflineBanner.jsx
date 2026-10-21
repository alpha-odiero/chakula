import { useTranslation } from '../i18n/LocaleContext'
import Icon from './Icon'

function OfflineBanner() {
  const { t } = useTranslation()

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="container offline-banner-inner">
        <Icon name="refresh" size={16} />
        <p>{t('offline.banner')}</p>
      </div>
    </div>
  )
}

export default OfflineBanner
