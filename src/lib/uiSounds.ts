import { playSound } from './audio'
import type { AppMode, LoaderVariant } from '@/game/apps'

import soundOpen from '@/assets/audio/open.ogg'
import soundClose from '@/assets/audio/close.ogg'
import soundOpenReversed from '@/assets/audio/open-reversed.ogg'
import soundCloseReversed from '@/assets/audio/close-reversed.ogg'
import soundLensOn from '@/assets/audio/lens-on.ogg'
import soundLensOff from '@/assets/audio/lens-off.ogg'

const sources: Record<'open' | 'close', Record<AppMode, string>> = {
  open: { sheikah: soundOpen, yiga: soundOpenReversed },
  close: { sheikah: soundClose, yiga: soundCloseReversed }
}

// An app with its own loader look (`game/apps.ts`) has its own sounds too (Sheikah mode only).
const variantSources: Record<Exclude<LoaderVariant, ''>, Record<'open' | 'close', string>> = {
  lens: { open: soundLensOn, close: soundLensOff }
}

// Created on first use, so the Yiga sounds are not fetched for players who never see that mode.
const cache = new Map<string, HTMLAudioElement>()
function sound(kind: 'open' | 'close', mode: AppMode, variant: LoaderVariant) {
  const src =
    (variant && mode === 'sheikah' && variantSources[variant][kind]) || sources[kind][mode]
  let audio = cache.get(src)
  if (!audio) cache.set(src, (audio = new Audio(src)))
  return audio
}

/** Open / close sounds of the shell; Yiga mode plays them reversed, an app's own `variant` plays its own. */
export const playOpen = (mode: AppMode, variant: LoaderVariant = '') =>
  playSound(sound('open', mode, variant))
export const playClose = (mode: AppMode, variant: LoaderVariant = '') =>
  playSound(sound('close', mode, variant))
