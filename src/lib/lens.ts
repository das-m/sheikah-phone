/**
 * Which way the scanner's lens is shifted, for a phone held in landscape. The camera sits at the phone's top edge, which
 * is the left end at `screen.orientation.angle` 90 and the right end at 270. An object held in front of the phone's
 * middle then shows up away from that end, so the lens moves the same way: the result is `amount` signed (positive =
 * right) for the two landscape angles and 0 otherwise.
 */
export function lensOffset(angleDeg: number, amount: number): number {
  const angle = ((Math.round(angleDeg) % 360) + 360) % 360
  if (angle === 90) return amount
  if (angle === 270) return -amount
  return 0
}
