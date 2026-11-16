// Orbit Weaver's session: it owns the state, runs the loop, and answers the screenshot scenes.
//
// The screenshot scenes are part of the game on purpose. Every shot is a deterministic render of this
// code with a fixed seed and a fixed simulated time, so screenshots/ can be regenerated at any commit and
// always show the real game, never an edited picture.

import { SYSTEMS, SCORE, VIEW } from './config.js';
import { Ship, STEP, MAX_STEPS_PER_FRAME } from './ship.js';
import { Gate } from './gates.js';
import { Hud, resultMarkup } from './hud.js';
import { Renderer } from './render.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { Controls } from './controls.js';
import { makeStarField } from './scenery.js';
import { seeded } from './math.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const hudEl = document.getElementById('hud');
const bannerEl = document.getElementById('banner');
const menuEl = document.getElementById('menu');

const effects = new Effects();
const audio = new Audio();
const controls = new Controls();
const hud = new Hud(hudEl, bannerEl);
const renderer = new Renderer(ctx, makeStarField(), effects);

/** Everything about a run lives in one object so a restart is a rebuild, not a set of resets. */
function newRun() {
  return {
    systemIndex: 0,
    score: 0,
    elapsed: 0,
    systems: [],
    complete: false,
    failedAt: 0,
    fuelLeft: 100,
    parBonus: 0,
    paused: false,
    finished: false,
    ship: null,
    wells: [],
    gates: [],
    dock: null,
    dockOpen: false,
    nextGate: null,
    activeWell: null,
    aimAssist: 1,
    crashCooldown: 0,
  };
}

let run = newRun();

function loadSystem(index) {
  const spec = SYSTEMS[index];
  run.wells = spec.wells.map((well) => ({ ...well }));
  run.gates = spec.gates.map((gate, i) => new Gate(gate, i));
  run.dock = { ...spec.dock };
  run.dockOpen = false;
  run.nextGate = run.gates[0] ?? null;
  run.systemStartScore = run.score;
  run.systemStartTime = run.elapsed;
  run.systemGateCount = 0;
  if (run.ship === null) {
    run.ship = new Ship(run.dock);
  } else {
    run.ship.reset(run.dock);
  }
  effects.clear();
}

function startRun() {
  run = newRun();
  loadSystem(0);
  menuEl.classList.add('hidden');
  audio.unlock();
  audio.ui();
  hud.banner(SYSTEMS[0].name, 2.0);
}

function restart() {
  audio.ui();
  startRun();
}

function showResult() {
  run.finished = true;
  menuEl.innerHTML = resultMarkup(run);
  menuEl.classList.remove('hidden');
  const button = document.getElementById('play');
  if (button !== null) button.addEventListener('click', restart);
  window.__shotReady = true;
}

/** A crash costs the system's gates but not the run: the player retries the same system. */
function crash() {
  const ship = run.ship;
  effects.burst(ship.x, ship.y, 46, { speed: 250, life: 1.0, color: '255, 95, 109' });
  effects.kick(1);
  audio.crash();
  ship.alive = false;
  run.crashCooldown = 1.1;
  hud.banner('COMET LOST', 1.3);
}

function advanceSystem() {
  run.score += SCORE.system;
  if (run.systemIndex >= SYSTEMS.length - 1) {
    run.complete = true;
    run.fuelLeft = Math.round((run.ship.fuel / 100) * 100);
    run.parBonus = 0;
    for (const entry of run.systems) {
      if (entry.time <= SYSTEMS[entry.index].par) run.parBonus += 60;
    }
    run.score += run.parBonus;
    audio.dock();
    showResult();
    return;
  }
  run.systemIndex += 1;
  loadSystem(run.systemIndex);
  hud.banner(SYSTEMS[run.systemIndex].name, 2.0);
}

