// Embers: the collectibles. They drift gently, fade out if ignored, and a pulse
// pulls them in — so flame spent on a pulse earns embers back.

import { EMBER, FLAME, VIEW, COLORS } from './config.js';
import { clamp, dist2, randRange } from './math.js';

export function createEmber(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    life: EMBER.lifetime,
    spin: Math.random() * Math.PI * 2,
    pulled: false,
  };
}

export function spawnEmber(rng, keepAwayFrom) {
  // Keep embers off the walls and away from wherever the player already is,
  // so collecting always means travelling.
  for (let tries = 0; tries < 24; tries++) {
    const x = randRange(rng, 70, VIEW.w - 70);
    const y = randRange(rng, 90, VIEW.h - 70);
    if (keepAwayFrom && dist2(x, y, keepAwayFrom.x, keepAwayFrom.y) < 180 * 180) continue;
    return createEmber(x, y);
  }
  return createEmber(VIEW.w * 0.5, VIEW.h * 0.5);
}

export function updateEmbers(list, moth, dt) {
  for (const e of list) {
    e.life -= dt;
    e.spin += dt * 1.6;

    // A live pulse drags nearby embers toward the moth. The pull is strong at
    // the start of the warmth and tails off, which rewards a well-timed pulse.
    if (moth.pulseWarm > 0) {
      const d2 = dist2(e.x, e.y, moth.pulseX, moth.pulseY);
      if (d2 < FLAME.pulseRadius * FLAME.pulseRadius) {
        const d = Math.sqrt(d2) || 1;
        const strength = (moth.pulseWarm / FLAME.pulseRecover) * 520;
        e.vx += ((moth.pulseX - e.x) / d) * strength * dt;
        e.vy += ((moth.pulseY - e.y) / d) * strength * dt;
        e.pulled = true;
      }
    }

    e.vx *= Math.exp(-3.4 * dt);
    e.vy *= Math.exp(-3.4 * dt);
    e.x = clamp(e.x + e.vx * dt, 20, VIEW.w - 20);
    e.y = clamp(e.y + e.vy * dt, 20, VIEW.h - 20);
  }
  return list.filter((e) => e.life > 0);
}

// Collect what the moth has flown over. Returns how many were taken.
export function collectEmbers(list, moth, radius) {
  let taken = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (dist2(e.x, e.y, moth.x, moth.y) < (radius + EMBER.radius) ** 2) {
      list.splice(i, 1);
      taken++;
    }
  }
  return taken;
}

export function drawEmbers(ctx, list, time) {
  for (const e of list) {
    // Fade the last three seconds, and blink in the final one as a warning.
    const fading = e.life < 3;
    const blink = e.life < 1 && Math.floor(e.life * 8) % 2 === 0;
    if (blink) continue;
    const a = fading ? clamp(e.life / 3, 0, 1) : 1;
    const pulse = 1 + Math.sin(time * 4 + e.spin) * 0.12;

    ctx.globalAlpha = a * 0.28;
    ctx.fillStyle = COLORS.ember;
    ctx.beginPath();
    ctx.arc(e.x, e.y, EMBER.radius * 3.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = a;
    ctx.fillStyle = COLORS.emberHot;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.spin);
    // A four-point spark reads as "pick me up" at a glance.
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      ctx.lineTo(Math.cos(ang) * EMBER.radius * 1.9 * pulse, Math.sin(ang) * EMBER.radius * 0.85 * pulse);
      ctx.lineTo(Math.cos(ang + 0.785) * EMBER.radius * 0.62, Math.sin(ang + 0.785) * EMBER.radius * 0.62);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
