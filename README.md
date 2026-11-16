# Orbit Weaver

A gravity-slingshot arcade game. You fly one comet through six systems. Every sun bends your path and
every gate has to be threaded in order. There is no engine and no build step: twelve small ES modules,
plain canvas 2D, and WebAudio for the sound.

Built as an entry for [make.fun's best-game-01 bounty](https://make.fun/bounty/best-game-01).

## Play

```
node serve.ts       # http://localhost:8080
```

Or serve `game/` with any static file server and open `game/index.html`. The game runs offline: it
loads nothing over the network and vendors no library.

| key | action |
| --- | --- |
| `W` / `↑` | thrust |
| `S` / `↓` | retro thrust |
| `A` / `D` | lateral trim |
| `Shift` | brake |
| `Space` | pulse (a one-shot kick along your heading, costs fuel) |
| `P` | pause |
| `R` | restart |

## The loop

Each system gives you gates to thread and one sun (or four) to survive. Clear every gate and the dock
opens; dock to finish the system. Fall inside a sun's horizon ring and you lose the system and retry it.
Six systems, each pulling harder than the last, then a final tally with a par-time bonus.

The trick is that gravity is the only real engine you have. Thrust is weak and fuel is finite, so the
fast line through a system is a slingshot: come in wide, let the sun turn you, and spend the pulse on
the exit vector.

## How it is built

One file, one job:

| file | what it owns |
| --- | --- |
| `game/main.js` | the session: state, the fixed-step loop, the screenshot scenes |
| `game/config.js` | every tuning number and all six systems |
| `game/ship.js` | the comet's flight model and gravity integration |
| `game/scenery.js` | the star field and the wells |
| `game/gates.js` | gates, crossings and the dock |
| `game/comet.js` | the comet's trail, hull and engine flare |
| `game/effects.js` | particles and screen shake |
| `game/audio.js` | synthesised sound, no files |
| `game/controls.js` | the keyboard state |
| `game/hud.js` | the HUD and the title/result overlays |
| `game/render.js` | one frame, drawn from state |
| `game/math.js` | vector maths and a seeded generator |
| `main.ts` | hands `game/` and `screenshots/` to `/output` and writes `dossier.json` |

The simulation is a fixed 1/120 s step and the renderer never mutates state, so a frame is a pure
function of the state. That is what makes the screenshots reproducible: every shot is
`?shot=<scene>&seed=<n>`, drawn by the game's own code at a fixed simulated time, never cropped, edited
or composited.

## Screenshots

`screenshots/` holds four real renders:

1. `1-start.jpg` — the title, over the first system
2. `2-play.jpg` — mid-run in Twin Lanterns, HUD live
3. `3-end.jpg` — a lost run: two systems held, the third failed
4. `4-win.jpg` — the victory tally with the par bonus

Regenerate them with `python3 capture.py http://127.0.0.1:8080` (async Playwright, headless Chromium).

## Licence

MIT. See `LICENSE`.