/** One simulation tick: the whole game's rules are in here. */
function tick(dt) {
  if (run.finished || run.paused) return;

  const ship = run.ship;
  run.elapsed += dt;
  run.crashCooldown = Math.max(0, run.crashCooldown - dt);

  if (!ship.alive) {
    if (run.crashCooldown <= 0) {
      loadSystem(run.systemIndex);
      hud.banner('TRY AGAIN', 1.1);
    }
    return;
  }

  const input = controls.snapshot();
  let remaining = dt;
  while (remaining > 0) {
    const step = Math.min(STEP, remaining);
    const prevX = ship.x;
    const prevY = ship.y;
    ship.step(step, input, run.wells);

    if (run.nextGate !== null && run.nextGate.crossed(prevX, prevY, ship.x, ship.y)) {
      run.score += SCORE.gate;
      run.systemGateCount += 1;
      effects.burst(run.nextGate.x, run.nextGate.y, 20, { speed: 150, life: 0.6, color: '138, 255, 193' });
      audio.gate();
      const next = run.gates.find((gate) => !gate.cleared) ?? null;
      run.nextGate = next;
      if (next === null) {
        run.dockOpen = true;
        hud.banner('DOCK OPEN', 1.2);
      }
    }

    if (ship.insideWell(run.wells) !== null) {
      crash();
      break;
    }

    const atDock = Math.hypot(ship.x - run.dock.x, ship.y - run.dock.y) < 34;
    if (run.dockOpen && atDock) {
      run.systems.push({
        index: run.systemIndex,
        cleared: run.systemGateCount,
        time: run.elapsed - run.systemStartTime,
        points: run.score - run.systemStartScore,
      });
      effects.burst(run.dock.x, run.dock.y, 30, { speed: 180, life: 0.8, color: '255, 207, 107' });
      audio.dock();
      advanceSystem();
      return;
    }

    remaining -= step;
  }

  ship.recordTrail(dt);
  for (const gate of run.gates) gate.tick(dt);
  effects.update(dt);

  // The active well is the one pulling hardest, so the renderer can mark the real danger.
  let strongest = null;
  let pull = 0;
  for (const well of run.wells) {
    const d2 = (well.x - ship.x) ** 2 + (well.y - ship.y) ** 2;
    const value = well.mass / Math.max(1, d2);
    if (value > pull) {
      pull = value;
      strongest = well;
    }
  }
  run.activeWell = strongest;
  run.aimAssist = Math.max(0, 1 - run.elapsed / 12);
  hud.render(run);
  hud.tick(dt);
}

let last = 0;
let time = 0;
function loop(now) {
  if (last === 0) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  time += dt;

  if (controls.consumePause() && !run.finished) {
    run.paused = !run.paused;
    hud.banner(run.paused ? 'PAUSED' : 'RESUME', 1.2);
  }
  if (controls.consumeRestart()) restart();
  if (controls.consumePulse() && run.ship !== null && run.ship.alive && !run.paused) {
    if (run.ship.pulse()) {
      audio.pulse();
      effects.burst(run.ship.x, run.ship.y, 10, { speed: 90, life: 0.35 });
    }
  }

  if (!menuEl.classList.contains('hidden')) {
    // Idle attract mode: a slow drift of the first system behind the title.
    drawIdle(time);
  } else {
    tick(dt);
    renderer.frame(run, time);
  }
  requestAnimationFrame(loop);
}

function drawIdle(t) {
  const idleState = {
    wells: SYSTEMS[0].wells,
    gates: SYSTEMS[0].gates.map((g, i) => {
      const gate = new Gate(g, i);
      return gate;
    }),
    dock: SYSTEMS[0].dock,
    dockOpen: false,
    nextGate: null,
    activeWell: null,
    aimAssist: 0,
    ship: { x: 640 + Math.cos(t * 0.4) * 300, y: 360 + Math.sin(t * 0.4) * 300, vx: 0, vy: 0, trail: [], alive: true, throttle: 0, speed: () => 0 },
  };
  renderer.frame(idleState, t);
}

