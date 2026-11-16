// Scenery: the cold rock the moth flies through. Generated once per depth from
// a seed so the room looks the same every run but different from the last one.

import { VIEW, COLORS } from './config.js';
import { makeRng, randRange } from './math.js';

export function buildScenery(depth) {
  const rng = makeRng(depth * 7919 + 13);

  // Distant rock spires: three parallax layers, back to front.
  const layers = [];
  for (let l = 0; l < 3; l++) {
    const spires = [];
    const count = 7 + l * 3;
    for (let i = 0; i < count; i++) {
      spires.push({
        x: randRange(rng, -40, VIEW.w + 40),
        w: randRange(rng, 40, 130) * (1 - l * 0.18),
        h: randRange(rng, 60, 240) * (1 - l * 0.2),
        lean: randRange(rng, -0.3, 0.3),
      });
    }
    layers.push(spires);
  }

  // Floating grains: slow dust that makes empty space feel like a place.
  const dust = [];
  for (let i = 0; i < 90; i++) {
    dust.push({
      x: randRange(rng, 0, VIEW.w),
      y: randRange(rng, 0, VIEW.h),
      r: randRange(rng, 0.5, 1.9),
      sp: randRange(rng, 4, 16),
      drift: randRange(rng, -6, 6),
    });
  }

  return { layers, dust, depth };
}

export function drawScenery(ctx, scene, time) {
  // Base wash: colder as the run goes deeper.
  const coldness = Math.min(1, scene.depth / 6);
  const g = ctx.createRadialGradient(VIEW.w * 0.5, VIEW.h * 0.45, 60, VIEW.w * 0.5, VIEW.h * 0.5, VIEW.w * 0.75);
  g.addColorStop(0, mix(COLORS.bg1, '#122a3d', coldness));
  g.addColorStop(1, mix(COLORS.bg0, '#050a12', coldness));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Rock spires, back to front, each layer darker and more opaque.
  scene.layers.forEach((spires, l) => {
    const alpha = 0.20 + l * 0.22;
    ctx.fillStyle = l === 2 ? COLORS.rockEdge : COLORS.rock;
    ctx.globalAlpha = alpha;
    for (const s of spires) {
      ctx.beginPath();
      ctx.moveTo(s.x - s.w * 0.5, VIEW.h + 20);
      ctx.lineTo(s.x - s.w * 0.12 + s.lean * s.h, VIEW.h - s.h);
      ctx.lineTo(s.x + s.w * 0.18 + s.lean * s.h, VIEW.h - s.h * 0.86);
      ctx.lineTo(s.x + s.w * 0.5, VIEW.h + 20);
      ctx.closePath();
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  // Dust drifts upward, wrapping. Cheap, and it sells motion while hovering.
  ctx.fillStyle = COLORS.text;
  for (const d of scene.dust) {
    const y = (d.y - time * d.sp) % VIEW.h;
    const yy = y < 0 ? y + VIEW.h : y;
    const x = d.x + Math.sin(time * 0.4 + d.drift) * 8;
    ctx.globalAlpha = 0.10 + d.r * 0.06;
    ctx.beginPath();
    ctx.arc(x, yy, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Vignette keeps the eye on the middle of the room.
export function drawVignette(ctx) {
  const g = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, VIEW.h * 0.42, VIEW.w / 2, VIEW.h / 2, VIEW.w * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function mix(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
