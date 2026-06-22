declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: unknown
  }
}

const PIXEL_ID = "1739556637199422"

function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("preview") === "1"
}

export function pageview() {
  if (isPreviewMode()) return
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

export function track(event: string, params?: Record<string, unknown>) {
  if (isPreviewMode()) return
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params)
  }
}

export function trackCustom(event: string, params?: Record<string, unknown>) {
  if (isPreviewMode()) return
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, params)
  }
}

export { PIXEL_ID }
