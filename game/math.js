// Small math helpers. Nothing clever: the game only needs vectors, clamps and
// a seeded random so a run and its screenshots are reproducible.

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist2(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  return dx * dx + dy * dy;
}

export function len(vx, vy) {
  return Math.hypot(vx, vy);
}

export function norm(vx, vy) {
  const l = Math.hypot(vx, vy) || 1;
  return { x: vx / l, y: vy / l };
}

export function randRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

// mulberry32: tiny, fast, and the same sequence every run.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function easeOutCubic(t) {
  const u = 1 - t;
  return 1 - u * u * u;
}
