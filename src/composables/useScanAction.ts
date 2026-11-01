import { ref } from 'vue'

import type { ScanTarget } from '@/game/scanTargets'

export interface ScanModalContent {
  title: string
  text: string
}

/** Runs what a scanned target asks for. The one place a new action type (the map's sensor mode, next) plugs in. */
export function useScanAction() {
  const modal = ref<ScanModalContent | null>(null)

  function run(target: ScanTarget) {
    const { action } = target
    switch (action.type) {
      case 'modal':
        modal.value = { title: action.title, text: action.text }
        break
    }
  }

  function close() {
    modal.value = null
  }

  return { modal, run, close }
}
