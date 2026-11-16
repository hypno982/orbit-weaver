// EMBERWING — the run's state machine. One file owns the loop, the depth
// transitions and the win/lose conditions; the other modules each own one job.

import { VIEW, EMBER, FLAME, DEPTHS, COLORS, COMBO } from './config.js';
import { makeRng, clamp } from './math.js';
import { attachControls, steering, pressed, clearEdges, anyConfirm } from './controls.js';
import { createMoth, updateMoth, pulseMoth, hurtMoth, drawMoth } from './moth.js';
import { spawnEmber, updateEmbers, collectEmbers, drawEmbers } from './ember.js';
import { spawnHazards, updateHazards, hazardHit, drawHazards } from './hazard.js';
import { createRift, riftPlacement, updateRift, mothInRift, drawRift, drawRiftLabel } from './rift.js';
import { buildScenery, drawScenery, drawVignette } from './scenery.js';
import { clearEffects, burst, ring, shake, shakeOffset, updateEffects, drawEffects } from './effects.js';
import { initAudio, toggleMute, sfxCollect, sfxPulse, sfxHurt, sfxRift, sfxDive, sfxDeath, sfxWin } from './audio.js';
import {
  drawHud, drawTitle, drawDepthCard, drawPause, drawGameOver, drawWin,
} from './hud.js';

const CARD_NOTES = [
  'the cold drifts toward you',
  'two more of them, and faster',
  'the room tightens',
  'they hunt in packs now',
  'last room — keep the flame',
];

export const PHASE = {
  TITLE: 'title',
  CARD: 'card',
  PLAY: 'play',
  PAUSED: 'paused',
  DEAD: 'dead',
  WIN: 'win',
};

