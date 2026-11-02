import { onMounted, onUnmounted } from 'vue'

// `lock` is missing from some versions of the DOM typings.
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }

/**
 * Locks the screen to landscape. The manifest already asks for it, but an app installed with an older manifest
 * keeps that one until Android refreshes it (up to a day, or a reinstall), so the page asks as well. Only
 * works in an installed (standalone / fullscreen) app: in a browser tab the request is rejected and ignored.
 * Retried on the first tap, in case the browser wants a gesture first.
 */
export function useOrientationLock() {
  async function lock() {
    try {
      await (screen.orientation as LockableOrientation).lock?.('landscape')
    } catch {
      // not allowed here (browser tab, desktop): nothing to do
    }
  }

  onMounted(() => {
    void lock()
    window.addEventListener('pointerdown', lock, { once: true })
  })

  onUnmounted(() => window.removeEventListener('pointerdown', lock))
}
