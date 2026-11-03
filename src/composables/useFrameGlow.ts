/**
 * Colors the glow of the phone frame (`PhoneFrame`) and of the loader's logo, e.g. `'var(--color-purple)'`; `null` goes
 * back to the mode color. The frame sits outside the router view, so the color goes through a custom property on <html>;
 * both fade to it (`--color-fade`). `App.vue` calls this, at the point of a transition where the color should change
 * (the lens: in the middle of its loader), from the `glow` of the app (`game/apps.ts`).
 */
export function setFrameGlow(color: string | null) {
  const style = document.documentElement.style
  if (color) style.setProperty('--frame-glow', color)
  else style.removeProperty('--frame-glow')
}
