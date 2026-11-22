// Ember Court — state.js
// Keadaan duel dan alurnya: mulai, mainkan kartu, buang-tarik, misi,
// jurnal, dan kondisi menang/kalah. Logika murni — tanpa DOM.

import {
  START_HP,
  HAND_SIZE,
  MODES,
  NEAR_MISS_HP,
} from './config.js';
import { makeRng } from './random.js';
import { freshDrawPile, drawCards, cardLabel } from './deck.js';
import { resolveRound, isNearMiss } from './rules.js';
import { chooseCard } from './ai.js';

// Satu duelist: nyawa, tangan, tumpukan, skor, dan jejak kemenangan.
export function makeDuelist(rng) {
  const pile = freshDrawPile(rng);
  const discard = [];
  const hand = drawCards(pile, discard, HAND_SIZE, rng);
  return { hp: START_HP, hand, pile, discard, roundsWon: 0, streakSigil: null, streakCount: 0 };
}

// Buat duel baru untuk mode dan seed tertentu.
export function createGame(modeId, seed) {
  const mode = MODES[modeId] || MODES.berburu;
  const rng = makeRng(seed);
  const game = {
    mode,
    seed,
    rng,
    round: 1,
    phase: 'play',
    player: makeDuelist(rng),
    ai: makeDuelist(rng),
    aiCard: null,
    lastOutcome: null,
    prevRound: { winner: null, sigil: null },
    discardUsed: false,
    discardArmed: false,
    winner: null,
    log: [],
    mission: { count: 0, done: false },
    nearMiss: null,
    stats: { roundsPlayed: 0, resonanceHits: 0, clashes: 0, blocks: 0 },
  };
  addLog(game, `Duel dimulai — ${mode.name}. ${mode.aiName} menantangmu. Misi: ${mode.mission}.`);
  return game;
}

export function addLog(game, text) {
  game.log.push(`R${game.round} · ${text}`);
  if (game.log.length > 40) game.log.splice(0, game.log.length - 40);
}

// Kemajuan misi mode ini dari hasil ronde.
export function trackMission(game, outcome) {
  const goal = game.mode.missionGoal;
  if (game.mission.done) return;
  if (game.mode.id === 'berburu' && outcome.winner === 'mine' && outcome.mineSigil === 'api') {
    game.mission.count += 1;
  }
  if (game.mode.id === 'tembok' && outcome.blocked === 'foe') {
    game.mission.count += 1;
  }
  if (game.mode.id === 'topeng' && outcome.winner === 'mine' && outcome.mineSigil === 'liar') {
    game.mission.count += 1;
  }
  if (game.mission.count >= goal) {
    game.mission.done = true;
    addLog(game, `Misi selesai: ${game.mode.mission}!`);
  }
}

// AI memilih kartunya untuk ronde ini (disimpan tertutup sampai reveal).
export function aiPickCard(game) {
  const card = chooseCard(game.ai.hand, game.mode.aiPersonality, { hp: game.ai.hp }, game.rng);
  game.aiCard = card;
  return card;
}

// Mainkan kartu pemain dari tangan (index 0-4). Kembalikan outcome ronde.
export function playCard(game, handIndex) {
  if (game.phase !== 'play') return null;
  if (handIndex < 0 || handIndex >= game.player.hand.length) return null;
  if (!game.aiCard) aiPickCard(game);
  const mine = game.player.hand.splice(handIndex, 1)[0];
  const foe = game.aiCard;
  const aiIndex = game.ai.hand.findIndex((c) => c.id === foe.id);
  if (aiIndex >= 0) game.ai.hand.splice(aiIndex, 1);
  game.aiCard = null;

  const outcome = resolveRound(mine, foe, game.prevRound);
  outcome.mineCard = mine;
  outcome.foeCard = foe;
  game.lastOutcome = outcome;
  game.stats.roundsPlayed += 1;
  if (outcome.resonance) game.stats.resonanceHits += 1;
  if (outcome.clash) game.stats.clashes += 1;
  if (outcome.blocked) game.stats.blocks += 1;

  applyOutcome(game, outcome);
  trackMission(game, outcome);
  // Ringkasan pendek untuk jurnal (tetap 1-2 baris per ronde).
  let short;
  if (outcome.kind === 'clash') short = 'Bentrok, −2 keduanya';
  else if (outcome.kind === 'blocked') short = 'Perisai menahan, +2 nyawa';
  else short = `${outcome.winner === 'mine' ? 'Menang' : 'Kalah'}, luka ${outcome.damage}${outcome.resonance ? ' · Resonansi!' : ''}`;
  addLog(game, `Kamu ${cardLabel(mine)} vs ${cardLabel(foe)} — ${short}`);

  // Tarik pengganti untuk kedua pihak, lalu ronde berikutnya.
  game.player.hand.push(...drawCards(game.player.pile, game.player.discard, 1, game.rng));
  game.ai.hand.push(...drawCards(game.ai.pile, game.ai.discard, 1, game.rng));
  game.player.discard.push(mine);
  game.ai.discard.push(foe);
  game.discardUsed = false;
  game.discardArmed = false;

  checkEnd(game);
  if (game.phase === 'play') game.round += 1;
  return outcome;
}

