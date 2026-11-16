// The star field and the gravity wells. Both are pure draw functions: they read state and paint, they
// never mutate the sim, so a screenshot scene can call them on a scratch canvas.

import { VIEW } from './config.js';
import { seeded, rangeOf, TAU } from './math.js';

/** Build a fixed star field once. Two layers so the parallax reads without a camera. */
export function makeStarField(count = 260) {
  const rand = seeded(0x5eed1);
  const near = [];
  const far = [];
  for (let i = 0; i < count; i += 1) {
    const star = {
      x: rangeOf(rand, 0, VIEW.width),
      y: rangeOf(rand, 0, VIEW.height),
      r: rangeOf(rand, 0.4, 1.5),
      a: rangeOf(rand, 0.15, 0.7),
      phase: rangeOf(rand, 0, TAU),
    };
    (star.r > 1.0 ? near : far).push(star);
  }
  return { near, far };
}

export function drawStars(ctx, field, time) {
  ctx.fillStyle = '#06080f';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  for (const star of field.far) {
    ctx.globalAlpha = star.a * 0.65;
    ctx.fillStyle = '#9fb6e4';
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
  for (const star of field.near) {
    const twinkle = 0.72 + 0.28 * Math.sin(time * 1.4 + star.phase);
    ctx.globalAlpha = star.a * twinkle;
    ctx.fillStyle = '#eaf2ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A well: a hot core, a corona, and the horizon ring that means death. */
export function drawWell(ctx, well, time, focused) {
  const pulse = 1 + Math.sin(time * 1.8 + well.x * 0.01) * 0.03;
  const core = well.horizon * 0.52 * pulse;

  const corona = ctx.createRadialGradient(well.x, well.y, core * 0.4, well.x, well.y, well.horizon * 4.2);
  corona.addColorStop(0, 'rgba(255, 196, 92, 0.5)');
  corona.addColorStop(0.28, 'rgba(255, 122, 74, 0.22)');
  corona.addColorStop(0.62, 'rgba(150, 60, 160, 0.1)');
  corona.addColorStop(1, 'rgba(20, 10, 40, 0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(well.x, well.y, well.horizon * 4.2, 0, TAU);
  ctx.fill();

  const body = ctx.createRadialGradient(well.x - core * 0.3, well.y - core * 0.35, core * 0.1, well.x, well.y, core);
  body.addColorStop(0, '#fff8e6');
  body.addColorStop(0.5, '#ffc65e');
  body.addColorStop(1, '#c2410c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(well.x, well.y, core, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = focused ? 'rgba(255, 95, 109, 0.85)' : 'rgba(255, 95, 109, 0.42)';
  ctx.lineWidth = focused ? 2.4 : 1.4;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.arc(well.x, well.y, well.horizon, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Draw only the wells; the caller decides the order against the gates and the ship. */
export function drawWells(ctx, wells, time, activeWell) {
  for (const well of wells) drawWell(ctx, well, time, well === activeWell);
}
