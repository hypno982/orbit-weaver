// Particles and screen shake. Every action gets a visible answer: a pulse rings,
// a collected ember bursts, a hit throws sparks, a death scatters the moth.

import { COLORS } from './config.js';

const parts = [];
let shakeAmt = 0;
let shakeT = 0;

export function clearEffects() {
  parts.length = 0;
  shakeAmt = 0;
  shakeT = 0;
}

export function burst(x, y, count, color, speed, life) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = speed * (0.35 + Math.random() * 0.85);
    parts.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: life * (0.6 + Math.random() * 0.7),
      max: life,
      r: 1.6 + Math.random() * 2.4,
      color: color || COLORS.ember,
    });
  }
}

export function ring(x, y, color) {
  parts.push({ x, y, vx: 0, vy: 0, life: 0.5, max: 0.5, r: 0, color: color || COLORS.ember, ring: true });
}

export function shake(amount, time) {
  shakeAmt = Math.max(shakeAmt, amount);
  shakeT = Math.max(shakeT, time);
}

export function shakeOffset() {
  if (shakeT <= 0) return { x: 0, y: 0 };
  const a = shakeAmt * (shakeT / 0.3);
  return { x: (Math.random() - 0.5) * a * 2, y: (Math.random() - 0.5) * a * 2 };
}

export function updateEffects(dt) {
  if (shakeT > 0) {
    shakeT = Math.max(0, shakeT - dt);
    if (shakeT === 0) shakeAmt = 0;
  }
  for (const p of parts) {
    p.life -= dt;
    if (p.ring) {
      p.r += 420 * dt;
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-1.8 * dt);
      p.vy *= Math.exp(-1.8 * dt);
      p.vy += 60 * dt; // a touch of gravity so sparks arc
    }
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].life <= 0) parts.splice(i, 1);
  }
}

export function drawEffects(ctx) {
  for (const p of parts) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    if (p.ring) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * a + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
