// The moth: the thing the player flies. Holds its own state and knows how to
// steer, spend flame, take a hit and emit its wing shimmer.

import { MOTH, FLAME, VIEW, COLORS } from './config.js';
import { clamp, len } from './math.js';

export function createMoth(rng) {
  return {
    x: VIEW.w * 0.5,
    y: VIEW.h * 0.5,
    vx: 0,
    vy: 0,
    flame: FLAME.max,
    pulseWarm: 0,
    pulseX: 0,
    pulseY: 0,
    invuln: 0,
    alive: true,
    wing: rng() * Math.PI * 2,
    trail: [],
    trailClock: 0,
    facing: 0,
  };
}

// input: {x, y} in -1..1 from the keyboard, plus pulseGrounded request flag.
export function updateMoth(m, input, dt, opts) {
  const depth = opts.depth;

  // Thrust: acceleration toward the input direction, then exponential drag so
  // stopping feels like gliding rather than braking.
  m.vx += input.x * MOTH.accel * dt;
  m.vy += input.y * MOTH.accel * dt;
  const damp = Math.exp(-MOTH.drag * dt);
  m.vx *= damp;
  m.vy *= damp;

  const sp = len(m.vx, m.vy);
  if (sp > MOTH.maxSpeed) {
    m.vx = (m.vx / sp) * MOTH.maxSpeed;
    m.vy = (m.vy / sp) * MOTH.maxSpeed;
  }

  m.x += m.vx * dt;
  m.y += m.vy * dt;

  // Walls are soft: bounce with most of the energy kept, so the room never
  // eats your momentum but you still feel the edge.
  if (m.x < MOTH.radius) { m.x = MOTH.radius; m.vx = Math.abs(m.vx) * 0.55; }
  if (m.x > VIEW.w - MOTH.radius) { m.x = VIEW.w - MOTH.radius; m.vx = -Math.abs(m.vx) * 0.55; }
  if (m.y < MOTH.radius) { m.y = MOTH.radius; m.vy = Math.abs(m.vy) * 0.55; }
  if (m.y > VIEW.h - MOTH.radius) { m.y = VIEW.h - MOTH.radius; m.vy = -Math.abs(m.vy) * 0.55; }

  // Flame is the clock. Deeper rooms burn it faster, so the run is always
  // pressing the player forward.
  m.flame -= (FLAME.drainPerSec + depth * FLAME.drainPerDepth) * dt;
  m.flame = clamp(m.flame, 0, FLAME.max);
  if (m.flame <= 0) m.alive = false;

  if (m.pulseWarm > 0) m.pulseWarm = Math.max(0, m.pulseWarm - dt);
  if (m.invuln > 0) m.invuln = Math.max(0, m.invuln - dt);

  // Wings beat faster the harder you push.
  m.wing += (7 + sp * 0.02) * dt;
  if (sp > 12) m.facing = Math.atan2(m.vy, m.vx);

  // Trail motes for the sense of speed.
  m.trailClock += dt;
  if (m.trailClock >= MOTH.trailEvery) {
    m.trailClock = 0;
    m.trail.push({ x: m.x, y: m.y, life: 0.5 });
    if (m.trail.length > 26) m.trail.shift();
  }
  for (const t of m.trail) t.life -= dt * 2.2;
  m.trail = m.trail.filter((t) => t.life > 0);
}

// Returns true when the pulse actually fires (it costs flame either way only
// if it fires, so a player never pays for an empty press).
export function pulseMoth(m) {
  if (m.flame < FLAME.pulseCost) return false;
  m.flame -= FLAME.pulseCost;
  m.pulseWarm = FLAME.pulseRecover;
  m.pulseX = m.x;
  m.pulseY = m.y;
  m.invuln = Math.max(m.invuln, 0.22);
  return true;
}

export function hurtMoth(m, fromX, fromY) {
  if (m.invuln > 0) return false;
  m.flame = clamp(m.flame - FLAME.hurtCost, 0, FLAME.max);
  const dx = m.x - fromX, dy = m.y - fromY;
  const l = Math.hypot(dx, dy) || 1;
  m.vx += (dx / l) * 240;
  m.vy += (dy / l) * 240;
  m.invuln = 1.1;
  if (m.flame <= 0) m.alive = false;
  return true;
}

export function drawMoth(ctx, m) {
  // Trail first, so the body sits on top of its own light.
  for (const t of m.trail) {
    ctx.globalAlpha = t.life * 0.5;
    ctx.fillStyle = COLORS.mothWing;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 2.6 * t.life + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (m.pulseWarm > 0) {
    const r = FLAME.pulseRadius * (1 - m.pulseWarm / FLAME.pulseRecover) * 0.9 + 24;
    ctx.globalAlpha = (m.pulseWarm / FLAME.pulseRecover) * 0.35;
    ctx.strokeStyle = COLORS.ember;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(m.pulseX, m.pulseY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const hurt = m.invuln > 0 && Math.floor(m.invuln * 14) % 2 === 0;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.facing);

  // Two wings, beating.
  const beat = Math.abs(Math.sin(m.wing)) * 0.7 + 0.3;
  ctx.globalAlpha = hurt ? 0.45 : 1;
  ctx.fillStyle = COLORS.mothWing;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-2, side * 7 * beat, 12, 7 * beat, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Body.
  ctx.fillStyle = hurt ? '#ff9aa8' : COLORS.mothBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // The ember it carries: this is the flame made visible.
  const glow = clamp(m.flame / FLAME.max, 0, 1);
  ctx.fillStyle = COLORS.emberHot;
  ctx.globalAlpha = 0.55 + glow * 0.45;
  ctx.beginPath();
  ctx.arc(-4, 0, 2.2 + glow * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}
