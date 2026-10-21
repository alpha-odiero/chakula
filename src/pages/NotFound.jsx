import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

function NotFound() {
  const { t } = useTranslation()
  useSeo({
    title: t('notFound.seoTitle'),
    description: t('notFound.seoDescription'),
    path: '/404',
    robots: 'noindex,follow'
  })
  return (
    <main className="not-found">
      <div className="container not-found-inner">
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 className="page-title">{t('notFound.title')}</h1>
        <p className="page-subtitle">{t('notFound.subtitle')}</p>
        <Link to="/" className="button button--primary button--large">
          <Icon name="home" size={18} />
          {t('notFound.backHome')}
        </Link>
      </div>
    </main>
  )
}

export default NotFound
