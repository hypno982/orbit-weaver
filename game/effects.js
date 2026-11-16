// Particles and screen shake. Both are cosmetic and both are driven by the sim's events, so nothing here
// can change the outcome of a run.

import { TAU, seeded, rangeOf } from './math.js';

export class Effects {
  constructor() {
    this.particles = [];
    this.shake = 0;
    this.rand = seeded(0xa11ce);
  }

  burst(x, y, count, options = {}) {
    const speed = options.speed ?? 170;
    const life = options.life ?? 0.7;
    const color = options.color ?? '124, 231, 255';
    for (let i = 0; i < count; i += 1) {
      const a = rangeOf(this.rand, 0, TAU);
      const v = rangeOf(this.rand, speed * 0.25, speed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life,
        max: life,
        size: rangeOf(this.rand, 1.2, 3.6),
        color,
      });
    }
  }

  kick(amount) {
    this.shake = Math.max(this.shake, amount);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.965;
      p.vy *= 0.965;
    }
    this.shake = Math.max(0, this.shake - dt * 3.2);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = p.life / p.max;
      ctx.fillStyle = `rgba(${p.color}, ${t * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, TAU);
      ctx.fill();
    }
  }

  /** Offset for this frame's shake, applied by the renderer around the whole scene. */
  offset() {
    if (this.shake <= 0.001) return [0, 0];
    const mag = this.shake * 11;
    return [rangeOf(this.rand, -mag, mag), rangeOf(this.rand, -mag, mag)];
  }

  clear() {
    this.particles.length = 0;
    this.shake = 0;
  }
}
