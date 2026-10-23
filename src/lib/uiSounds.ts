import { playSound } from './audio'
import type { AppMode } from '@/game/apps'

import soundOpen from '@/assets/audio/open.ogg'
import soundClose from '@/assets/audio/close.ogg'
import soundOpenReversed from '@/assets/audio/open-reversed.ogg'
import soundCloseReversed from '@/assets/audio/close-reversed.ogg'

const sources: Record<'open' | 'close', Record<AppMode, string>> = {
  open: { sheikah: soundOpen, yiga: soundOpenReversed },
  close: { sheikah: soundClose, yiga: soundCloseReversed }
}

// Created on first use, so the Yiga sounds are not fetched for players who never see that mode.
const cache = new Map<string, HTMLAudioElement>()
function sound(kind: 'open' | 'close', mode: AppMode) {
  const src = sources[kind][mode]
  let audio = cache.get(src)
  if (!audio) cache.set(src, (audio = new Audio(src)))
  return audio
}

/** Open / close sounds of the shell; Yiga mode plays them reversed. */
export const playOpen = (mode: AppMode) => playSound(sound('open', mode))
export const playClose = (mode: AppMode) => playSound(sound('close', mode))
