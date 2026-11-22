// Ember Court — shots.js
// Preset screenshot deterministik via ?shot=...&seed=... :
//   title = layar judul (cover) · table = meja live di tengah duel
//   win = layar menang · loss = layar kalah
// Dipakai headless Chromium untuk mengambil 4 screenshot 1280x800.
// Bukan gameplay: hanya menyiapkan keadaan lalu membiarkan render jalan.

import { createGame, playCard } from './state.js';
import { MODES } from './config.js';

// Mainkan n ronde otomatis dengan kartu pertama tangan (deterministik).
function autoPlay(game, rounds) {
  for (let i = 0; i < rounds && game.phase === 'play'; i++) {
    playCard(game, 0);
  }
}

// Paksa akhir duel: set nyawa lalu biarkan checkEnd bekerja via ronde.
function forceEnd(game, winner) {
  if (winner === 'mine') {
    game.ai.hp = 0;
    game.phase = 'over';
    game.winner = 'mine';
    game.log.push(`R${game.round} · Kemenangan! ${game.mode.aiName} tumbang di ronde ${game.round}.`);
  } else {
    game.player.hp = 0;
    game.phase = 'over';
    game.winner = 'foe';
    game.log.push(`R${game.round} · ${game.mode.aiName} memenangkan duel di ronde ${game.round}.`);
  }
  game.stats.roundsPlayed = Math.max(game.stats.roundsPlayed, 6);
}

// Bangun keadaan game untuk preset yang diminta. Kembalikan { game, title }.
// title = true berarti layar judul tetap tampil (bukan meja).
export function applyShot(shot, seed) {
  const modeId = shot === 'loss' ? 'topeng' : shot === 'win' ? 'berburu' : 'tembok';
  const mode = MODES[modeId];
  if (shot === 'title') {
    const game = createGame('berburu', seed);
    return { game, title: true };
  }
  if (shot === 'table') {
    const game = createGame(modeId, seed);
    autoPlay(game, 4);
    // Satu ronde sedang terbuka: AI sudah memilih, pemain tinggal main.
    return { game, title: false };
  }
  if (shot === 'win') {
    const game = createGame(modeId, seed);
    autoPlay(game, 5);
    game.stats.resonanceHits = 2;
    forceEnd(game, 'mine');
    return { game, title: false };
  }
  // loss
  const game = createGame(modeId, seed);
  autoPlay(game, 5);
  forceEnd(game, 'foe');
  return { game, title: false };
}
