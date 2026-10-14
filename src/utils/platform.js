export function isStandalone() {
  if (typeof window === 'undefined') return false
  const matches = (query) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches

  if (matches('(display-mode: standalone)') || matches('(display-mode: fullscreen)')) return true

  // navigator.standalone only means "installed" on iOS home-screen web clips.
  // Guard against quirky browsers that expose it in a normal tab by requiring
  // the browser display mode to be absent (or unsupported, e.g. old iOS).
  if (getIOSDevice() && window.navigator.standalone === true && !matches('(display-mode: browser)')) return true

  return false
}

export function getIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

export function supportsWebShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export function supportsClipboard() {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'
}