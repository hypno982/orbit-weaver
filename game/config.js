// EMBERWING — tuning constants. One place, so balance lives here and nowhere else.

export const VIEW = { w: 1280, h: 720 };

// The moth: light and floaty, but it never stops drifting.
export const MOTH = {
  accel: 1750,          // px/s^2 from held keys
  maxSpeed: 470,
  drag: 1.9,            // per second, applied as v *= exp(-drag*dt)
  radius: 11,
  trailEvery: 0.022,    // seconds between trail motes
};

// The flame is both fuel and weapon: it drains always, and pulsing costs it.
export const FLAME = {
  max: 100,
  drainPerSec: 3.6,
  drainPerDepth: 0.55,  // each depth burns a little faster
  pulseCost: 26,
  pulseRadius: 190,
  pulseForce: 900,
  pulseRecover: 0.55,   // seconds of warmth left behind by a pulse
  emberGain: 22,
  hurtCost: 19,
  lowWarn: 30,
};

export const EMBER = {
  radius: 7,
  wanted: 7,            // embers to open the rift at each depth
  lifetime: 13.0,       // seconds an ember waits before it fades
  spawnEvery: [0.85, 0.55], // seconds, depth 1 -> depth 5
  value: 25,
};

export const HAZARD = {
  radius: 13,
  baseCount: 3,
  perDepth: 2,
  baseSpeed: 66,
  speedPerDepth: 26,
  drift: 0.55,          // how much sideways wander it keeps
  push: 260,            // knockback the moth takes on contact
};

export const COMBO = {
  window: 4.0,          // seconds to keep a chain alive
  max: 8,
};

export const DEPTHS = 5;
export const RIFT = { w: 150, h: 58 };

export const COLORS = {
  bg0: '#08101c',
  bg1: '#0d1a2b',
  rock: '#132235',
  rockEdge: '#1d3450',
  ember: '#ffb057',
  emberHot: '#ffe6a8',
  mothBody: '#e8f1ff',
  mothWing: '#7fd4ff',
  hazard: '#ff5f7e',
  hazardCore: '#ffd0d9',
  rift: '#8affc1',
  text: '#dce8f7',
  dim: '#7d90a8',
};
