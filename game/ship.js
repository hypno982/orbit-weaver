// The comet's flight model. Integration is a fixed step so a replay of the same inputs lands the same
// place, which is what the screenshot scenes rely on.

import { SHIP, WELL_STYLE } from './config.js';
import { clamp, norm } from './math.js';

const STEP = 1 / 120;
const MAX_STEPS_PER_FRAME = 8;

export class Ship {
  constructor(dock) {
    this.reset(dock);
  }

  reset(dock) {
    this.x = dock.x;
    this.y = dock.y;
    this.vx = 0;
    this.vy = 0;
    this.fuel = SHIP.fuel;
    this.pulses = SHIP.pulses;
    this.alive = true;
    this.throttle = 0;
    this.trail = [];
    this.trailTick = 0;
    this.bank = 0;
  }

  /**
   * One fixed step. `input` is { forward, back, left, right, brake }; wells are the gravity sources.
   * The caller loops this so the sim is frame-rate independent.
   */
  step(dt, input, wells) {
    if (!this.alive) return;

    // Thrust is expressed in the ship's own frame, which is why the nose angle follows the velocity:
    // a comet with no engine points where it is going.
    let ax = 0;
    let ay = 0;
    if (input.forward && this.fuel > 0) {
      ax += SHIP.thrust;
      this.fuel -= SHIP.fuelBurn * dt;
      this.throttle = 1;
    } else if (input.back && this.fuel > 0) {
      ax -= SHIP.retro;
      this.fuel -= SHIP.fuelBurn * dt;
      this.throttle = 0.6;
    } else {
      this.throttle = Math.max(0, this.throttle - dt * 3);
    }
    if (input.up && this.fuel > 0) ay -= SHIP.lateral;
    if (input.down && this.fuel > 0) ay += SHIP.lateral;
    if ((input.up || input.down) && this.fuel > 0) this.fuel -= SHIP.fuelBurn * 0.5 * dt;

    for (const well of wells) {
      const dx = well.x - this.x;
      const dy = well.y - this.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      if (d < 1) continue;
      const pull = well.mass / d2;
      ax += (dx / d) * pull;
      ay += (dy / d) * pull;
    }

    // Linear drag keeps a coasting run from accelerating without bound over a long slingshot.
    ax -= this.vx * SHIP.drag * 4;
    ay -= this.vy * SHIP.drag * 4;

    const brake = input.brake ? 0.985 : 1;
    this.vx = (this.vx + ax * dt) * brake;
    this.vy = (this.vy + ay * dt) * brake;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > SHIP.maxSpeed) {
      const [nx, ny] = norm(this.vx, this.vy);
      this.vx = nx * SHIP.maxSpeed;
      this.vy = ny * SHIP.maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.fuel = clamp(this.fuel, 0, SHIP.fuel);
    this.bank = clamp(this.bank + (ax * 0.00035), -0.4, 0.4);
    this.bank *= 0.96;
  }

  /** A pulse is a one-shot kick along the current heading, paid for in fuel. */
  pulse() {
    if (!this.alive || this.pulses <= 0 || this.fuel < SHIP.pulseCost) return false;
    this.pulses -= 1;
    this.fuel -= SHIP.pulseCost;
    const speed = Math.hypot(this.vx, this.vy);
    const dir = speed < 1 ? [1, 0] : norm(this.vx, this.vy);
    this.vx += dir[0] * SHIP.pulseImpulse;
    this.vy += dir[1] * SHIP.pulseImpulse;
    return true;
  }

  /** Record the trail at a fixed spatial cadence rather than per frame, so it reads the same at any fps. */
  recordTrail(dt) {
    this.trailTick += dt;
    if (this.trailTick < 1 / 60) return;
    this.trailTick = 0;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 150) this.trail.shift();
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }

  /** The well the comet has fallen into, or null. */
  insideWell(wells) {
    for (const well of wells) {
      const horizon = well.horizon + WELL_STYLE.horizonPad;
      if (Math.hypot(well.x - this.x, well.y - this.y) < horizon) return well;
    }
    return null;
  }
}

export { STEP, MAX_STEPS_PER_FRAME };
