// The HUD and the overlay screens. Everything the player needs to know at a
// glance lives here: flame, depth, embers, chain, and the full-screen states.

import { VIEW, FLAME, EMBER, COLORS, DEPTHS } from './config.js';
import { clamp } from './math.js';

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

export function drawHud(ctx, state) {
  const m = state.moth;

  // --- Flame meter: the most important number, top-left, wide and obvious ---
  const bx = 28, by = 26, bw = 268, bh = 18;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  roundRect(ctx, bx, by, bw, bh, 9);
  ctx.fill();

  const frac = clamp(m.flame / FLAME.max, 0, 1);
  const low = m.flame <= FLAME.lowWarn;
  const flicker = low ? 0.72 + Math.sin(performance.now() * 0.02) * 0.28 : 1;
  ctx.globalAlpha = flicker;
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, low ? '#ff6a4d' : COLORS.ember);
  grad.addColorStop(1, low ? '#ff9c6a' : COLORS.emberHot);
  ctx.fillStyle = grad;
  roundRect(ctx, bx, by, Math.max(0, bw * frac), bh, 9);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = low ? '#ff6a4d' : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = low ? 2 : 1;
  roundRect(ctx, bx, by, bw, bh, 9);
  ctx.stroke();

  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = low ? '#ffd7cc' : COLORS.dim;
  ctx.textAlign = 'left';
  ctx.fillText('FLAME', bx, by + bh + 16);
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(m.flame)} / ${FLAME.max}`, bx + bw, by + bh + 16);
  if (low) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff9a86';
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText('LOW — gather embers', bx, by + bh + 34);
  }

  // --- Depth and ember progress, top-right ---
  ctx.textAlign = 'right';
  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`DEPTH ${state.depth} / ${DEPTHS}`, VIEW.w - 28, 40);

  ctx.font = `600 12px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('EMBERS', VIEW.w - 28, 60);

  // Ember pips: one per ember wanted, filled as they are gathered.
  const pipY = 72, pipR = 5.5, gap = 17;
  const startX = VIEW.w - 28 - (EMBER.wanted - 1) * gap;
  for (let i = 0; i < EMBER.wanted; i++) {
    const filled = i < state.gathered;
    ctx.beginPath();
    ctx.arc(startX + i * gap, pipY, pipR, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = COLORS.emberHot;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // --- Score and chain, bottom-left ---
  ctx.textAlign = 'left';
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(String(state.score), 28, VIEW.h - 44);

  ctx.font = `600 12px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('SCORE', 28, VIEW.h - 26);

  if (state.chain > 1) {
    const w = Math.min(1, state.chainTimer / 4);
    ctx.textAlign = 'left';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = COLORS.ember;
    ctx.fillText(`CHAIN ×${state.chain}`, 28, VIEW.h - 74);
    ctx.fillStyle = 'rgba(255,176,87,0.25)';
    roundRect(ctx, 28, VIEW.h - 68, 120, 4, 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ember;
    roundRect(ctx, 28, VIEW.h - 68, 120 * w, 4, 2);
    ctx.fill();
  }

  // --- Controls hint, bottom-right, dim so it never competes ---
  ctx.textAlign = 'right';
  ctx.font = `500 12px ${FONT}`;
  ctx.fillStyle = 'rgba(125,144,168,0.75)';
  ctx.fillText('WASD / arrows  move      SPACE  pulse      P  pause      M  mute', VIEW.w - 28, VIEW.h - 26);
}

export function drawTitle(ctx, state) {
  dim(ctx, 0.62);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 68px ${FONT}`;
  ctx.fillText('EMBERWING', VIEW.w / 2, VIEW.h * 0.33);

  ctx.font = `600 19px ${FONT}`;
  ctx.fillStyle = COLORS.ember;
  ctx.fillText('a moth carries the last warm thing through five cold rooms', VIEW.w / 2, VIEW.h * 0.33 + 40);

  // Three rules, stated plainly: the goal, the cost, the escape.
  const lines = [
    ['Gather every ember', 'the rift stays sealed until you do'],
    ['Flame is your life', 'it burns down; embers refill it'],
    ['Pulse costs flame', 'but it pulls embers in and shoves the cold away'],
  ];
  lines.forEach(([head, sub], i) => {
    const y = VIEW.h * 0.50 + i * 52;
    ctx.textAlign = 'center';
    ctx.font = `700 17px ${FONT}`;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(head, VIEW.w / 2, y);
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(sub, VIEW.w / 2, y + 20);
  });

  const blink = 0.55 + Math.sin(performance.now() * 0.005) * 0.45;
  ctx.globalAlpha = blink;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = COLORS.emberHot;
  ctx.fillText('PRESS  SPACE  TO  FLY', VIEW.w / 2, VIEW.h * 0.86);
  ctx.globalAlpha = 1;

  ctx.font = `500 12px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('WASD or arrow keys to fly   ·   M to mute', VIEW.w / 2, VIEW.h * 0.92);
}

export function drawDepthCard(ctx, state, t) {
  // A short card between rooms: names the depth and the new threat.
  const a = Math.min(1, t * 2.2) * Math.min(1, (1.9 - t) * 2.2);
  if (a <= 0) return;
  ctx.globalAlpha = a;
  dim(ctx, 0.42);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(`DEPTH ${state.depth}`, VIEW.w / 2, VIEW.h * 0.46);

  ctx.font = `600 17px ${FONT}`;
  ctx.fillStyle = COLORS.ember;
  ctx.fillText(state.cardNote || '', VIEW.w / 2, VIEW.h * 0.46 + 34);

  ctx.font = `500 14px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`${EMBER.wanted} embers to open the rift`, VIEW.w / 2, VIEW.h * 0.46 + 62);
  ctx.globalAlpha = 1;
}

