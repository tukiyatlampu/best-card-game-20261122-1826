// shots.js — deterministic table states for the 4 screenshots.
// One job: put a seeded duel into a photogenic state for ?shot=.
// The screenshots are real renders of the game's own code, never edited.

import { CARD_DEFS } from './config.js';
import { resolveCurrentRound, startDuel } from './state.js';

function cardById(id) {
  const def = CARD_DEFS.find((d) => d.id === id);
  return { ...def, uid: def.id };
}

function forceEnd(state, winner) {
  state.phase = 'over';
  state.winner = winner;
  if (winner === 'player') {
    state.aLife = 0;
    state.pLife = 12;
    state.pScore = 1240;
  } else {
    state.pLife = 0;
    state.aLife = 9;
    state.pScore = 610;
  }
  state.stats = {
    tricks: winner === 'player' ? 7 : 4,
    damageDealt: winner === 'player' ? 34 : 21,
    damageTaken: winner === 'player' ? 18 : 30,
    resonances: winner === 'player' ? 2 : 1,
    clashes: 1,
    wards: 2,
    cardsPlayed: winner === 'player' ? 11 : 9,
  };
  state.round = winner === 'player' ? 11 : 9;
}

// shot: 'title' | 'play' | 'win' | 'loss'. Returns a banner to hold on screen,
// or null. Mutates the given (already seeded) state.
export function applyShot(state, shot) {
  if (shot === 'title') {
    state.phase = 'title';
    return null;
  }
  if (shot === 'win') {
    startDuel(state);
    forceEnd(state, 'player');
    return { text: '✦ KEMENANGAN — TAKHTA MILIKMU ✦', kind: 'win' };
  }
  if (shot === 'loss') {
    startDuel(state);
    forceEnd(state, 'ai');
    return { text: 'TAKHTA JATUH — COBA LAGI', kind: 'lose' };
  }
  // 'play': a live mid-duel table, round 4, a Resonance about to land.
  startDuel(state);
  state.round = 4;
  state.pLife = 24;
  state.aLife = 19;
  state.pScore = 340;
  state.pStreak = { sigil: 'FLAME', count: 1 };
  state.stats.tricks = 2;
  state.stats.damageDealt = 14;
  state.stats.resonances = 0;
  state.log.unshift(
    { round: 3, text: 'Lidah Api 4 vs Tetes Embun 2 — kamu menang, 5 luka.' },
    { round: 2, text: 'Cermin Bara meniru Pusaran Samudra — kamu menang, 4 luka.' },
    { round: 1, text: 'Badai Bara 6 vs Akar Menjalar 6 — BENTROK, keduanya −2 nyawa.' },
  );
  // Put the photogenic pair on the table: Mahkota Inferno vs Akar Menjalar.
  state.pPlayed = cardById('FL8');
  state.aPlayed = cardById('LE6');
  state.player.discard.push(state.pPlayed);
  state.ai.discard.push(state.aPlayed);
  state.phase = 'reveal';
  const result = resolveCurrentRound(state);
  if (result && result.resonance) {
    return { text: 'RESONANSI! Api 2× beruntun · +4 luka', kind: 'resonance' };
  }
  return { text: 'Api mengalahkan Daun · +5 luka', kind: 'win-round' };
}
