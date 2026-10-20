import { useEffect, useRef } from 'react'
import Icon from './Icon'

// Full-screen view of the original recipe image so the compact card on the
// details page never hides any of the picture.
function ImageViewer({ src, alt, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    if (dialogRef.current) dialogRef.current.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus()
    }
  }, [onClose])

  if (!src) return null

  return (
    <div className="image-viewer" role="presentation" onMouseDown={onClose}>
      <div
        className="image-viewer-inner"
        role="dialog"
        aria-modal="true"
        aria-label={`${alt} — full image`}
        tabIndex="-1"
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="image-viewer-close" aria-label="Close image" onClick={onClose}>
          <Icon name="close" size={20} />
        </button>
        <img className="image-viewer-img" src={src} alt={alt} />
      </div>
    </div>
  )
}

export default ImageViewer
