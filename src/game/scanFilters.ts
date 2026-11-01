export interface ScanFilter {
  /** CSS `filter` of the camera image. The scanner reads the raw frames, so this never affects detection. */
  css: string
  /** Lays the old-tube scanlines over the image. */
  scanlines: boolean
}

/** The look of the scanner: a purple Sheikah tint. The hue is by eye (`sepia` starts at ~40deg): tune it on a real phone. */
export const scanFilter: ScanFilter = {
  css: 'grayscale(1) sepia(1) hue-rotate(225deg) saturate(3.5) contrast(1.2) brightness(0.55)',
  scanlines: true
}
