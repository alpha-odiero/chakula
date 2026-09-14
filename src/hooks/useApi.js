import { useCallback, useEffect, useRef, useState } from 'react'

const initialState = { data: null, loading: true, error: null }

export function useApi(loader, deps = []) {
  const [state, setState] = useState(initialState)
  const loaderRef = useRef(loader)
  const mountedRef = useRef(true)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(
    (params) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const promise = loaderRef.current(params)
      if (!promise || typeof promise.then !== 'function') {
        if (mountedRef.current) setState({ data: null, loading: false, error: null })
        return
      }
      promise
        .then((data) => {
          if (mountedRef.current) setState({ data, loading: false, error: null })
        })
        .catch((error) => {
          if (mountedRef.current) setState({ data: null, loading: false, error })
        })
    },
    []
  )

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, refetch: run }
}

export function getErrorMessage(error) {
  if (!error) return 'Something went wrong.'
  if (error && typeof error === 'object' && 'message' in error) return error.message
  return 'Something went wrong.'
}

export function extractMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (error.message) return error.message
  return fallback
}