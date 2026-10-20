import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import InstallGuide from './InstallGuide'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useToast } from './Toast'
import { isStandalone } from '../utils/platform'

// The one "Get app" call to action. Behaviour:
//  - not installed, browser supports install -> native prompt
//  - prompt dismissed / unsupported          -> platform install guide (never a dead end)
//  - already installed                       -> continue into the installed app experience
function GetAppButton({ className = 'header-cta', onNavigate }) {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()
  const [guideOpen, setGuideOpen] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const installed = isInstalled || isStandalone()

  const handleClick = async () => {
    if (installed) {
      onNavigate?.()
      navigate('/')
      toast.info('Pikawise is already installed — opening the app.')
      return
    }

    if (canInstall) {
      const { outcome } = await promptInstall()
      if (outcome === 'accepted') {
        onNavigate?.()
        toast.success('Thanks for installing Pikawise!')
        return
      }
      // The user dismissed the native prompt: show the manual route instead
      // of silently doing nothing.
      setGuideOpen(true)
      return
    }

    setGuideOpen(true)
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        <Icon name="install" size={17} />
        Get app
      </button>
      {guideOpen && <InstallGuide onClose={() => setGuideOpen(false)} />}
    </>
  )
}

export default GetAppButton
