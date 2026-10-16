import AppHome from './home/AppHome'
import SiteHome from './home/SiteHome'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { isStandalone } from '../utils/platform'

function Home() {
  const { isInstalled } = useInstallPrompt()
  const inAppMode = isInstalled || isStandalone()
  return inAppMode ? <AppHome /> : <SiteHome />
}

export default Home
