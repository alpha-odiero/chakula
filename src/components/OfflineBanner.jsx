import Icon from './Icon'

function OfflineBanner() {
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <div className="container offline-banner-inner">
        <Icon name="refresh" size={16} />
        <p>
          You're offline. Some previously viewed content may still be available.
          Reconnect to discover new meals.
        </p>
      </div>
    </div>
  )
}

export default OfflineBanner