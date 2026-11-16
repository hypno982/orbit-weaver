// Keyboard state. Kept dumb on purpose: it records what is held and never decides anything itself.

const BINDINGS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  up: ['KeyA', 'ArrowLeft'],
  down: ['KeyD', 'ArrowRight'],
  brake: ['ShiftLeft', 'ShiftRight'],
};

export class Controls {
  constructor() {
    this.held = new Set();
    this.pulsePressed = false;
    this.pausePressed = false;
    this.restartPressed = false;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.held.add(event.code);
      if (event.code === 'Space') {
        this.pulsePressed = true;
        event.preventDefault();
      }
      if (event.code === 'KeyP') this.pausePressed = true;
      if (event.code === 'KeyR') this.restartPressed = true;
    });

    window.addEventListener('keyup', (event) => {
      this.held.delete(event.code);
    });

    window.addEventListener('blur', () => {
      this.held.clear();
    });
  }

  pressed(action) {
    const keys = BINDINGS[action];
    for (const key of keys) if (this.held.has(key)) return true;
    return false;
  }

  /** The input vector the ship reads. */
  snapshot() {
    return {
      forward: this.pressed('forward'),
      back: this.pressed('back'),
      up: this.pressed('up'),
      down: this.pressed('down'),
      brake: this.pressed('brake'),
    };
  }

  consumePulse() {
    const hit = this.pulsePressed;
    this.pulsePressed = false;
    return hit;
  }

  consumePause() {
    const hit = this.pausePressed;
    this.pausePressed = false;
    return hit;
  }

  consumeRestart() {
    const hit = this.restartPressed;
    this.restartPressed = false;
    return hit;
  }
}
