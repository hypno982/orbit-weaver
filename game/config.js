// Tuning and level data. Everything the game balances lives here, so a change of feel is a change of numbers.

export const VIEW = { width: 1280, height: 720 };

// Ship handling. Thrust is an acceleration in units per second squared; drag is what keeps a coasting
// comet from feeling like a shopping trolley.
export const SHIP = {
  radius: 11,
  thrust: 300,
  retro: 210,
  lateral: 240,
  drag: 0.16,
  maxSpeed: 620,
  fuel: 100,
  fuelBurn: 26,
  pulseCost: 22,
  pulseImpulse: 240,
  pulses: 3,
};

// A well is a gravity source. `mass` is the pull at one unit of distance squared, `horizon` the radius
// inside which the comet is lost.
export const WELL_STYLE = {
  horizonPad: 16,
};

// Gates are rings the comet must thread, in order. A gate stays open until the next is aimed at.
export const GATE = {
  radius: 46,
  passWidth: 52,
};

// Six systems. Each row is one level: wells, gates, the dock, and the par time used only for scoring.
export const SYSTEMS = [
  {
    name: 'HELIOS DRIFT',
    hint: 'One sun. Aim wide, then cut in.',
    par: 18,
    wells: [{ x: 640, y: 360, mass: 2600000, horizon: 52 }],
    gates: [
      { x: 640, y: 130 },
      { x: 1090, y: 360 },
      { x: 640, y: 600 },
    ],
    dock: { x: 190, y: 360 },
  },
  {
    name: 'TWIN LANTERNS',
    hint: 'Two suns pull against each other. The middle is a slingshot.',
    par: 20,
    wells: [
      { x: 430, y: 250, mass: 1800000, horizon: 46 },
      { x: 850, y: 470, mass: 1800000, horizon: 46 },
    ],
    gates: [
      { x: 640, y: 160 },
      { x: 1080, y: 610 },
      { x: 640, y: 360 },
      { x: 200, y: 110 },
    ],
    dock: { x: 1130, y: 110 },
  },
  {
    name: 'THE NARROWS',
    hint: 'A heavy heart and a tight corridor. Pulse early.',
    par: 22,
    wells: [{ x: 640, y: 380, mass: 4200000, horizon: 74 }],
    gates: [
      { x: 200, y: 120 },
      { x: 1080, y: 120 },
      { x: 1080, y: 600 },
      { x: 200, y: 600 },
      { x: 640, y: 120 },
    ],
    dock: { x: 640, y: 660 },
  },
  {
    name: 'EMBER CHOIR',
    hint: 'Three small fires. Bank off one into the next.',
    par: 26,
    wells: [
      { x: 330, y: 190, mass: 1250000, horizon: 38 },
      { x: 950, y: 190, mass: 1250000, horizon: 38 },
      { x: 640, y: 560, mass: 1250000, horizon: 38 },
    ],
    gates: [
      { x: 640, y: 300 },
      { x: 1150, y: 470 },
      { x: 640, y: 700 - 40 },
      { x: 130, y: 470 },
      { x: 640, y: 60 },
    ],
    dock: { x: 640, y: 430 },
  },
  {
    name: 'CINDER SPIRAL',
    hint: 'One massive eye. Ride the rim and never look down.',
    par: 30,
    wells: [{ x: 640, y: 360, mass: 6200000, horizon: 96 }],
    gates: [
      { x: 640, y: 90 },
      { x: 1120, y: 360 },
      { x: 640, y: 630 },
      { x: 160, y: 360 },
      { x: 900, y: 130 },
      { x: 380, y: 590 },
    ],
    dock: { x: 640, y: 360 - 230 },
  },
  {
    name: 'LAST WEAVE',
    hint: 'Four suns, six gates, one comet. This is the weave.',
    par: 36,
    wells: [
      { x: 300, y: 200, mass: 1500000, horizon: 42 },
      { x: 980, y: 200, mass: 1500000, horizon: 42 },
      { x: 300, y: 520, mass: 1500000, horizon: 42 },
      { x: 980, y: 520, mass: 1500000, horizon: 42 },
    ],
    gates: [
      { x: 640, y: 110 },
      { x: 1180, y: 360 },
      { x: 640, y: 610 },
      { x: 100, y: 360 },
      { x: 640, y: 250 },
      { x: 640, y: 470 },
    ],
    dock: { x: 640, y: 360 },
  },
];

// Scoring: par time bonus, fuel bonus, pulse bonus, minus a penalty per crash.
export const SCORE = {
  gate: 120,
  system: 500,
  parBonus: 40,
  fuelBonus: 3,
  pulseBonus: 60,
};
