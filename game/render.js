// The renderer: draws one frame of the current state. It owns no state of its own beyond the star field,
// which is why a screenshot scene can call it directly.

import { VIEW, GATE } from './config.js';
import { drawStars, drawWells } from './scenery.js';
import { drawGate, drawDock } from './gates.js';
import { drawShip, drawTrail } from './comet.js';
import { TAU } from './math.js';

export class Renderer {
  constructor(ctx, stars, effects) {
    this.ctx = ctx;
    this.stars = stars;
    this.effects = effects;
  }

  frame(state, time) {
    const ctx = this.ctx;
    const [ox, oy] = this.effects.offset();

    ctx.save();
    ctx.translate(ox, oy);

    drawStars(ctx, this.stars, time);
    drawWells(ctx, state.wells, time, state.activeWell);

    for (const gate of state.gates) {
      drawGate(ctx, gate, gate === state.nextGate, time);
    }

    drawDock(ctx, state.dock, state.dockOpen, time);
    drawTrail(ctx, state.ship.trail, state.ship.alive);
    this.effects.draw(ctx);

    if (state.ship.alive) drawShip(ctx, state.ship, time);

    // A ring around the gate the comet should be aiming at, so the shot reads as a route.
    if (state.nextGate !== null && state.aimAssist > 0) {
      ctx.globalAlpha = 0.35 * state.aimAssist;
      ctx.strokeStyle = '#8affc1';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 9]);
      ctx.beginPath();
      ctx.moveTo(state.ship.x, state.ship.y);
      ctx.lineTo(state.nextGate.x, state.nextGate.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    this.drawVignette();
  }

  drawVignette() {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.42,
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.86,
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  /** Draw the gate radius hint so a player can judge the opening before they commit. */
  drawGateTarget(ctx, gate) {
    ctx.strokeStyle = 'rgba(138, 255, 193, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, GATE.passWidth, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
