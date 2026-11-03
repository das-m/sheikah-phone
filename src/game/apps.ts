export type AppMode = 'sheikah' | 'yiga'

/** Look of the loader that plays when an app opens or closes ('' = the default blue one). */
export type LoaderVariant = '' | 'lens'

export interface AppEntry {
  id: string
  route: string
  mode: AppMode
  loader?: Exclude<LoaderVariant, ''>
  /** Color of the phone frame's glow and the logo while the app is open (a CSS color); default: the mode color. */
  glow?: string
}

/** Apps on the home screen. Each app belongs to exactly one mode. */
export const apps: AppEntry[] = [
  { id: 'map', route: '/map', mode: 'sheikah' },
  { id: 'camera', route: '/camera', mode: 'sheikah' },
  { id: 'media', route: '/media', mode: 'sheikah' },
  {
    id: 'scanner',
    route: '/scanner',
    mode: 'sheikah',
    loader: 'lens',
    glow: 'var(--color-purple)'
  },
  // Placeholder until the real Yiga apps exist.
  { id: 'yiga', route: '/yiga', mode: 'yiga' }
]

/** The loader look of an app's route; routes outside the registry get the default. */
export function loaderVariantFor(path: string): LoaderVariant {
  return apps.find((a) => a.route === path)?.loader ?? ''
}

/** The frame glow color of an app's route, or null for the mode color. */
export function frameGlowFor(path: string): string | null {
  return apps.find((a) => a.route === path)?.glow ?? null
}

/** Routes outside the registry (the home screen) are available in every mode. */
export function isRouteAvailable(path: string, mode: AppMode): boolean {
  const app = apps.find((a) => a.route === path)
  return !app || app.mode === mode
}
