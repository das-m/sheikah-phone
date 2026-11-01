import { onUnmounted } from 'vue'

const claims: { color: string }[] = []

function apply() {
  const style = document.documentElement.style
  const latest = claims[claims.length - 1]
  if (latest) style.setProperty('--frame-glow', latest.color)
  else style.removeProperty('--frame-glow')
}

/**
 * Colors the glow of the phone frame (`PhoneFrame`) for as long as the calling app is mounted, e.g. `'var(--color-purple)'`.
 * The frame sits outside the router view, so the color goes through a custom property on <html>; the frame fades to it.
 * The newest claim wins, and a leaving app (it stays mounted through its fade-out) gives up only its own claim, so it
 * cannot wipe the color of the app that came after it.
 */
export function useFrameGlow(color: string) {
  const claim = { color }
  claims.push(claim)
  apply()

  onUnmounted(() => {
    claims.splice(claims.indexOf(claim), 1)
    apply()
  })
}
