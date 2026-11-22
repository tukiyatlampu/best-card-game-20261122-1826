// Ember Court — main.ts
// Program penyerahan (Node 22, stdlib saja): salin game/ dan screenshots/
// dari repo ini ke direktori output, lalu tulis dossier.json memakai
// buildDossier dari vendor/makefun-game.ts (salinan kit, tidak diubah).
// Direktori output: MAKEFUN_OUTPUT_DIR, atau /output di grader.
// Dua run menulis byte yang sama: salinan file + dossier deterministik.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');
if (!existsSync(gameSrc)) throw new Error('main.ts: game/ tidak ditemukan di repo');
if (!existsSync(shotsSrc)) throw new Error('main.ts: screenshots/ tidak ditemukan di repo');

cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Ember Court: dossier ditulis (${dossier.length} byte) ke ${outDir}`);
