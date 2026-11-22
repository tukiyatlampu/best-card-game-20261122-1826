// Ember Court — ai.js
// Tiga kepribadian lawan, masing-masing bisa dibaca dan dilawan:
// agresif selalu memainkan kartu terkuat, bertahan menyimpan Perisai
// untuk saat nyawa rendah, penipu memainkan kartu acak (bluff).

import { pickRandom } from './random.js';

// Kekuatan yang dipakai AI untuk membandingkan kartu di tangannya.
export function aiCardWeight(card) {
  if (card.sigil === 'perisai') return -1;
  return card.power;
}

// Agresif: kartu terkuat; bila seri, yang pertama di tangan.
export function chooseAggressive(hand) {
  let best = hand[0];
  for (const card of hand) {
    if (aiCardWeight(card) > aiCardWeight(best)) best = card;
  }
  return best;
}

// Bertahan: Perisai saat nyawa rendah, kalau tidak kartu terlemah
// (Perisai disimpan untuk saat genting, bukan dibuang percuma).
export function chooseDefensive(hand, hp) {
  if (hp <= 12) {
    const shield = hand.find((card) => card.sigil === 'perisai');
    if (shield) return shield;
  }
  const attackers = hand.filter((card) => card.sigil !== 'perisai');
  const pool = attackers.length > 0 ? attackers : hand;
  let weakest = pool[0];
  for (const card of pool) {
    if (aiCardWeight(card) < aiCardWeight(weakest)) weakest = card;
  }
  return weakest;
}

// Penipu: kartu acak dari tangan (umpan atau kejutan).
export function chooseTrickster(hand, rng) {
  return pickRandom(hand, rng);
}

// Pilih kartu sesuai kepribadian. ctx: { hp } nyawa AI saat ini.
export function chooseCard(hand, personality, ctx, rng) {
  if (hand.length === 0) return null;
  if (personality === 'agresif') return chooseAggressive(hand);
  if (personality === 'bertahan') return chooseDefensive(hand, ctx.hp);
  return chooseTrickster(hand, rng);
}

// Status singkat untuk HUD: apa yang baru saja dilakukan AI.
export function aiStatusLine(personality, lastCard) {
  if (!lastCard) return 'Menunggu giliranmu…';
  if (personality === 'agresif') return `Raka menghantam dengan kartu terkuat.`;
  if (personality === 'bertahan') return `Sari menjaga tempo permainan.`;
  return `Wira tersenyum — tebak-tebakan dimulai.`;
}
