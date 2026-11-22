// rules.js — the duel's combat resolution, pure functions, no DOM.
// One job: decide what one round does. Every edge case is settled here.

import {
  ADVANTAGE_DAMAGE,
  CLASH_DAMAGE,
  MIRROR_BASE,
  NEAR_MISS_LIFE,
  RESONANCE_BONUS,
  RESONANCE_STREAK,
  SCORE,
  SIGILS,
  WARD_HEAL,
} from './config.js';

// The power a card fights with this round.
// Mirror copies the foe's printed power + 1 (a Mirror foe counts as MIRROR_BASE).
// Wild always fights at its printed 4. Ward fights at its printed 1.
export function effectivePower(card, foeCard) {
  if (card.kind === 'mirror') {
    const foeBase = foeCard.kind === 'mirror' ? MIRROR_BASE : foeCard.power;
    return foeBase + 1;
  }
  return card.power;
}

// True when card a's sigil beats card b's sigil this round.
// Wild is advantaged against any sigil; Wild vs Wild is neutral.
export function sigilAdvantage(a, b) {
  if (a.kind === 'wild' && b.kind === 'wild') return false;
  if (a.kind === 'wild') return true;
  if (b.kind === 'wild') return false;
  return SIGILS[a.sigil].beats === b.sigil;
}

// Advance a resonance streak: winning twice in a row with the same sigil pays a bonus.
function advanceStreak(streak, sigil) {
  const next = streak.sigil === sigil
    ? { sigil, count: streak.count + 1 }
    : { sigil, count: 1 };
  if (next.count >= RESONANCE_STREAK) {
    return { streak: { sigil: null, count: 0 }, triggered: true };
  }
  return { streak: next, triggered: false };
}

// Resolve one round. pCard / aCard are the played cards, pLife / aLife the life
// totals before the round, pStreak / aStreak the resonance streaks.
// Returns everything render + state need, and never mutates its inputs.
export function resolveRound(pCard, aCard, pLife, aLife, pStreak, aStreak) {
  const out = {
    winner: null, // 'player' | 'ai' | 'clash' | 'ward' | 'double-ward'
    damage: 0,
    pHeal: 0,
    aHeal: 0,
    pLife, aLife,
    pStreak, aStreak,
    resonance: false,
    nearMiss: false,
    pPower: effectivePower(pCard, aCard),
    aPower: effectivePower(aCard, pCard),
    pAdvantage: sigilAdvantage(pCard, aCard),
    aAdvantage: sigilAdvantage(aCard, pCard),
    events: [],
  };

  // Ward settles the round before any power is compared.
  if (pCard.kind === 'ward' && aCard.kind === 'ward') {
    out.winner = 'double-ward';
    out.pHeal = WARD_HEAL;
    out.aHeal = WARD_HEAL;
    out.events.push('double-ward');
  } else if (pCard.kind === 'ward') {
    out.winner = 'ward';
    out.pHeal = WARD_HEAL;
    out.events.push('ward-player');
  } else if (aCard.kind === 'ward') {
    out.winner = 'ward';
    out.aHeal = WARD_HEAL;
    out.events.push('ward-ai');
  } else if (out.pAdvantage && !out.aAdvantage) {
    out.winner = 'player';
    out.damage = ADVANTAGE_DAMAGE + Math.max(0, out.pPower - out.aPower);
    out.events.push('advantage-player');
  } else if (out.aAdvantage && !out.pAdvantage) {
    out.winner = 'ai';
    out.damage = ADVANTAGE_DAMAGE + Math.max(0, out.aPower - out.pPower);
    out.events.push('advantage-ai');
  } else if (out.pPower > out.aPower) {
    out.winner = 'player';
    out.damage = out.pPower - out.aPower;
  } else if (out.aPower > out.pPower) {
    out.winner = 'ai';
    out.damage = out.aPower - out.pPower;
  } else {
    out.winner = 'clash';
    out.damage = CLASH_DAMAGE;
    out.events.push('clash');
  }

  // Resonance: a second straight win with the same sigil pays a bonus.
  if (out.winner === 'player') {
    const r = advanceStreak(pStreak, pCard.sigil);
    out.pStreak = r.streak;
    out.aStreak = { sigil: null, count: 0 };
    if (r.triggered) {
      out.damage += RESONANCE_BONUS;
      out.resonance = true;
      out.events.push('resonance-player');
    }
  } else if (out.winner === 'ai') {
    const r = advanceStreak(aStreak, aCard.sigil);
    out.aStreak = r.streak;
    out.pStreak = { sigil: null, count: 0 };
    if (r.triggered) {
      out.damage += RESONANCE_BONUS;
      out.resonance = true;
      out.events.push('resonance-ai');
    }
  } else {
    out.pStreak = { sigil: null, count: 0 };
    out.aStreak = { sigil: null, count: 0 };
  }

  // Apply damage and healing, clamped to the table.
  if (out.winner === 'player') out.aLife = Math.max(0, aLife - out.damage);
  if (out.winner === 'ai') out.pLife = Math.max(0, pLife - out.damage);
  if (out.winner === 'clash') {
    out.pLife = Math.max(0, pLife - CLASH_DAMAGE);
    out.aLife = Math.max(0, aLife - CLASH_DAMAGE);
  }
  out.pLife = Math.min(30, out.pLife + out.pHeal);
  out.aLife = Math.min(30, out.aLife + out.aHeal);

  // Near miss: a duelist left standing on 5 life or less after taking damage.
  const loserLife = out.winner === 'player' ? out.aLife : out.pLife;
  if ((out.winner === 'player' || out.winner === 'ai') && loserLife > 0 && loserLife <= NEAR_MISS_LIFE) {
    out.nearMiss = true;
    out.events.push('near-miss');
  }

  return out;
}

// Score gained from one resolved round.
export function roundScore(result) {
  if (result.winner === 'player') {
    return SCORE.trick + result.damage * SCORE.damage + (result.resonance ? SCORE.resonance : 0);
  }
  if (result.winner === 'clash') return SCORE.clash;
  return 0;
}

// A one-line verdict for the banner, in Indonesian.
export function verdictLine(result, pName, aName) {
  switch (result.winner) {
    case 'player': return `${pName} menang +${result.damage} luka`;
    case 'ai': return `${aName} menang +${result.damage} luka`;
    case 'clash': return `BENTROK! Keduanya −${CLASH_DAMAGE} nyawa`;
    case 'ward': return 'Perisai menahan serangan · +2 nyawa';
    case 'double-ward': return 'Dua perisai terangkat · keduanya +2 nyawa';
    default: return '';
  }
}
