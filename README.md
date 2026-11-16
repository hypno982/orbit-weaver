# Emberwing

A gravity-free survival arcade game. You are a moth carrying the last warm thing through five cold
rooms. Every room seals its rift until you have gathered its embers, and your flame — which is both
your life and your only weapon — burns down the whole time.

No engine, no build step, no library: thirteen small ES modules, plain canvas 2D, and sound made
from oscillators so the game ships no audio files at all.

Built as an entry for [make.fun's best-game-01 bounty](https://make.fun/bounty/best-game-01).

## Play

```
node serve.ts       # http://localhost:8080
```

Or serve `game/` with any static file server and open `game/index.html`. The game runs fully
offline: it loads nothing over the network and vendors nothing.

| key | action |
| --- | --- |
| `W` `A` `S` `D` / arrow keys | fly |
| `Space` | pulse — pulls embers in, shoves the cold away, costs flame |
| `P` | pause |
| `M` | mute |

## The loop

1. **Gather every ember.** The rift in each room stays sealed and dim until all seven are in. The
   label above it counts what is left.
2. **Flame is your life.** It drains constantly, faster in deeper rooms. Embers refill it. At zero
   the run ends.
3. **Pulse costs flame.** It is the only way to pull a distant ember in or push a hazard off you, so
   every defensive move spends the resource you need to survive.
4. **Chain for score.** Embers gathered within four seconds of each other build a multiplier up to
   ×8. Taking a hit breaks the chain.
5. **Five rooms, then dawn.** Each room adds hazards and speed. Reaching the fifth rift wins.

## The source

One file per job, named for what it does:

- `game/config.js` — every tuning number, in one place
- `game/math.js` — vectors, clamps, the seeded RNG that makes a run reproducible
- `game/controls.js` — key state in, a steering vector out, edge-triggered presses
- `game/moth.js` — the player: thrust, drag, flame, pulse, damage, wing animation
- `game/ember.js` — the collectibles: drift, pulse attraction, fade-out, collection
- `game/hazard.js` — the cold: chase behaviour, wandering, pulse knockback, contact
- `game/rift.js` — the exit: placement, sealed-to-open transition, entry test
- `game/effects.js` — particles, pulse rings, screen shake
- `game/scenery.js` — the parallax rock, dust and vignette, generated per depth from a seed
- `game/audio.js` — every sound cue, synthesised from oscillators
- `game/hud.js` — the flame meter, ember pips, score, chain, and all four overlay screens
- `game/main.js` — the phase machine: title, depth card, play, pause, defeat, dawn
- `game/boot.js` — finds the canvas and starts the loop

## Screenshots

`screenshots/` holds four real renders of the game running in Chrome at 1280×720, taken by
`capture_emberwing.py`, which drives the game through its own debug handle so each shot is the
game's own code drawing:

1. `1-title.jpg` — the title screen: premise, three rules, the start prompt
2. `2-play.jpg` — mid-run: flame meter, ember pips, chain multiplier, a sealed rift and its count
3. `3-defeat.jpg` — the defeat screen with the final score and the restart prompt
4. `4-dawn.jpg` — the win screen after five rooms, with the restart prompt

## Hand-in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with
the kit's own `buildDossier`, so the bytes match what the gate rebuilds. It runs twice and writes
the same bytes both times.

## License

MIT — see [LICENSE](LICENSE).
