import Icon from './Icon'

function ErrorState({ message = 'Something went wrong.\nWe couldn\'t load meals right now.', onRetry = null, compact = false }) {
  return (
    <div className={`error-state${compact ? ' error-state--compact' : ''}`} role="alert">
      <div className="error-state-icon" aria-hidden="true">
        <Icon name="refresh" size={34} />
      </div>
      <h2 className="error-state-title">Something went wrong.</h2>
      <p className="error-state-message">
        We couldn't load meals right now.
        <br />
        Please check your connection and try again.
      </p>
      {onRetry && (
        <button type="button" className="button button--primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorState