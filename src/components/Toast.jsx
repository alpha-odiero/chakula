import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastContext = createContext({
  notify: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {}
})

export function useToast() {
  return useContext(ToastContext)
}

const DEFAULT_DURATION = 4200

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const current = timers.current
    return () => {
      current.forEach((timer) => clearTimeout(timer))
      current.clear()
    }
  }, [])

  const notify = useCallback((message, options = {}) => {
    const text = typeof message === 'string' ? message.trim() : ''
    if (!text) return
    const { variant = 'info', duration = DEFAULT_DURATION } = options
    const id = `${variant}::${text}`

    setToasts((prev) => {
      if (prev.some((toast) => toast.id === id)) return prev
      if (prev.length >= 3) return prev.slice(-2).concat({ id, text, variant })
      return [...prev, { id, text, variant }]
    })

    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    )
  }, [])

  const api = useMemo(
    () => ({
      notify,
      success: (message, options) => notify(message, { ...options, variant: 'success' }),
      error: (message, options) => notify(message, { ...options, variant: 'error' }),
      info: (message, options) => notify(message, { ...options, variant: 'info' }),
      dismiss
    }),
    [notify, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <p key={toast.id} className={`toast toast--${toast.variant}`}>
            {toast.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
