import type { MdPreviewApi } from './index'

declare global {
  interface Window {
    mdPreview: MdPreviewApi
  }
}

export {}
