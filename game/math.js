// Vector maths and a seeded generator. Kept separate from the sim so the physics reads in one screen.

export const TAU = Math.PI * 2;

export function len(x, y) {
  return Math.hypot(x, y);
}

export function norm(x, y) {
  const l = Math.hypot(x, y);
  return l === 0 ? [0, 0] : [x / l, y / l];
}

export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function angleOf(vx, vy) {
  return Math.atan2(vy, vx);
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDelta(from, to) {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

/**
 * A deterministic PRNG (mulberry32). Screenshots are taken from a fixed seed so the same frame is
 * reproducible: no wall clock and no Math.random anywhere in the game.
 */
export function seeded(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeOf(rand, low, high) {
  return low + rand() * (high - low);
}

/** Distance from a point to a segment, used by the trail and by the gate pass test. */
export function pointSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denom = abx * abx + aby * aby;
  const t = denom === 0 ? 0 : clamp((apx * abx + apy * aby) / denom, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}
