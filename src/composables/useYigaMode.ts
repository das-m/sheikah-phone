import { ref, watch } from 'vue'
import { playOpen } from '@/lib/uiSounds'
import type { AppMode } from '@/game/apps'

const THEME_COLORS: Record<AppMode, string> = { sheikah: '#3CD3FC', yiga: '#F15050' }
const ACTIVATE_VIBRATION = [200, 80, 200, 80, 400]
const RESET_VIBRATION = [120]

// Module-level state: the mode is shared by the whole app and not persisted (a reload resets it).
const mode = ref<AppMode>('sheikah')

watch(
  mode,
  (value) => {
    document.documentElement.dataset.mode = value
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[value])
  },
  { immediate: true }
)

function vibrate(pattern: number[]) {
  // Needs a prior tap and is missing on some browsers; neither is an error for us.
  navigator.vibrate?.(pattern)
}

function enter() {
  if (mode.value === 'yiga') return
  mode.value = 'yiga'
  vibrate(ACTIVATE_VIBRATION)
  playOpen('yiga')
}

function reset() {
  if (mode.value === 'sheikah') return
  mode.value = 'sheikah'
  vibrate(RESET_VIBRATION)
  playOpen('sheikah')
}

/** Sheikah (blue) or Yiga (red) mode, switched by flip + shake in the zone (see `useYigaTrigger`). */
export function useYigaMode() {
  return { mode, enter, reset }
}
