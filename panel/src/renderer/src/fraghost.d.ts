import type { FraghostAPI } from '../../types'

declare global {
  interface Window {
    fraghost: FraghostAPI
  }
}

export {}
