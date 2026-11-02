import type { Router } from 'vue-router'

import type { PreloadGroup } from './boot'

// Best-effort warm-up while the boot screen plays: whatever fails here is simply loaded later, on use.
// The service worker precaches the build anyway, so on repeat launches this is mostly cache hits.

export interface PreloadTask {
  group: PreloadGroup
  run: () => Promise<unknown>
}

// Vite reads the glob options statically, so they are spelled out in each call.

// Only what the home screen and the apps show. Yiga-mode art (`-red`) and unused sources are left out.
const imageUrls = Object.values(
  import.meta.glob<string>(
    [
      '/src/assets/images/{ui,logo,frame,map,weather}/**/*.{png,jpg,svg}',
      '/src/assets/images/background/background.png',
      '!/src/assets/images/**/*-red.*',
      '!/src/assets/images/**/Weather *',
      '!/src/assets/images/**/Unbenannt*'
    ],
    { eager: true, query: '?url', import: 'default' }
  )
).filter((url) => !url.startsWith('data:'))

// Like the images, without the Yiga variants (`*-reversed`): `uiSounds` loads those on first use.
const audioUrls = Object.values(
  import.meta.glob<string>(['/src/assets/audio/*.ogg', '!/src/assets/audio/*-reversed.ogg'], {
    eager: true,
    query: '?url',
    import: 'default'
  })
)

// What the first seconds of the boot show (the logo and the frame): decoded before they appear, so they come
// in whole instead of flickering in piece by piece.
const criticalUrls = Object.values(
  import.meta.glob<string>(
    ['/src/assets/images/{logo,frame}/**/*.{png,svg}', '!/src/assets/images/**/*-red.*'],
    {
      eager: true,
      query: '?url',
      import: 'default'
    }
  )
).filter((url) => !url.startsWith('data:'))

const fontSpecs = [
  '1em Roboto',
  '500 1em Roboto',
  'italic 1em Roboto',
  '1em HyliaSerif',
  '1em Sheikah'
]

function loadImage(url: string): Promise<unknown> {
  const image = new Image()
  image.src = url
  return image.decode()
}

// The lazy route chunks, which hold the apps and with them MapLibre.
function loadRouteChunks(router: Router): Promise<unknown>[] {
  return router.getRoutes().flatMap((route) => {
    const component = route.components?.default
    return typeof component === 'function' ? [(component as () => Promise<unknown>)()] : []
  })
}

export function createPreloadTasks(router: Router): PreloadTask[] {
  return [
    ...fontSpecs.map((font) => ({ group: 'fonts' as const, run: () => document.fonts.load(font) })),
    ...imageUrls.map((url) => ({ group: 'images' as const, run: () => loadImage(url) })),
    ...audioUrls.map((url) => ({
      group: 'audio' as const,
      run: () => fetch(url).then((response) => response.blob())
    })),
    ...loadRouteChunks(router).map((chunk) => ({ group: 'modules' as const, run: () => chunk }))
  ]
}

/** Resolves when the art of the logo and the frame is decoded (a failed image counts as settled). */
export function preloadCritical(): Promise<unknown> {
  return Promise.all(criticalUrls.map((url) => loadImage(url).catch(() => {})))
}

/** Runs every task, and reports each one when it settles (a failed one counts as settled). */
export function runPreload(tasks: PreloadTask[], onSettled: (group: PreloadGroup) => void) {
  return Promise.all(
    tasks.map((task) =>
      task
        .run()
        .catch(() => {})
        .then(() => onSettled(task.group))
    )
  )
}
