/**
 * Which way the scanner's image is shifted under its (centered) lens, for a phone held in landscape. The camera sits at the phone's top edge, which
 * is the left end at `screen.orientation.angle` 90 and the right end at 270. An object held in front of the phone's
 * middle then shows up away from that end, so the image moves that way: the result is `amount` signed (positive =
 * toward the right end) for the two landscape angles and 0 otherwise.
 */
export function lensOffset(angleDeg: number, amount: number): number {
  const angle = ((Math.round(angleDeg) % 360) + 360) % 360
  if (angle === 90) return amount
  if (angle === 270) return -amount
  return 0
}
