import { computed, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level state: Chrome fires `beforeinstallprompt` once, early, possibly before any component exists.
const installEvent = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(window.matchMedia('(display-mode: standalone)').matches)
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

/** Install state of the PWA. The gate is shown in production browser tabs until installed or dismissed. */
export function useInstall() {
  return {
    canInstall: computed(() => installEvent.value !== null),
    isInstalled,
    wasDeclined,
    isDismissed,
    shouldShowGate: computed(
      () => import.meta.env.PROD && !isInstalled.value && !isDismissed.value
    ),
    install,
    dismiss: () => (isDismissed.value = true)
  }
}
