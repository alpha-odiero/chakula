import AppHome from './home/AppHome'
import SiteHome from './home/SiteHome'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useSeo } from '../hooks/useSeo'
import { isStandalone } from '../utils/platform'

function Home() {
  const { isInstalled } = useInstallPrompt()
  const inAppMode = isInstalled || isStandalone()
  useSeo({ path: '/' })
  return inAppMode ? <AppHome /> : <SiteHome />
}

export default Home
