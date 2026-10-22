# SheikahPhone

Vue 3 + Vite + TypeScript PWA: a Sheikah Slate for a Zelda-themed scavenger hunt in Ludwigsburg. UI text is German, code and comments are English.
Target: Android Chrome, installed as a PWA, used outdoors and often offline. iOS is out of scope.

## Commands
- `npm run dev` / `npm run build` (type-check + build)
- `npm run check`: type-check, lint and unit tests. Run it before finishing any change.
- `npm run format`: Prettier

## Layout
- `src/views/apps/*App.vue`: the five apps (map, sensor, camera, media, reader). Thin: UI only.
- `src/composables/`: browser-API wrappers (`useGeolocation`, `useHeading`, `useBeeper`, `useCamera`).
- `src/lib/`: pure functions with unit tests (`geo.ts`). Put new maths here, test it.
- `src/game/`: game content as data (POIs, sensor target and tuning). Riddles, keys and targets go here, never hardcoded in components.
- `src/map/`: MapLibre style (BotW look) on OpenFreeMap vector tiles. Public service without guarantee: self-host as PMTiles before the real hunt.

## Conventions
- Styles: Stylus, scoped, BEM-like `Block-element--modifier`. Colors via CSS vars from `src/assets/styl/variables.styl`.
- Every listener, timer, stream and AudioContext must be released in `onUnmounted` (the composables do this).
- Every GPS or NFC trigger needs a manual fallback, because GPS is unreliable outdoors.
- Audio needs a user gesture before it can play. Use `playSound()` for effects (swallows the rejection) and `useBeeper().start()` from a click handler.
- Sounds are `.ogg`.

## Gotchas
- The map needs no API key. Never commit keys.
- MapLibre markers own their element's `transform`: rotate a child element, never the marker element. Its worker is wired via `setWorkerUrl` in `MapApp.vue` (without it the map is blank in dev and production).
- Do not edit `dist/`. `dev-dist/` and `*:Zone.Identifier` files are ignored.
- Heading uses `deviceorientationabsolute` (Android only). Test location, heading and camera on a real phone, not only on desktop.
- `src/components/experiments/*.vue_` are old, uncompiled experiments (including an older Web NFC reader). Reference only.
