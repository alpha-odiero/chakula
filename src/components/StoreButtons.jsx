import { useToast } from './Toast'
import { GOOGLE_PLAY_URL, APP_STORE_URL, isStoreLive } from '../config/stores'

// Official Google Play prism (4-colour mark), sourced from the public-domain
// Wikimedia Commons artwork "Google Play 2022 icon.svg".
function GooglePlayLogo() {
  return (
    <svg
      className="store-btn-logo"
      viewBox="0 0 28.99 31.99"
      width="26"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.54 15.28.12 29.34a3.66 3.66 0 0 0 5.33 2.16l15.1-8.6Z" fill="#ea4335" />
      <path
        d="m27.11 12.89-6.53-3.74-7.35 6.45 7.38 7.28 6.48-3.7a3.54 3.54 0 0 0 1.5-4.79 3.62 3.62 0 0 0-1.5-1.5z"
        fill="#fbbc04"
      />
      <path d="M.12 2.66a3.57 3.57 0 0 0-.12.92v24.84a3.57 3.57 0 0 0 .12.92L14 15.64Z" fill="#4285f4" />
      <path d="m13.64 16 6.94-6.85L5.5.51A3.73 3.73 0 0 0 3.63 0 3.64 3.64 0 0 0 .12 2.65Z" fill="#34a853" />
    </svg>
  )
}

// Apple logo, sourced from the Wikimedia Commons artwork "Apple logo black.svg".
function AppleLogo() {
  return (
    <svg
      className="store-btn-logo"
      viewBox="0 0 814 1000"
      width="23"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
      />
    </svg>
  )
}

const STORES = [
  {
    key: 'google-play',
    url: GOOGLE_PLAY_URL,
    kicker: 'GET IT ON',
    name: 'Google Play',
    logo: <GooglePlayLogo />,
    comingSoon: 'Coming soon! The Pikawise Android app is on its way.'
  },
  {
    key: 'app-store',
    url: APP_STORE_URL,
    kicker: 'Download on the',
    name: 'App Store',
    logo: <AppleLogo />,
    comingSoon: 'Coming soon! The Pikawise iOS app is on its way.'
  }
]

function StoreButtons() {
  const { info } = useToast()

  return (
    <div className="store-buttons">
      {STORES.map((store) => {
        const content = (
          <>
            <span className="store-btn-logo-wrap">{store.logo}</span>
            <span className="store-btn-text">
              <span className="store-btn-kicker">{store.kicker}</span>
              <span className="store-btn-name">{store.name}</span>
            </span>
          </>
        )

        if (isStoreLive(store.url)) {
          return (
            <a
              key={store.key}
              className="store-btn"
              href={store.url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${store.kicker} ${store.name}`}
            >
              {content}
            </a>
          )
        }

        return (
          <button
            key={store.key}
            type="button"
            className="store-btn"
            onClick={() => info(store.comingSoon)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

export default StoreButtons
