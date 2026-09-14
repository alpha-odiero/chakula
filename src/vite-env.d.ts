/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegisteredSW?: (swUrl: string, registration?: ServiceWorkerRegistration) => void
    onRegisterError?: (error: unknown) => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

interface Navigator {
  standalone?: boolean
}

interface ImportMetaEnv {
  readonly VITE_MEALDB_BASE_URL: string
  readonly VITE_MEALDB_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 