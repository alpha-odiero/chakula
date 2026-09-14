export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
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