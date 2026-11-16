import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Hands the game in: game/ and screenshots/ go to /output beside the dossier the judge reads.
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.
const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });

const shots = join(out, 'screenshots');
mkdirSync(shots, { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), shots, { recursive: true });
}

// The scorer's caps, read from reference/gate.json: text_max_bytes is the only one that shapes the bytes,
// the rest refuse here what the scorer would refuse there.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
