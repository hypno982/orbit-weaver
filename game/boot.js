// Boot: find the canvas, build the game, start the loop. Kept separate from
// main.js so the run's state machine has no DOM assumptions baked in.

import { createGame } from './main.js';

const canvas = document.getElementById('stage');
const game = createGame(canvas);
game.start();

// The screenshot harness drives the game through this handle; nothing in the
// game itself reads it, so play is unaffected.
window.__emberwing = game;
