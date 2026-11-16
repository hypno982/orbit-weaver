// The comet: trail, body, engine flare. Reads ship state, never writes it.

import { SHIP } from './config.js';
import { TAU, norm } from './math.js';

export function drawTrail(ctx, trail, alive) {
  if (trail.length < 2) return;
  for (let i = 1; i < trail.length; i += 1) {
    const t = i / trail.length;
    const a = trail[i - 1];
    const b = trail[i];
    ctx.strokeStyle = alive
      ? `rgba(124, 231, 255, ${0.06 + t * 0.5})`
      : `rgba(255, 95, 109, ${0.04 + t * 0.3})`;
    ctx.lineWidth = 1 + t * 3.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

export function drawShip(ctx, ship, time) {
  const speed = ship.speed();
  const heading = speed > 6 ? norm(ship.vx, ship.vy) : [1, 0];

  // Engine flare, drawn before the body so the hull stays crisp.
  if (ship.alive && ship.throttle > 0.05) {
    const flare = 14 + ship.throttle * 22 + Math.sin(time * 30) * 3;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(-heading[1], -heading[0]));
    const grad = ctx.createLinearGradient(0, 0, flare, 0);
    grad.addColorStop(0, 'rgba(255, 207, 107, 0.85)');
    grad.addColorStop(0.45, 'rgba(255, 122, 74, 0.4)');
    grad.addColorStop(1, 'rgba(255, 122, 74, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.lineTo(flare, 0);
    ctx.lineTo(0, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Halo.
  const halo = ctx.createRadialGradient(ship.x, ship.y, 1, ship.x, ship.y, SHIP.radius * 3.4);
  halo.addColorStop(0, ship.alive ? 'rgba(124, 231, 255, 0.55)' : 'rgba(255, 95, 109, 0.5)');
  halo.addColorStop(1, 'rgba(124, 231, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, SHIP.radius * 3.4, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(Math.atan2(heading[1], heading[0]));
  ctx.fillStyle = ship.alive ? '#eaf9ff' : '#ff9aa2';
  ctx.beginPath();
  ctx.moveTo(SHIP.radius + 5, 0);
  ctx.lineTo(-SHIP.radius * 0.75, -SHIP.radius * 0.72);
  ctx.lineTo(-SHIP.radius * 0.3, 0);
  ctx.lineTo(-SHIP.radius * 0.75, SHIP.radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
