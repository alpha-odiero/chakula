import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { preloadDictionary, resolveInitialLocale } from './i18n'
import { getLocale } from './utils/storage'
import './styles/app.css'

const locale = resolveInitialLocale(getLocale())

// Load the saved language before the first render so no English text flashes
// on screen. A slow or failed chunk falls back to English after 1.5s instead
// of holding the app behind the splash screen.
const READY_TIMEOUT = 1500

const ready = Promise.race([
  preloadDictionary(locale),
  new Promise((resolve) => setTimeout(resolve, READY_TIMEOUT))
])

ready.finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
})
