// The rift: the exit. It stays shut and dim while embers are missing, opens
// with an audible cue once every ember of the depth is gathered, and pulls the
// moth in on contact. It is drawn as an arch so a player can find it instantly.

import { RIFT, VIEW, COLORS } from './config.js';
import { clamp, dist2, easeOutCubic } from './math.js';

export function createRift(x, y) {
  return {
    x, y,
    w: RIFT.w,
    h: RIFT.h,
    open: false,
    glow: 0,
    pullT: 0,
  };
}

export function riftPlacement(depth) {
  // Each depth puts the rift somewhere else, so the room does not read as the
  // same room five times. Positions are safe from the spawn point at centre.
  const spots = [
    [VIEW.w - 190, VIEW.h * 0.5],
    [190, VIEW.h * 0.28],
    [VIEW.w * 0.5, 150],
    [VIEW.w - 210, VIEW.h * 0.74],
    [210, VIEW.h * 0.7],
  ];
  const [x, y] = spots[(depth - 1) % spots.length];
  return { x, y };
}

export function updateRift(r, open, dt) {
  r.open = open;
  const target = open ? 1 : 0.12;
  r.glow += (target - r.glow) * clamp(dt * 6, 0, 1);
}

export function mothInRift(r, moth) {
  if (!r.open) return false;
  return Math.abs(moth.x - r.x) < r.w * 0.5 && Math.abs(moth.y - r.y) < r.h * 0.5;
}

export function drawRift(ctx, r, depth) {
  const t = easeOutCubic(clamp(r.glow, 0, 1));
  const w = r.w * (0.72 + t * 0.28);
  const h = r.h * (0.72 + t * 0.28);

  // Outer haze grows as it opens.
  ctx.globalAlpha = 0.10 + t * 0.30;
  ctx.fillStyle = COLORS.rift;
  ctx.beginPath();
  ctx.ellipse(r.x, r.y, w * 0.95, h * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // The arch itself: two uprights and a curve, like a door standing in space.
  ctx.globalAlpha = 0.35 + t * 0.65;
  ctx.strokeStyle = COLORS.rift;
  ctx.lineWidth = 3 + t * 3;
  ctx.beginPath();
  ctx.moveTo(r.x - w * 0.5, r.y + h * 0.5);
  ctx.lineTo(r.x - w * 0.5, r.y - h * 0.1);
  ctx.quadraticCurveTo(r.x, r.y - h * 1.05, r.x + w * 0.5, r.y - h * 0.1);
  ctx.lineTo(r.x + w * 0.5, r.y + h * 0.5);
  ctx.stroke();

  // Inside, a field of vertical streaks that only shows when it is open: the
  // visual difference between "locked" and "go" is unmistakable.
  if (t > 0.4) {
    const a = (t - 0.4) / 0.6;
    ctx.globalAlpha = a * 0.5;
    ctx.strokeStyle = COLORS.rift;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const fx = r.x - w * 0.36 + (i / 6) * w * 0.72;
      const drift = ((performance.now() * 0.0004 + i * 0.17) % 1);
      const fy = r.y + h * 0.5 - drift * h * 0.9;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy - h * 0.22);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// The label above the rift tells the player exactly what is left to do.
export function drawRiftLabel(ctx, r, gathered, wanted) {
  ctx.save();
  ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = gathered >= wanted ? COLORS.rift : COLORS.dim;
  const text = gathered >= wanted ? 'RIFT OPEN — FLY IN' : `RIFT SEALED  ${gathered}/${wanted}`;
  ctx.fillText(text, r.x, r.y - r.h * 1.15);
  ctx.restore();
}