// Terapkan luka / pulih / skor dari outcome ke kedua duelist.
export function applyOutcome(game, outcome) {
  const me = game.player;
  const foe = game.ai;
  if (outcome.kind === 'blocked') {
    if (outcome.blocked === 'mine') me.hp = Math.min(START_HP, me.hp + outcome.heal);
    else if (outcome.blocked === 'foe') foe.hp = Math.min(START_HP, foe.hp + outcome.heal);
    else {
      me.hp = Math.min(START_HP, me.hp + outcome.heal);
      foe.hp = Math.min(START_HP, foe.hp + outcome.heal);
    }
    game.prevRound = { winner: null, sigil: null };
    me.streakSigil = null; me.streakCount = 0;
    foe.streakSigil = null; foe.streakCount = 0;
  } else if (outcome.kind === 'clash') {
    me.hp -= outcome.damage;
    foe.hp -= outcome.damage;
    game.prevRound = { winner: null, sigil: null };
    me.streakSigil = null; me.streakCount = 0;
    foe.streakSigil = null; foe.streakCount = 0;
  } else if (outcome.winner === 'mine') {
    foe.hp -= outcome.damage;
    me.roundsWon += 1;
    if (me.streakSigil === outcome.mineSigil) me.streakCount += 1;
    else { me.streakSigil = outcome.mineSigil; me.streakCount = 1; }
    foe.streakSigil = null; foe.streakCount = 0;
    game.prevRound = { winner: 'mine', sigil: outcome.mineSigil };
  } else {
    me.hp -= outcome.damage;
    foe.roundsWon += 1;
    if (foe.streakSigil === outcome.foeSigil) foe.streakCount += 1;
    else { foe.streakSigil = outcome.foeSigil; foe.streakCount = 1; }
    me.streakSigil = null; me.streakCount = 0;
    game.prevRound = { winner: 'foe', sigil: outcome.foeSigil };
  }

  // Near Miss: korban tersisa <= 5 nyawa.
  game.nearMiss = null;
  if (isNearMiss(foe.hp) && outcome.winner === 'mine') game.nearMiss = 'foe';
  if (isNearMiss(me.hp) && outcome.winner === 'foe') game.nearMiss = 'mine';
  if (outcome.kind === 'clash') {
    if (isNearMiss(me.hp)) game.nearMiss = 'mine';
    else if (isNearMiss(foe.hp)) game.nearMiss = 'foe';
  }
}

// Buang 1 kartu dari tangan dan tarik 1 baru. Sekali per ronde.
export function discardDraw(game, handIndex) {
  if (game.phase !== 'play') return { ok: false, reason: 'Duel tidak sedang berjalan.' };
  if (game.discardUsed) return { ok: false, reason: 'Buang-tarik sudah dipakai ronde ini.' };
  if (handIndex < 0 || handIndex >= game.player.hand.length) return { ok: false, reason: 'Kartu tidak ada.' };
  const old = game.player.hand.splice(handIndex, 1)[0];
  game.player.discard.push(old);
  const fresh = drawCards(game.player.pile, game.player.discard, 1, game.rng);
  game.player.hand.push(...fresh);
  game.discardUsed = true;
  game.discardArmed = false;
  addLog(game, `Kamu membuang ${cardLabel(old)} dan menarik kartu baru.`);
  return { ok: true, discarded: old };
}

// Cek akhir duel: nyawa habis berarti kalah/menang.
export function checkEnd(game) {
  if (game.player.hp <= 0 && game.ai.hp <= 0) {
    game.phase = 'over';
    game.winner = 'draw';
    addLog(game, 'Dua-duanya tumbang — duel berakhir seri.');
  } else if (game.ai.hp <= 0) {
    game.phase = 'over';
    game.winner = 'mine';
    addLog(game, `Kemenangan! ${game.mode.aiName} tumbang di ronde ${game.round}.`);
  } else if (game.player.hp <= 0) {
    game.phase = 'over';
    game.winner = 'foe';
    addLog(game, `${game.mode.aiName} memenangkan duel di ronde ${game.round}.`);
  }
}

// Ringkasan akhir untuk layar menang/kalah.
export function endSummary(game) {
  return {
    winner: game.winner,
    rounds: game.stats.roundsPlayed,
    resonanceHits: game.stats.resonanceHits,
    clashes: game.stats.clashes,
    blocks: game.stats.blocks,
    playerHp: Math.max(0, game.player.hp),
    aiHp: Math.max(0, game.ai.hp),
    missionDone: game.mission.done,
  };
}

// Sisa nyawa korban untuk Near Miss (dipakai render).
export function nearMissTarget(game) {
  return game.nearMiss;
}
export { NEAR_MISS_HP };
