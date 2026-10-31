# Secrets

Spoilers: the hidden mechanics of the hunt. Do not share with players.

## Yiga mode

Red UI with its own app set (`src/game/apps.ts`, mode `yiga`). Meant for a single riddle.

- **Enter:** stand inside the Yiga zone, hold the phone head-down (flipped) and shake it.
- **Leave:** shake again, anywhere.
- **Zone:** `yigaZone` in `src/game/zones.ts` (placeholder: Schloss, 40 m radius). Set the real spot before the hunt.
- **Not persisted:** a reload returns to normal mode.

## Fallback (organizers only)

Tap the version number on the home screen 7 times within 2 s each: toggles Yiga mode directly, with no zone, flip or shake. Use it for bad GPS or for testing in a browser.

## Not wired yet

`src/assets/audio/secret.mp3` is untracked and not used by the app.
