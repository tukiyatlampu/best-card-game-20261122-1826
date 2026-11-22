// state.js — the duel's state and its transitions. Pure data, no DOM, no timers.
// One job: hold the table and move it from one phase to the next.

import { HAND_SIZE, MODES, START_LIFE } from './config.js';
import { draw, newPlayerDeck, recycleDiscard } from './deck.js';
import { chooseCard } from './ai.js';
import { resolveRound, roundScore } from './rules.js';

export const PHASES = ['title', 'pick', 'ai-think', 'reveal', 'resolve', 'over'];

// A fresh duel in the given mode. rng drives every shuffle and AI jitter.
export function createGame(modeId, rng) {
  const mode = MODES[modeId] || MODES.ember;
  const player = newPlayerDeck(rng);
  const ai = newPlayerDeck(rng);
  return {
    mode,
    rng,
    phase: 'title',
    round: 1,
    pLife: START_LIFE,
    aLife: START_LIFE,
    pScore: 0,
    pPlayed: null,
    aPlayed: null,
    pStreak: { sigil: null, count: 0 },
    aStreak: { sigil: null, count: 0 },
    pLastCard: null,
    aLastCard: null,
    discardUsed: false,
    discardMode: false,
    winner: null,
    lastResult: null,
    player,
    ai,
    stats: { tricks: 0, damageDealt: 0, damageTaken: 0, resonances: 0, clashes: 0, wards: 0, cardsPlayed: 0 },
    log: [],
  };
}

export function startDuel(state) {
  state.phase = 'pick';
  pushLog(state, `Ronde 1 — duel melawan ${state.mode.foeName} dimulai.`);
}

function pushLog(state, text) {
  state.log.unshift({ round: state.round, text });
  if (state.log.length > 7) state.log.length = 7;
}

// The player puts one hand card on the table. Returns false if the move is illegal.
export function playPlayerCard(state, handIndex) {
  if (state.phase !== 'pick') return false;
  if (handIndex < 0 || handIndex >= state.player.hand.length) return false;
  const [card] = state.player.hand.splice(handIndex, 1);
  state.player.discard.push(card);
  state.pPlayed = card;
  state.stats.cardsPlayed += 1;
  state.phase = 'ai-think';
  return true;
}

// The rival answers. Picks, plays, and moves the duel to the reveal.
export function aiPlayCard(state) {
  if (state.phase !== 'ai-think') return false;
  const idx = chooseCard(state.ai.hand, {
    personality: state.mode.personality,
    aiLife: state.aLife,
    playerLife: state.pLife,
    playerLastCard: state.pLastCard,
    playerStreak: state.pStreak,
    round: state.round,
  }, state.rng);
  const [card] = state.ai.hand.splice(idx, 1);
  state.ai.discard.push(card);
  state.aPlayed = card;
  state.phase = 'reveal';
  return true;
}

// Settle the two cards on the table. Applies life, streaks, score and stats.
export function resolveCurrentRound(state) {
  if (state.phase !== 'reveal' || !state.pPlayed || !state.aPlayed) return null;
  const result = resolveRound(
    state.pPlayed, state.aPlayed,
    state.pLife, state.aLife,
    state.pStreak, state.aStreak,
  );
  state.pLife = result.pLife;
  state.aLife = result.aLife;
  state.pStreak = result.pStreak;
  state.aStreak = result.aStreak;
  state.lastResult = result;
  state.pLastCard = state.pPlayed;
  state.aLastCard = state.aPlayed;
  state.pScore += roundScore(result);
  if (result.winner === 'player') {
    state.stats.tricks += 1;
    state.stats.damageDealt += result.damage;
  }
  if (result.winner === 'ai') state.stats.damageTaken += result.damage;
  if (result.resonance && result.winner === 'player') state.stats.resonances += 1;
  if (result.winner === 'clash') state.stats.clashes += 1;
  if (result.winner === 'ward' || result.winner === 'double-ward') state.stats.wards += 1;
  pushLog(state, roundLogLine(state, result));
  if (state.pLife <= 0 || state.aLife <= 0) {
    state.phase = 'over';
    state.winner = state.aLife <= 0 && state.pLife <= 0 ? 'draw'
      : state.aLife <= 0 ? 'player' : 'ai';
    if (state.winner === 'player') state.pScore += 500;
  } else {
    state.phase = 'resolve';
  }
  return result;
}

function roundLogLine(state, result) {
  const p = state.pPlayed;
  const a = state.aPlayed;
  const base = `${p.name} ${p.power} vs ${a.name} ${a.power}`;
  if (result.winner === 'player') return `${base} — kamu menang, ${result.damage} luka.`;
  if (result.winner === 'ai') return `${base} — ${state.mode.foeName} menang, ${result.damage} luka.`;
  if (result.winner === 'clash') return `${base} — BENTROK, keduanya −2 nyawa.`;
  return `${base} — perisai menahan serangan.`;
}

// Draw back up to a full hand for both sides, then open the next round.
export function nextRound(state) {
  if (state.phase !== 'resolve') return false;
  state.pPlayed = null;
  state.aPlayed = null;
  state.discardUsed = false;
  state.discardMode = false;
  state.round += 1;
  refillHand(state, state.player);
  refillHand(state, state.ai);
  state.phase = 'pick';
  return true;
}

function refillHand(state, side) {
  while (side.hand.length < HAND_SIZE) {
    if (side.deck.length === 0) {
      if (side.discard.length <= 1) break; // played cards stay out; nothing left to draw
      side.deck = recycleDiscard(side.discard, state.rng);
    }
    side.hand.push(...draw(side.deck, 1));
  }
}

// Once per round: discard one hand card and draw a replacement.
export function discardAndDraw(state, handIndex) {
  if (state.phase !== 'pick' || state.discardUsed) return false;
  if (handIndex < 0 || handIndex >= state.player.hand.length) return false;
  const [card] = state.player.hand.splice(handIndex, 1);
  state.player.discard.push(card);
  refillHand(state, state.player);
  state.discardUsed = true;
  state.discardMode = false;
  pushLog(state, `Kamu membuang ${card.name} dan menarik kartu baru.`);
  return true;
}
