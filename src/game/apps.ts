export type AppMode = 'sheikah' | 'yiga'

/** Look of the loader that plays when an app opens or closes ('' = the default blue one). */
export type LoaderVariant = '' | 'lens'

export interface AppEntry {
  id: string
  route: string
  mode: AppMode
  loader?: Exclude<LoaderVariant, ''>
}

/** Apps on the home screen. Each app belongs to exactly one mode. */
export const apps: AppEntry[] = [
  { id: 'map', route: '/map', mode: 'sheikah' },
  { id: 'camera', route: '/camera', mode: 'sheikah' },
  { id: 'scanner', route: '/scanner', mode: 'sheikah', loader: 'lens' },
  { id: 'media', route: '/media', mode: 'sheikah' },
  // Placeholder until the real Yiga apps exist.
  { id: 'yiga', route: '/yiga', mode: 'yiga' }
]

/** The loader look of an app's route; routes outside the registry get the default. */
export function loaderVariantFor(path: string): LoaderVariant {
  return apps.find((a) => a.route === path)?.loader ?? ''
}

/** Routes outside the registry (the home screen) are available in every mode. */
export function isRouteAvailable(path: string, mode: AppMode): boolean {
  const app = apps.find((a) => a.route === path)
  return !app || app.mode === mode
}
