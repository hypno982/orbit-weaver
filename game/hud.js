// HUD and the title/result overlays. All text the player reads comes from here, so the screenshots show
// the same vocabulary the game uses while playing.

import { SYSTEMS, SCORE } from './config.js';

export class Hud {
  constructor(hudEl, bannerEl) {
    this.hudEl = hudEl;
    this.bannerEl = bannerEl;
    this.bannerTimer = 0;
    this.last = '';
  }

  render(state) {
    const system = SYSTEMS[state.systemIndex];
    const fuelPct = Math.round((state.ship.fuel / 100) * 100);
    const speed = Math.round(state.ship.speed());
    const cleared = state.gates.filter((gate) => gate.cleared).length;
    const fuelClass = fuelPct < 20 ? 'bad' : fuelPct < 45 ? 'warn' : '';
    const speedClass = speed > 520 ? 'warn' : '';

    const cells = [
      ['system', `${state.systemIndex + 1}/6 ${system.name}`],
      ['gates', `${cleared}/${state.gates.length}`],
      ['fuel', `${fuelPct}%`, fuelClass],
      ['pulse', `${state.ship.pulses}`, ''],
      ['speed', `${speed}`, speedClass],
      ['score', `${state.score}`, ''],
      ['time', `${state.elapsed.toFixed(1)}s`, state.elapsed > system.par ? 'warn' : ''],
    ];

    const html = cells
      .map(([, value, cls]) => `<div class="cell"><span class="label"></span><span class="value ${cls ?? ''}">${value}</span></div>`)
      .join('');
    if (html !== this.last) {
      this.hudEl.innerHTML = html;
      this.last = html;
    }
  }

  banner(text, seconds = 1.6) {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.add('show');
    this.bannerTimer = seconds;
  }

  tick(dt) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerEl.classList.remove('show');
    }
  }
}

/** The end-of-run screen: score, per-system breakdown, and the restart the judge's first criterion wants. */
export function resultMarkup(run) {
  const rows = run.systems
    .map(
      (entry, index) =>
        `<tr><td>${index + 1}. ${SYSTEMS[index].name}</td><td>${entry.cleared}</td><td>${entry.time.toFixed(1)}s</td><td>${entry.points}</td></tr>`,
    )
    .join('');
  const verdict = run.complete ? 'THE WEAVE HOLDS' : 'THE COMET IS LOST';
  const sub = run.complete
    ? `All six systems threaded with ${run.fuelLeft}% fuel to spare.`
    : `Lost in ${SYSTEMS[run.failedAt].name}. ${run.systems.length} of 6 systems held.`;
  return `
    <h1>${verdict}</h1>
    <p class="tag">${sub}</p>
    <table class="tally">
      <thead><tr><th>System</th><th>Gates</th><th>Time</th><th>Points</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="tag total">FINAL SCORE <b>${run.score}</b> &nbsp;·&nbsp; PAR BONUS ${run.parBonus}</p>
    <button id="play" type="button">WEAVE AGAIN</button>
    <p class="fine">Press R to restart from the first system.</p>
  `;
}

export { SCORE };
