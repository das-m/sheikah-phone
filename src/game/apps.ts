export type AppMode = 'sheikah' | 'yiga'

export interface AppEntry {
  id: string
  route: string
  mode: AppMode
}

/** Apps on the home screen. Each app belongs to exactly one mode. */
export const apps: AppEntry[] = [
  { id: 'map', route: '/map', mode: 'sheikah' },
  { id: 'camera', route: '/camera', mode: 'sheikah' },
  { id: 'media', route: '/media', mode: 'sheikah' },
  { id: 'reader', route: '/reader', mode: 'sheikah' },
  // Placeholder until the real Yiga apps exist.
  { id: 'yiga', route: '/yiga', mode: 'yiga' }
]

/** Routes outside the registry (the home screen) are available in every mode. */
export function isRouteAvailable(path: string, mode: AppMode): boolean {
  const app = apps.find((a) => a.route === path)
  return !app || app.mode === mode
}
