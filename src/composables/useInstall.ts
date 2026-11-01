import { computed, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level state: Chrome fires `beforeinstallprompt` once, early, possibly before any component exists.
const installEvent = ref<BeforeInstallPromptEvent | null>(null)
// The manifest asks for `fullscreen`, which falls back to `standalone`: either way this is the installed app.
const isRunningAsApp = ['fullscreen', 'standalone', 'minimal-ui'].some(
  (mode) => window.matchMedia(`(display-mode: ${mode})`).matches
)
// Installed from this browser tab just now. The tab must not turn into the app: the user opens the installed one.
const isInstalled = ref(false)
const wasDeclined = ref(false)
const isDismissed = ref(false)

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  installEvent.value = event as BeforeInstallPromptEvent
})

window.addEventListener('appinstalled', () => {
  isInstalled.value = true
  installEvent.value = null
})

async function install() {
  const event = installEvent.value
  if (!event) return
  await event.prompt()
  const { outcome } = await event.userChoice
  // An event can only be used once.
  installEvent.value = null
  if (outcome === 'dismissed') wasDeclined.value = true
}

/**
 * Install state of the PWA. The gate is shown in production browser tabs until dismissed. After an install it
 * stays (without a way past it) and asks to open the installed app.
 */
export function useInstall() {
  return {
    canInstall: computed(() => installEvent.value !== null),
    isInstalled,
    wasDeclined,
    isDismissed,
    shouldShowGate: computed(
      () => import.meta.env.PROD && !isRunningAsApp && (isInstalled.value || !isDismissed.value)
    ),
    install,
    dismiss: () => (isDismissed.value = true)
  }
}
