/**
 * CSS `filter` of the scanner's camera image: a purple Sheikah tint. The scanner reads the raw frames, so this never
 * affects detection. The hue is by eye (`sepia` starts at ~40deg): tune it on a real phone.
 */
export const scanFilter =
  'grayscale(1) sepia(1) hue-rotate(225deg) saturate(3.5) contrast(1.2) brightness(0.55)'
