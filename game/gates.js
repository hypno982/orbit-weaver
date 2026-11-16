// Gates and the dock. A gate is a ring the comet has to thread; the dock is where a system ends.

import { GATE } from './config.js';
import { TAU, pointSegment } from './math.js';

export class Gate {
  constructor(spec, index) {
    this.x = spec.x;
    this.y = spec.y;
    this.index = index;
    this.cleared = false;
    this.flash = 0;
  }

  /**
   * Whether this frame's movement crossed the gate. A crossing is a segment test, not a radius test,
   * so a fast comet cannot tunnel through the ring between two frames.
   */
  crossed(prevX, prevY, x, y) {
    if (this.cleared) return false;
    const hit = pointSegment(this.x, this.y, prevX, prevY, x, y) <= GATE.passWidth;
    if (hit) {
      this.cleared = true;
      this.flash = 1;
    }
    return hit;
  }

  tick(dt) {
    this.flash = Math.max(0, this.flash - dt * 2.6);
  }
}

export function drawGate(ctx, gate, isNext, time) {
  const pulse = 1 + Math.sin(time * 3 + gate.index) * 0.05;
  const r = GATE.radius * pulse;
  const glow = gate.flash;

  if (gate.cleared) {
    ctx.globalAlpha = 0.28 + glow * 0.6;
    ctx.strokeStyle = '#4f6f95';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, r * 0.82, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  const ring = ctx.createRadialGradient(gate.x, gate.y, r * 0.55, gate.x, gate.y, r * 1.7);
  ring.addColorStop(0, 'rgba(138, 255, 193, 0)');
  ring.addColorStop(0.55, isNext ? 'rgba(138, 255, 193, 0.3)' : 'rgba(138, 255, 193, 0.1)');
  ring.addColorStop(1, 'rgba(138, 255, 193, 0)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(gate.x, gate.y, r * 1.7, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = isNext ? '#8affc1' : 'rgba(138, 255, 193, 0.45)';
  ctx.lineWidth = isNext ? 3.4 : 2;
  ctx.beginPath();
  ctx.arc(gate.x, gate.y, r, 0, TAU);
  ctx.stroke();

  // Four ticks so the opening is legible at a glance in a shrunk screenshot.
  ctx.strokeStyle = isNext ? '#d6ffe8' : 'rgba(214, 255, 232, 0.5)';
  ctx.lineWidth = isNext ? 3 : 1.6;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(gate.x + Math.cos(a) * (r - 7), gate.y + Math.sin(a) * (r - 7));
    ctx.lineTo(gate.x + Math.cos(a) * (r + 7), gate.y + Math.sin(a) * (r + 7));
    ctx.stroke();
  }
}

export function drawDock(ctx, dock, open, time) {
  if (!open) {
    ctx.globalAlpha = 0.25;
  }
  const pulse = 1 + Math.sin(time * 2.4) * 0.06;
  const r = 30 * pulse;
  ctx.strokeStyle = open ? '#ffcf6b' : 'rgba(255, 207, 107, 0.5)';
  ctx.lineWidth = open ? 3 : 1.6;
  ctx.beginPath();
  ctx.arc(dock.x, dock.y, r, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(dock.x, dock.y, r * 0.45, 0, TAU);
  ctx.stroke();

  ctx.strokeStyle = open ? '#fff1cf' : 'rgba(255, 241, 207, 0.5)';
  ctx.lineWidth = open ? 2.4 : 1.2;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU + Math.PI / 4 + time * 0.6;
    ctx.beginPath();
    ctx.moveTo(dock.x + Math.cos(a) * (r + 4), dock.y + Math.sin(a) * (r + 4));
    ctx.lineTo(dock.x + Math.cos(a) * (r + 13), dock.y + Math.sin(a) * (r + 13));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
