import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n/LocaleContext'
import { APP_NAME } from '../config/app'

function PikawiseLoader({
  variant = 'section',
  label,
  showName,
  delay = 0,
  decorative = false,
  className = ''
}) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(delay <= 0)

  useEffect(() => {
    if (delay <= 0) {
      setShown(true)
      return undefined
    }
    setShown(false)
    const timer = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!shown) return null

  const withName = showName ?? variant !== 'inline'
  const classes = `pw-loader pw-loader--${variant}${className ? ` ${className}` : ''}`
  const resolvedLabel = label === undefined ? t('a11y.loading') : label
  const statusProps = decorative
    ? { 'aria-hidden': 'true' }
    : { role: 'status', 'aria-live': 'polite', 'aria-label': resolvedLabel }

  return (
    <div className={classes} {...statusProps}>
      {withName && (
        <span className="pw-loader-name" aria-hidden="true">
          {APP_NAME}
        </span>
      )}
      <span className="pw-loader-dots" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}

export default PikawiseLoader