export function createGame(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = VIEW.w;
  canvas.height = VIEW.h;
  attachControls(window);

  const state = {
    phase: PHASE.TITLE,
    depth: 1,
    score: 0,
    chain: 0,
    chainTimer: 0,
    bestChain: 0,
    totalEmbers: 0,
    gathered: 0,
    cardT: 0,
    cardNote: '',
    time: 0,
    rng: makeRng(1),
    moth: createMoth(makeRng(7)),
    embers: [],
    hazards: [],
    rift: createRift(VIEW.w - 190, VIEW.h * 0.5),
    scene: buildScenery(1),
    emberClock: 0,
  };

  function startRun() {
    state.depth = 1;
    state.score = 0;
    state.chain = 0;
    state.chainTimer = 0;
    state.bestChain = 0;
    state.totalEmbers = 0;
    state.time = 0;
    clearEffects();
    enterDepth(1);
  }

  function enterDepth(depth) {
    state.depth = depth;
    state.rng = makeRng(depth * 104729 + 5);
    state.moth = createMoth(state.rng);
    state.moth.flame = Math.max(state.moth.flame, FLAME.max * (depth === 1 ? 1 : 0.62));
    state.gathered = 0;
    state.embers = [];
    state.chain = 0;
    state.chainTimer = 0;
    state.emberClock = 0;
    state.scene = buildScenery(depth);

    const spot = riftPlacement(depth);
    state.rift = createRift(spot.x, spot.y);

    state.hazards = spawnHazards(state.rng, depth, state.moth);
    state.cardNote = CARD_NOTES[Math.min(depth - 1, CARD_NOTES.length - 1)];
    state.phase = PHASE.CARD;
    state.cardT = 0;
  }

  function breakChain() {
    state.chain = 0;
    state.chainTimer = 0;
  }

  function takeEmber(count) {
    for (let i = 0; i < count; i++) {
      state.totalEmbers++;
      state.gathered++;
      state.chain = Math.min(COMBO.max, state.chain + 1);
      state.chainTimer = COMBO.window;
      state.bestChain = Math.max(state.bestChain, state.chain);
      state.score += EMBER.value * state.chain;
      state.moth.flame = clamp(state.moth.flame + FLAME.emberGain, 0, FLAME.max);
      sfxCollect(state.chain);
    }
    burst(state.moth.x, state.moth.y, 12, COLORS.emberHot, 210, 0.5);
  }

  function update(dt) {
    state.time += dt;

    if (state.phase === PHASE.TITLE) {
      if (anyConfirm()) {
        initAudio();
        startRun();
      }
      return;
    }

    if (state.phase === PHASE.PAUSED) {
      if (pressed('KeyP')) state.phase = PHASE.PLAY;
      return;
    }

    if (state.phase === PHASE.DEAD || state.phase === PHASE.WIN) {
      if (anyConfirm()) startRun();
      return;
    }

    if (state.phase === PHASE.CARD) {
      state.cardT += dt;
      if (state.cardT > 1.75) state.phase = PHASE.PLAY;
      return;
    }

    // --- PLAY ---
    if (pressed('KeyP')) {
      state.phase = PHASE.PAUSED;
      return;
    }
    if (pressed('KeyM')) toggleMute();

    const input = steering();
    updateMoth(state.moth, input, dt, { depth: state.depth });

    if (pressed('Space')) {
      if (pulseMoth(state.moth)) {
        sfxPulse();
        ring(state.moth.x, state.moth.y, COLORS.ember);
      }
    }

    // Ember spawning: a steady trickle, capped so the room never fills up.
    state.emberClock += dt;
    const [lo, hi] = EMBER.spawnEvery;
    const interval = lo + (hi - lo) * Math.min(1, (state.depth - 1) / 4);
    if (state.emberClock >= interval && state.embers.length < EMBER.wanted + 2) {
      state.emberClock = 0;
      state.embers.push(spawnEmber(state.rng, state.moth));
    }

    state.embers = updateEmbers(state.embers, state.moth, dt);
    const got = collectEmbers(state.embers, state.moth, 13);
    if (got > 0) takeEmber(got);

    updateHazards(state.hazards, state.moth, state.depth, dt);

    const hit = hazardHit(state.hazards, state.moth);
    if (hit) {
      if (hurtMoth(state.moth, hit.x, hit.y)) {
        sfxHurt();
        breakChain();
        shake(9, 0.3);
        burst(state.moth.x, state.moth.y, 16, COLORS.hazard, 240, 0.55);
        // Bounce the hazard away too, so one touch is not a death spiral.
        hit.vx = (hit.x - state.moth.x) * 3.2;
        hit.vy = (hit.y - state.moth.y) * 3.2;
      }
    }

    if (state.chainTimer > 0) {
      state.chainTimer -= dt;
      if (state.chainTimer <= 0) breakChain();
    }

    const open = state.gathered >= EMBER.wanted;
    const wasOpen = state.rift.open;
    updateRift(state.rift, open, dt);
    if (open && !wasOpen) sfxRift();

    if (mothInRift(state.rift, state.moth)) {
      if (state.depth >= DEPTHS) {
        sfxWin();
        state.phase = PHASE.WIN;
        burst(state.moth.x, state.moth.y, 60, COLORS.rift, 320, 1.0);
      } else {
        sfxDive();
        state.score += 120;
        enterDepth(state.depth + 1);
      }
    }

    if (!state.moth.alive) {
      sfxDeath();
      shake(13, 0.35);
      burst(state.moth.x, state.moth.y, 40, COLORS.hazard, 300, 0.9);
      state.phase = PHASE.DEAD;
    }

    updateEffects(dt);
  }

  function render() {
    const off = shakeOffset();
    ctx.save();
    ctx.translate(off.x, off.y);

    drawScenery(ctx, state.scene, state.time);

    if (state.phase === PHASE.TITLE) {
      drawTitle(ctx, state);
      ctx.restore();
      return;
    }

    drawRift(ctx, state.rift, state.depth);
    drawRiftLabel(ctx, state.rift, state.gathered, EMBER.wanted);
    drawEmbers(ctx, state.embers, state.time);
    drawHazards(ctx, state.hazards, state.time);
    if (state.phase !== PHASE.DEAD) drawMoth(ctx, state.moth);
    drawEffects(ctx);
    drawVignette(ctx);

    if (state.phase !== PHASE.WIN && state.phase !== PHASE.DEAD) drawHud(ctx, state);

    if (state.phase === PHASE.CARD) drawDepthCard(ctx, state, state.cardT);
    if (state.phase === PHASE.PAUSED) drawPause(ctx);
    if (state.phase === PHASE.DEAD) drawGameOver(ctx, state);
    if (state.phase === PHASE.WIN) drawWin(ctx, state);

    ctx.restore();
  }

  let last = 0;
  let acc = 0;
  const STEP = 1 / 120;

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    // Clamp so a tab that was asleep does not teleport the moth through walls.
    if (dt > 0.1) dt = 0.1;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 8) {
      update(STEP);
      acc -= STEP;
      guard++;
    }
    if (guard >= 8) acc = 0;
    clearEdges();
    render();
    requestAnimationFrame(frame);
  }

  return {
    state,
    start: () => requestAnimationFrame(frame),
    // Used by the screenshot harness to put the game in a known state.
    debug: { enterDepth, startRun, takeEmber, PHASE },
  };
}