export function drawPause(ctx) {
  dim(ctx, 0.7);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText('PAUSED', VIEW.w / 2, VIEW.h * 0.45);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('P to resume', VIEW.w / 2, VIEW.h * 0.45 + 36);
}

export function drawGameOver(ctx, state) {
  dim(ctx, 0.72);
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.hazard;
  ctx.font = `800 54px ${FONT}`;
  ctx.fillText('THE EMBER WENT OUT', VIEW.w / 2, VIEW.h * 0.34);

  ctx.font = `600 17px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`Your flame failed in depth ${state.depth}`, VIEW.w / 2, VIEW.h * 0.34 + 34);

  ctx.font = `800 44px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(String(state.score), VIEW.w / 2, VIEW.h * 0.55);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('FINAL SCORE', VIEW.w / 2, VIEW.h * 0.55 + 24);

  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`best chain ×${state.bestChain}    embers ${state.totalEmbers}`, VIEW.w / 2, VIEW.h * 0.68);

  const blink = 0.55 + Math.sin(performance.now() * 0.005) * 0.45;
  ctx.globalAlpha = blink;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = COLORS.emberHot;
  ctx.fillText('PRESS  SPACE  TO  FLY AGAIN', VIEW.w / 2, VIEW.h * 0.84);
  ctx.globalAlpha = 1;
}

export function drawWin(ctx, state) {
  dim(ctx, 0.74);
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.rift;
  ctx.font = `800 56px ${FONT}`;
  ctx.fillText('DAWN', VIEW.w / 2, VIEW.h * 0.30);

  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText('You carried the ember through all five rooms.', VIEW.w / 2, VIEW.h * 0.30 + 36);

  ctx.font = `800 52px ${FONT}`;
  ctx.fillStyle = COLORS.emberHot;
  ctx.fillText(String(state.score), VIEW.w / 2, VIEW.h * 0.52);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('FINAL SCORE', VIEW.w / 2, VIEW.h * 0.52 + 26);

  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`best chain ×${state.bestChain}    embers ${state.totalEmbers}`, VIEW.w / 2, VIEW.h * 0.65);
  ctx.fillText(`flame left ${Math.ceil(state.moth.flame)}`, VIEW.w / 2, VIEW.h * 0.65 + 24);

  const blink = 0.55 + Math.sin(performance.now() * 0.005) * 0.45;
  ctx.globalAlpha = blink;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = COLORS.rift;
  ctx.fillText('PRESS  SPACE  TO  FLY AGAIN', VIEW.w / 2, VIEW.h * 0.84);
  ctx.globalAlpha = 1;
}

function dim(ctx, a) {
  ctx.fillStyle = `rgba(6,12,20,${a})`;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
