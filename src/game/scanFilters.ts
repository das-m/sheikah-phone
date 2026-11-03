/**
 * CSS `filter` of the scanner's camera image: a purple Sheikah tint. The scanner reads the raw frames, so this never
 * affects detection. The hue is by eye (`sepia` starts at ~40deg): tune it on a real phone.
 */
export const scanFilter =
  'grayscale(1) sepia(1) hue-rotate(225deg) saturate(3.5) contrast(1.2) brightness(0.55)'

/**
 * The lens diameter as a multiple of the free height between the frame strips. Above 1, the lens runs under the strips,
 * which hide its top and bottom (the round view is bigger, the screen shows its middle).
 */
export const LENS_SCALE = 1.6

/**
 * How far the image is moved away from the camera's end of the phone, as a fraction of the free height (the lens at scale 1; see
 * `lib/lens.ts`): the camera is not in the middle of the phone, so an object held in front of the phone's middle is
 * not in the middle of the image. A first guess: tune it on a real phone (0 = centered on the screen).
 */
export const LENS_SHIFT = 0.13
