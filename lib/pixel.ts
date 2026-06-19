declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: unknown
  }
}

const PIXEL_ID = "924765982765131"

export function pageview() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView")
  }
}

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params)
  }
}

export function trackCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", event, params)
  }
}

export { PIXEL_ID }
