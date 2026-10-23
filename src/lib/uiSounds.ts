import { playSound } from './audio'
import type { AppMode } from '@/game/apps'

import soundOpen from '@/assets/audio/open.ogg'
import soundClose from '@/assets/audio/close.ogg'
import soundOpenReversed from '@/assets/audio/open-reversed.ogg'
import soundCloseReversed from '@/assets/audio/close-reversed.ogg'

const open: Record<AppMode, HTMLAudioElement> = {
  sheikah: new Audio(soundOpen),
  yiga: new Audio(soundOpenReversed)
}
const close: Record<AppMode, HTMLAudioElement> = {
  sheikah: new Audio(soundClose),
  yiga: new Audio(soundCloseReversed)
}

/** Open / close sounds of the shell; Yiga mode plays them reversed. */
export const playOpen = (mode: AppMode) => playSound(open[mode])
export const playClose = (mode: AppMode) => playSound(close[mode])
