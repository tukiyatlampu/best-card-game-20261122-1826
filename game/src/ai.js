// ai.js — the three rival minds. Each reads the table and picks one card.
// One job: choose the AI's card. The AI never sees the player's current pick,
// only the public table: lives, the last card played, and the resonance streaks.

import { effectivePower, sigilAdvantage } from './rules.js';

// The "ghost" the AI plans against: the player's last sigil at middling power.
// When nothing was played yet, the ghost is a plain 5 of a random sigil.
function ghostCard(playerLastCard, rng) {
  const sigils = ['FLAME', 'LEAF', 'STONE', 'TIDE'];
  return {
    sigil: playerLastCard ? playerLastCard.sigil : sigils[Math.floor(rng() * 4)],
    power: 5,
    kind: playerLastCard ? playerLastCard.kind : 'atk',
  };
}

// Score one candidate card against the ghost, shaped by personality.
function scoreCard(card, ghost, ctx, rng) {
  const aiPower = effectivePower(card, ghost);
  const ghostPower = effectivePower(ghost, card);
  const aiWins = sigilAdvantage(card, ghost);
  const ghostWins = sigilAdvantage(ghost, card);
  let score = rng() * 6; // a little jitter so the rival is never fully scripted

  if (card.kind === 'ward') {
    // Ward is worth more the closer the AI is to falling.
    score += ctx.aiLife <= 12 ? 42 : ctx.aiLife <= 18 ? 26 : 6;
    if (ctx.personality === 'defensive') score += 18;
    if (ctx.personality === 'aggressive') score -= 22;
    return score;
  }
  if (card.kind === 'mirror') {
    score += ghostPower >= 6 ? 16 : 6;
    if (ctx.playerLife <= 12) score += 14; // a Mirror can finish a hurt duelist
    if (ctx.personality === 'trickster') score += 10;
    return score;
  }
  if (card.kind === 'wild') {
    score += 18; // advantaged against everything
    if (ctx.playerLife <= 10) score += 14;
    if (ctx.personality === 'trickster') score += 8;
    return score;
  }

  if (aiWins && !ghostWins) score += 30 + Math.max(0, aiPower - ghostPower) * 3;
  else if (ghostWins && !aiWins) score -= 20 + Math.max(0, ghostPower - aiPower) * 2;
  else if (aiPower > ghostPower) score += 12 + (aiPower - ghostPower) * 3;
  else if (aiPower < ghostPower) score -= 12 + (ghostPower - aiPower) * 2;

  if (ctx.personality === 'aggressive') score += aiPower * 2;
  if (ctx.personality === 'defensive') score -= aiPower * 0.8;
  if (ctx.personality === 'trickster') {
    // Break the player's resonance run before it pays.
    if (ctx.playerStreak && ctx.playerStreak.count === 1 && card.sigil) {
      const breaks = { FLAME: 'TIDE', LEAF: 'FLAME', STONE: 'LEAF', TIDE: 'STONE' };
      if (breaks[ctx.playerStreak.sigil] === card.sigil) score += 35;
    }
    // A trickster holds its best card until the player is hurt.
    if (ctx.playerLife > 20 && aiPower >= 8) score -= 10;
  }
  return score;
}

// Pick the index of the card to play.
// ctx: { personality, aiLife, playerLife, playerLastCard, playerStreak, round }
export function chooseCard(hand, ctx, rng) {
  const ghost = ghostCard(ctx.playerLastCard, rng);
  let best = 0;
  let bestScore = -Infinity;
  hand.forEach((card, i) => {
    const s = scoreCard(card, ghost, ctx, rng);
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  });
  return best;
}

// A readable line about what the rival is doing, shown in the HUD.
export function aiMoodLine(personality, aiLife, playerLife) {
  if (aiLife <= 8) return 'Lawan terdesak — ia akan bermain nekat.';
  if (playerLife <= 8) return 'Lawan mencium kemenangan — awas kartu besar.';
  if (personality === 'aggressive') return 'Baron selalu menyerang dengan kartu terkuatnya.';
  if (personality === 'defensive') return 'Adipati menyimpan perisai untuk saat genting.';
  return 'Ratu menipu: ia menyimpan Cermin dan Liar untuk momenmu.';
}
