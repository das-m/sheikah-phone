# SheikahPhone

Vue 3 + Vite + TypeScript PWA: a Sheikah Slate for a Zelda-themed scavenger hunt in Ludwigsburg. UI text is German, code and comments are English.
Target: Android Chrome, installed as a PWA, used outdoors and often offline. iOS is out of scope.

## Commands
- `npm run dev` / `npm run build` (type-check + build)
- `npm run check`: type-check, lint and unit tests. Run it before finishing any change.
- `npm run format`: Prettier

## Layout
- `src/views/apps/*App.vue`: the five apps (map, sensor, camera, media, reader). Thin: UI only.
- `src/composables/`: browser-API wrappers (`useGeolocation`, `useHeading`, `useBeeper`, `useCamera`, `useNfc`, `useInstall`, `useMotion`). `useYigaMode` holds the app mode, `useYigaTrigger` (mounted in `App.vue`) wires zone + flip + shake to it.
- `src/lib/`: pure functions with unit tests (`geo.ts`, `zone.ts`, `gesture.ts`). Put new maths here, test it.
- `src/game/`: game content as data (POIs, sensor target and tuning, Yiga zone, app registry per mode). Riddles, keys and targets go here, never hardcoded in components.
- `src/map/`: MapLibre style (BotW look) on OpenFreeMap vector tiles. Public service without guarantee: self-host as PMTiles before the real hunt.

- `src/components/PhoneFrame.vue`: the ornamental frame (4 corners + tiling top/bottom strip), two layers: `frame/stone/*` (gold and black, as is) and `frame/glow/*` (white, alpha = glow strength) above it, colored by `--color-primary` through a CSS mask, so blue/red needs no extra files. Geometry lives in `src/assets/scss/_frame.scss`. Both sets share names and pixel sizes; `glow/back.png` (the old back-button circle) is unused. The files are currently rough placeholders auto-split from `background/original.png` (blue = glow); if you replace them, keep the sizes in `_frame.scss` in sync (CSS multiplies intrinsic size by `--u`) and `$ext` if the format changes.
- `src/components/BackButton.vue`: the blue arrow (`ui/arrow-left.png`) on the left edge. Every app renders its own (there is no global one), so it enters with that app's UI and its animation (`MapApp`: inside the `App-ui` layer; the others: inside the faded `App`). It goes back in the history (so device back does not return to the app just left) and falls back to home when there is no in-app history. Tinted red in Yiga mode via `yiga.scss`.
- `src/components/BootScreen.vue`: the cold-start screen (mounted by `App.vue`, which mounts the home screen as it dissolves): the loader's logo, a segmented bar and `ScanlineOverlay`. The bar reports real preloading (`lib/preload.ts`: fonts, images, sounds, the lazy route chunks incl. MapLibre), paced by `lib/boot.ts` (pure, tested): at least 6 s, at most 10 s, a tap skips after 2 s, shorter with `prefers-reduced-motion`. The preload globs are static (Vite requires inline options), so new image folders go into the glob list in `preload.ts`. Later transitions keep the short `SheikahLoader`.
- `src/components/ScanlineOverlay.vue`: reusable old-tube look (scanlines, dark edges, rolling band in the mode color, flicker). Drop it into any positioned parent and set its `z-index` there, e.g. for the Yiga transition.
- `src/components/widgets/`: `ClockWidget` and `WeatherWidget`, each with a runic caption in the `Sheikah` font (`_widget.scss` mixin `label`). They carry no layout of their own: the screen sets `--widget-clock-size` and `--widget-align` (flex alignment) on the widget or its container, as `HomeView` (portrait: clock top, weather bottom; landscape: upper corners) and `MapApp` (stacked top right) do.

## Conventions
- Decorative art scales with one unit, `--u` (`variables.scss`: one source pixel of the 1920x1080 frame art, width-bound on portrait, clamped). Size art as `calc(N * var(--u))`, inset screens from the frame with `--frame-top` / `--frame-bottom`, and keep content beside the corner art with `--frame-corner-tl` / `-tr` / `-br` (corner widths), never with pixel literals.
- Full-screen surfaces (page, install gate, lightbox) get the swirl tile through `@include surface.surface` (`_surface.scss`), which also handles the Yiga tile.
- Styles: SCSS, scoped, BEM-like `Block-element--modifier`. Colors via CSS vars from `src/assets/scss/variables.scss`.
- Every listener, timer, stream and AudioContext must be released in `onUnmounted` (the composables do this).
- Every GPS or NFC trigger needs a manual fallback, because GPS is unreliable outdoors.
- Audio needs a user gesture before it can play. Use `playSound()` for effects (swallows the rejection) and `useBeeper().start()` from a click handler.
- Sounds are `.ogg`.

## Gotchas
- Yiga mode (red UI, own app set): flip phone head-down + shake inside `yigaZone` (`src/game/zones.ts`, placeholder position), shake again to reset. Not persisted. Fallback for bad GPS, also the way to test in a browser: tap the version on the home screen 7 times to toggle the mode directly (no zone, flip or shake). Colors switch via `:root[data-mode='yiga']` in `variables.scss`; baked-in blue images are overridden in `src/assets/scss/yiga.scss` (`*-red` files are script-made placeholders). New apps go in `src/game/apps.ts` with a mode.
- Vibration and sounds need a prior tap, like all audio.
- Web NFC (Reader) and the beeper both need a tap first: the browser asks permission and blocks audio until then.
- `InstallGate` only shows in production builds in a browser tab. Chrome fires `beforeinstallprompt` once, so `useInstall` captures it at module load.
- Visual checks: build, `npx vite preview`, screenshot with headless Chromium. Headless has no Web NFC, so the Reader shows its unsupported state there.
- The map needs no API key. Never commit keys.
- MapLibre markers own their element's `transform`: rotate a child element, never the marker element (the user marker rotates one `-heading` child holding the view cone `map/direction.png`, whose tip and lean are constants in `MapApp.vue`, and the arrow). Its worker is wired via `setWorkerUrl` in `MapApp.vue` (without it the map is blank in dev and production).
- Do not edit `dist/`. `dev-dist/` and `*:Zone.Identifier` files are ignored.
- Heading uses `deviceorientationabsolute` (Android only). Test location, heading and camera on a real phone, not only on desktop.
- `src/components/experiments/*.vue_` are old, uncompiled experiments (including an older Web NFC reader). Reference only.
