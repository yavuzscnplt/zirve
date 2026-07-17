import type { SporApi } from '../shared/types'

declare global {
  interface Window {
    api: SporApi
  }
}

export {}
