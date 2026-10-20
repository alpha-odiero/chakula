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

export function getAndroidDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

// Platform-specific manual install instructions, used whenever the native
// install prompt is unavailable or the user dismissed it, so the "Get app"
// button always leads somewhere useful.
export function getInstallGuide() {
  if (getIOSDevice()) {
    return {
      platform: 'iPhone and iPad',
      steps: ['Tap the Share button in Safari', 'Choose "Add to Home Screen"', 'Tap "Add"']
    }
  }
  if (getAndroidDevice()) {
    return {
      platform: 'Android',
      steps: [
        'Open your browser menu (⋮)',
        'Tap "Install app" or "Add to Home screen"',
        'Confirm with "Install"'
      ]
    }
  }
  return {
    platform: 'desktop',
    steps: [
      'Open your browser menu',
      'Choose "Install Pikawise…" or "Install this site as an app"',
      'Confirm the install'
    ]
  }
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