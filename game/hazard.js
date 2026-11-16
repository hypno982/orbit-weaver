// Hazards: the cold motes that chase the ember. They wander, drift toward the
// moth with a strength that grows by depth, and can be shoved away by a pulse.

import { HAZARD, VIEW, COLORS } from './config.js';
import { clamp, dist2, len, norm, randRange } from './math.js';

export function spawnHazards(rng, depth, away) {
  const count = HAZARD.baseCount + depth * HAZARD.perDepth;
  const speed = HAZARD.baseSpeed + depth * HAZARD.speedPerDepth;
  const list = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do {
      // Spawn on a ring around the room rather than on top of the player.
      const side = Math.floor(rng() * 4);
      if (side === 0) { x = randRange(rng, 40, VIEW.w - 40); y = 44; }
      else if (side === 1) { x = randRange(rng, 40, VIEW.w - 40); y = VIEW.h - 40; }
      else if (side === 2) { x = 44; y = randRange(rng, 40, VIEW.h - 40); }
      else { x = VIEW.w - 44; y = randRange(rng, 40, VIEW.h - 40); }
      tries++;
    } while (away && dist2(x, y, away.x, away.y) < 260 * 260 && tries < 30);

    const ang = rng() * Math.PI * 2;
    list.push({
      x, y,
      vx: Math.cos(ang) * speed * 0.6,
      vy: Math.sin(ang) * speed * 0.6,
      speed,
      wobble: rng() * Math.PI * 2,
      phase: rng() * 100,
    });
  }
  return list;
}

export function updateHazards(list, moth, depth, dt) {
  for (const h of list) {
    // Chase: stronger each depth, but always slower than the moth's top speed,
    // so the room is a threat you can outrun rather than a wall you hit.
    const dx = moth.x - h.x, dy = moth.y - h.y;
    const d = len(dx, dy) || 1;
    const pull = 0.9 + depth * 0.22;
    h.vx += (dx / d) * h.speed * pull * dt;
    h.vy += (dy / d) * h.speed * pull * dt;

    // Wander keeps them from forming a single conga line behind the player.
    h.wobble += dt * 2.1;
    h.vx += Math.cos(h.wobble + h.phase) * h.speed * HAZARD.drift * dt;
    h.vy += Math.sin(h.wobble * 1.3 + h.phase) * h.speed * HAZARD.drift * dt;

    // A pulse shoves them out. This is the defensive half of the same meter
    // the player spends on embers, which is the whole tension of the game.
    if (moth.pulseWarm > 0) {
      const pd2 = dist2(h.x, h.y, moth.pulseX, moth.pulseY);
      const R = 190;
      if (pd2 < R * R) {
        const pd = Math.sqrt(pd2) || 1;
        const push = (moth.pulseWarm / 0.55) * 780;
        h.vx += ((h.x - moth.pulseX) / pd) * push * dt;
        h.vy += ((h.y - moth.pulseY) / pd) * push * dt;
      }
    }

    const sp = len(h.vx, h.vy);
    const cap = h.speed * 2.6;
    if (sp > cap) {
      h.vx = (h.vx / sp) * cap;
      h.vy = (h.vy / sp) * cap;
    }
    h.vx *= Math.exp(-0.5 * dt);
    h.vy *= Math.exp(-0.5 * dt);

    h.x = clamp(h.x + h.vx * dt, HAZARD.radius, VIEW.w - HAZARD.radius);
    h.y = clamp(h.y + h.vy * dt, HAZARD.radius, VIEW.h - HAZARD.radius);
  }
}

// First hazard touching the moth, or null.
export function hazardHit(list, moth) {
  for (const h of list) {
    if (dist2(h.x, h.y, moth.x, moth.y) < (HAZARD.radius + 9) ** 2) return h;
  }
  return null;
}

export function drawHazards(ctx, list, time) {
  for (const h of list) {
    const pulse = 1 + Math.sin(time * 5 + h.phase) * 0.14;

    // Cold halo.
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = COLORS.hazard;
    ctx.beginPath();
    ctx.arc(h.x, h.y, HAZARD.radius * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Spiked body: reads as "do not touch" even small.
    ctx.fillStyle = COLORS.hazard;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + h.wobble * 0.4;
      const r = HAZARD.radius * (i % 2 === 0 ? 1.15 : 0.72) * pulse;
      ctx.lineTo(h.x + Math.cos(ang) * r, h.y + Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.hazardCore;
    ctx.beginPath();
    ctx.arc(h.x, h.y, HAZARD.radius * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }
}
