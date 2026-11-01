import { onUnmounted } from 'vue'

/**
 * Colors the glow of the phone frame (`PhoneFrame`) for as long as the calling app is mounted, e.g. `'var(--color-purple)'`.
 * The frame sits outside the router view, so the color goes through a custom property on <html>; the frame fades to it.
 */
export function useFrameGlow(color: string) {
  document.documentElement.style.setProperty('--frame-glow', color)

  onUnmounted(() => {
    document.documentElement.style.removeProperty('--frame-glow')
  })
}
