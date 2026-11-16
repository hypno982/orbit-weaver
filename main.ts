// Emberwing's hand-in program. Node 22, standard library only: it copies the
// game's files and its screenshots into the output directory and writes the
// dossier the judge reads, using the kit's own buildDossier so the bytes match
// what the gate rebuilds.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts      (outside the grader)
//   node main.ts                             (the grader, /output)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// buildDossier's own limits, as the scorer passes them. Kept here so a game
// that grew too large fails loudly on our side instead of at the gate.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyDir(from, to) {
  if (!existsSync(from)) return 0;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return 1;
}

function countFiles(dir) {
  let n = 0, bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFiles(full);
      n += sub.n;
      bytes += sub.bytes;
    } else {
      n += 1;
      bytes += statSync(full).size;
    }
  }
  return { n, bytes };
}

function main() {
  mkdirSync(OUT, { recursive: true });

  // game/ is the entry; screenshots/ are the only pictures the judge sees.
  copyDir(join(ROOT, 'game'), join(OUT, 'game'));
  copyDir(join(ROOT, 'screenshots'), join(OUT, 'screenshots'));

  const game = countFiles(join(OUT, 'game'));
  if (game.n > CAPS.game_max_files) {
    throw new Error(`game/ holds ${game.n} entries, over the ${CAPS.game_max_files} allowed`);
  }
  if (game.bytes > CAPS.game_max_bytes) {
    throw new Error(`game/ is ${game.bytes} bytes, over the ${CAPS.game_max_bytes} allowed`);
  }

  // The judge sees the game only through these pictures, so refuse to hand in a
  // run with the wrong number of them rather than let the gate reject it later.
  const shotsDir = join(OUT, 'screenshots');
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((n) => !n.startsWith('.') && /\.(png|jpe?g)$/i.test(n))
    : [];
  if (shots.length < 3 || shots.length > CAPS.screenshots.max) {
    throw new Error(`screenshots/ holds ${shots.length} images, need 3 to ${CAPS.screenshots.max}`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > CAPS.screenshots.max_bytes) {
      throw new Error(`screenshots/${name} is ${size} bytes, over the ${CAPS.screenshots.max_bytes} allowed`);
    }
  }

  // The dossier must be the bytes buildDossier writes from what is on disk.
  const dossier = buildDossier(OUT, CAPS);
  writeFileSync(join(OUT, 'dossier.json'), dossier);

  process.stdout.write(
    `emberwing: ${game.n} files, ${game.bytes} bytes, ${shots.length} shots, dossier ${Buffer.byteLength(dossier)} bytes\n`,
  );
}

main();