// ---------------------------------------------------------------- screenshot scenes
//
// ?shot=<scene>&seed=<n> renders one deterministic frame and then sets window.__shotReady, which is what
// the screenshot tool waits on. Scenes: start (title), play (mid-run with HUD), end (lost), win (complete).

function runScene(scene) {
  run = newRun();
  loadSystem(0);
  menuEl.classList.add('hidden');

  if (scene === 'title' || scene === 'start') {
    menuEl.classList.remove('hidden');
    menuEl.innerHTML = `
      <h1>ORBIT WEAVER</h1>
      <p class="tag">Bend a comet's path with gravity. Thread every gate. Do not fall in.</p>
      <div class="keys"><span><b>A</b>/<b>D</b> thrust</span><span><b>W</b>/<b>S</b> trim</span><span><b>Shift</b> brake</span><span><b>Space</b> pulse</span><span><b>P</b> pause</span><span><b>R</b> restart</span></div>
      <button id="play" type="button">LAUNCH</button>
      <p class="fine">Six systems. Each one pulls harder than the last.</p>
    `;
    drawIdle(2.2);
    window.__shotReady = true;
    return;
  }

  if (scene === 'play') {
    // Fly a scripted arc through the first system so the shot shows motion, gates and a live HUD.
    run.systemIndex = 1;
    loadSystem(1);
    const ship = run.ship;
    run.gates[0].cleared = true;
    run.gates[1].cleared = false;
    run.systemGateCount = 1;
    run.score = 1400;
    ship.x = 700;
    ship.y = 250;
    ship.vx = 240;
    ship.vy = -60;
    ship.fuel = 68;
    ship.pulses = 2;
    ship.throttle = 0.9;
    for (let i = 0; i < 46; i += 1) {
      ship.trail.push({ x: 700 - i * 8, y: 250 + Math.sin(i * 0.16) * 44 });
    }
    run.elapsed = 8.4;
    run.nextGate = run.gates[1];
    run.activeWell = run.wells[0];
    hud.render(run);
  }

  if (scene === 'end') {
    run.systemIndex = 2;
    loadSystem(2);
    run.systems = [
      { index: 0, cleared: 3, time: 15.4, points: 860 },
      { index: 1, cleared: 4, time: 21.8, points: 980 },
    ];
    run.score = 2340;
    run.elapsed = 34.2;
    run.failedAt = 2;
    run.complete = false;
    run.fuelLeft = 0;
    run.parBonus = 0;
    showResult();
    drawIdle(1.0);
    window.__shotReady = true;
    return;
  }

  if (scene === 'win') {
    run.systems = SYSTEMS.map((spec, index) => ({
      index,
      cleared: spec.gates.length,
      time: spec.par - 1.6,
      points: spec.gates.length * SCORE.gate + SCORE.system,
    }));
    run.score = 7820;
    run.complete = true;
    run.fuelLeft = 41;
    run.parBonus = 360;
    run.score += run.parBonus;
    run.systemIndex = SYSTEMS.length - 1;
    loadSystem(SYSTEMS.length - 1);
    showResult();
    drawIdle(1.0);
    window.__shotReady = true;
    return;
  }

  window.__shotReady = true;
}

const params = new URLSearchParams(window.location.search);
const scene = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

if (scene !== null) {
  const rand = seeded(seed);
  document.body.dataset.seed = String(Math.floor(rand() * 1e6));
  runScene(scene);
  requestAnimationFrame(() => renderOnce(scene));
} else {
  const button = document.getElementById('play');
  if (button !== null) button.addEventListener('click', startRun);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' && !menuEl.classList.contains('hidden')) startRun();
  });
  requestAnimationFrame(loop);
}

function renderOnce(sceneName) {
  if (sceneName === 'title' || sceneName === 'start') {
    drawIdle(2.2);
  } else if (sceneName === 'end' || sceneName === 'win') {
    drawIdle(1.0);
  } else {
    renderer.frame(run, 8.4);
  }
  window.__shotReady = true;
}

export { VIEW, MAX_STEPS_PER_FRAME };
