// Real store listings for the Pikawise mobile apps.
//
// Leave a value empty until that app is actually published. While a URL is
// empty the matching button shows a polite "coming soon" message instead of
// navigating anywhere, so the footer never links to a fake or unrelated page.
// Once an app is live, paste its public store URL here and the button becomes a
// real link automatically — no layout or component changes required.
export const GOOGLE_PLAY_URL = ''
export const APP_STORE_URL = ''

export function isStoreLive(url) {
  return typeof url === 'string' && /^https?:\/\/\S+\.\S+/i.test(url.trim())
}
