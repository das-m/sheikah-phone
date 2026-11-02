import { onUnmounted, watch } from 'vue'
import { useYigaMode } from './useYigaMode'
import soundLoop from '@/assets/audio/yiga-mode-loop.ogg'

/** Plays the Yiga background loop for as long as the app is in Yiga mode. */
export function useYigaLoop() {
  const { mode } = useYigaMode()
  const audio = new Audio(soundLoop)
  audio.loop = true

  function sync() {
    if (mode.value === 'yiga') {
      // Rejected without a prior tap, which is not an error for us.
      audio.play().catch(() => {})
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }

  watch(mode, sync)
  onUnmounted(() => {
    audio.pause()
    audio.src = ''
  })
}
