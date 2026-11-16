// Keyboard. Raw key state in, a normalised steering vector out; also tracks the
// edge-triggered presses the game needs (pulse, pause, restart, confirm).

const DOWN = new Set();
const EDGE = new Set();

const MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function attachControls(target) {
  target.addEventListener('keydown', (e) => {
    const k = MAP[e.code] || e.code;
    if (!DOWN.has(k)) EDGE.add(k);
    DOWN.add(k);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });
  target.addEventListener('keyup', (e) => {
    DOWN.delete(MAP[e.code] || e.code);
  });
  // A tab switch should not leave a key stuck down.
  target.addEventListener('blur', () => DOWN.clear());
}

export function steering() {
  let x = 0, y = 0;
  if (DOWN.has('left')) x -= 1;
  if (DOWN.has('right')) x += 1;
  if (DOWN.has('up')) y -= 1;
  if (DOWN.has('down')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = Math.SQRT1_2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

// True once per physical press. Call once per frame, after using the result.
export function pressed(name) {
  return EDGE.has(name);
}

export function clearEdges() {
  EDGE.clear();
}

export function anyConfirm() {
  return EDGE.has('Space') || EDGE.has('Enter') || EDGE.has('KeyR');
}
