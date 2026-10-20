import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import WebHeader from './components/WebHeader'
import AppHeader from './components/AppHeader'
import BottomNavigation from './components/BottomNavigation'
import Footer from './components/Footer'
import OfflineBanner from './components/OfflineBanner'
import InstallPrompt from './components/InstallPrompt'
import Onboarding from './components/Onboarding'
import CookieConsent from './components/CookieConsent'
import PreferencesProvider, { usePreferences } from './components/PreferencesProvider'
import PwaProvider from './components/PwaProvider'
import ReminderProvider from './components/ReminderProvider'
import PikawiseLoader from './components/PikawiseLoader'
import ToastProvider, { useToast } from './components/Toast'
import { useNetworkState } from './hooks/useNetworkState'
import { useInstallPrompt } from './hooks/useInstallPrompt'
import { useTheme } from './hooks/useTheme'
import { useScrollToTop } from './hooks/useScrollToTop'
import { isStandalone } from './utils/platform'

const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Categories = lazy(() => import('./pages/Categories'))
const Category = lazy(() => import('./pages/Category'))
const MealDetails = lazy(() => import('./pages/MealDetails'))
const RandomMeal = lazy(() => import('./pages/RandomMeal'))
const BalancedDiet = lazy(() => import('./pages/BalancedDiet'))
const MealPlans = lazy(() => import('./pages/MealPlans'))
const ShoppingList = lazy(() => import('./pages/ShoppingListPage'))
const Settings = lazy(() => import('./pages/Settings'))
const Reminder = lazy(() => import('./pages/Reminder'))
const Developer = lazy(() => import('./pages/Developer'))
const Terms = lazy(() => import('./pages/Terms'))
const Favorites = lazy(() => import('./pages/Favorites'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageFallback() {
  return <PikawiseLoader variant="section" label="Loading page" delay={150} />
}

function AppShell() {
  const isOnline = useNetworkState()
  const { isInstalled } = useInstallPrompt()
  const { preferences } = usePreferences()
  const toast = useToast()
  useTheme()
  useScrollToTop()

  const inStandaloneMode = isStandalone()

  useEffect(() => {
    // Remove the pre-React splash once the first page has actually rendered
    // (or after a hard timeout), so the loader never hands over to a blank
    // screen and never shows a second branded loading screen behind it.
    const splash = document.getElementById('app-splash')
    if (!splash) return undefined
    const MIN_VISIBLE = 650
    const MAX_VISIBLE = 5000
    const started = performance.now()
    let frame = 0
    let removeTimer
    let hidden = false
    const hide = () => {
      if (hidden) return
      hidden = true
      splash.classList.add('pw-splash--hidden')
      removeTimer = setTimeout(() => {
        if (splash.isConnected) splash.remove()
      }, 500)
    }
    const tick = () => {
      const elapsed = performance.now() - started
      const pageReady = document.querySelector('main') !== null
      if ((pageReady && elapsed >= MIN_VISIBLE) || elapsed >= MAX_VISIBLE) {
        hide()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(removeTimer)
    }
  }, [])

  useEffect(() => {
    const handleInstalled = () => {
      toast.success('Thanks for installing Pikawise!')
    }
    window.addEventListener('appinstalled', handleInstalled)
    return () => window.removeEventListener('appinstalled', handleInstalled)
  }, [toast])

  useEffect(() => {
    const root = document.documentElement
    if (preferences.reduceMotion) root.classList.add('reduce-motion')
    else root.classList.remove('reduce-motion')
  }, [preferences.reduceMotion])

  useEffect(() => {
    const root = document.documentElement
    const installed = isInstalled || inStandaloneMode
    root.classList.toggle('installed-mode', installed)
    return () => root.classList.remove('installed-mode')
  }, [isInstalled, inStandaloneMode])

  const showAppUI = isInstalled || inStandaloneMode
  const onboardingOpen = preferences.onboarded === false

  return (
    <PwaProvider>
      <div className={`app-shell${showAppUI ? ' app-shell--app' : ''}`}>
        {showAppUI ? <AppHeader /> : <WebHeader />}
        {!isOnline && <OfflineBanner />}
        <div className={`app-body${showAppUI ? ' app-body--app' : ''}`}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:category" element={<Category />} />
              <Route path="/meal/:id" element={<MealDetails />} />
              <Route path="/random" element={<RandomMeal />} />
              <Route path="/balanced-diet" element={<BalancedDiet />} />
              <Route path="/meal-plans" element={<MealPlans />} />
              <Route path="/shopping-list" element={<ShoppingList />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reminder" element={<Reminder />} />
              <Route path="/about" element={<Navigate to="/terms#about" replace />} />
              <Route path="/privacy" element={<PrivacyRedirect />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        {!showAppUI && <Footer />}
        {showAppUI && <BottomNavigation />}
        {!onboardingOpen && <InstallPrompt />}
        <CookieConsent />
        {onboardingOpen && <Onboarding />}
      </div>
    </PwaProvider>
  )
}

// /privacy moved into the consolidated /terms page; keep the old anchor working.
function PrivacyRedirect() {
  const location = useLocation()
  const hash = location.hash === '#cookies' ? '#cookies' : '#privacy'
  return <Navigate to={`/terms${hash}`} replace />
}

function App() {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <ReminderProvider>
          <AppShell />
        </ReminderProvider>
      </ToastProvider>
    </PreferencesProvider>
  )
}

export default App
