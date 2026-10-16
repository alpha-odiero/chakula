import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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
const About = lazy(() => import('./pages/About'))
const Developer = lazy(() => import('./pages/Developer'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Favorites = lazy(() => import('./pages/Favorites'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-label="Loading page">
      <div className="page-fallback-spinner" aria-hidden="true" />
    </div>
  )
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
    const splash = document.getElementById('app-splash')
    if (!splash) return undefined
    if (isStandalone()) {
      splash.remove()
      return undefined
    }
    const MIN_VISIBLE = 1200
    const elapsed = performance.now()
    const wait = Math.max(0, MIN_VISIBLE - elapsed)
    let fadeTimer
    const hideTimer = setTimeout(() => {
      splash.classList.add('app-splash--hidden')
      fadeTimer = setTimeout(() => splash.remove(), 600)
    }, wait)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(fadeTimer)
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
              <Route path="/about" element={<About />} />
              <Route path="/developer" element={<Developer />} />
              <Route path="/privacy" element={<Privacy />} />
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

function App() {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </PreferencesProvider>
  )
}

export default App
