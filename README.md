# SheikahPhone

A reimagined Sheikah Slate from *Breath of the Wild*, built as a PWA for a Zelda-themed scavenger hunt in Ludwigsburg. Players receive it through an NFC tag and install it on their phone (Android Chrome).

Apps: Map, Sensor (beeps faster as you near the target), Camera, Media, Reader (NFC, not implemented yet).

## Setup

```sh
npm install
cp .env.example .env.local   # add a Google Maps API key, restricted to your domain
npm run dev
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build |
| `npm run check` | Type-check, lint and unit tests |
| `npm run format` | Format `src/` with Prettier |

See `CLAUDE.md` for architecture and conventions.
