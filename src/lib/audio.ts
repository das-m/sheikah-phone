/** Plays a sound effect; browsers reject play() without a prior user gesture, which is not an error for us. */
export function playSound(audio: HTMLAudioElement): void {
  audio.currentTime = 0
  audio.play().catch(() => {})
}
