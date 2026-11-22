// Ember Court — deck.js
// Susunan dek dan pengelolaan tangan: bangun, kocok, tarik, buang.
// Satu dek per duelist: 24 kartu sigil + 6 kartu spesial = 30 kartu.

import {
  SIGILS,
  SIGIL_POWERS,
  SPECIAL_COUNTS,
  MIRROR_BASE_POWER,
  WILD_POWER,
  SHIELD_POWER,
} from './config.js';
import { shuffleDeck } from './random.js';

let cardCounter = 0;

// Satu kartu. id unik per kartu agar render dan log bisa membedakannya.
export function makeCard(sigil, power) {
  cardCounter += 1;
  return { id: `k${cardCounter}`, sigil, power };
}

// Dek segar yang belum dikocok: 4 sigil x 6 kekuatan + kartu spesial.
export function buildDeck() {
  const cards = [];
  for (const sigil of SIGILS) {
    for (const power of SIGIL_POWERS) {
      cards.push(makeCard(sigil, power));
    }
  }
  for (let i = 0; i < SPECIAL_COUNTS.cermin; i++) {
    cards.push(makeCard('cermin', MIRROR_BASE_POWER));
  }
  for (let i = 0; i < SPECIAL_COUNTS.perisai; i++) {
    cards.push(makeCard('perisai', SHIELD_POWER));
  }
  for (let i = 0; i < SPECIAL_COUNTS.liar; i++) {
    cards.push(makeCard('liar', WILD_POWER));
  }
  return cards;
}

// Tumpukan tarik baru yang sudah dikocok dengan RNG yang diberikan.
export function freshDrawPile(rng) {
  return shuffleDeck(buildDeck(), rng);
}

// Tarik n kartu; kalau tumpukan habis, kocok ulang tumpukan buang.
export function drawCards(pile, discard, n, rng) {
  const drawn = [];
  while (drawn.length < n) {
    if (pile.length === 0) {
      if (discard.length === 0) return drawn;
      const reshuffled = shuffleDeck(discard.splice(0), rng);
      pile.push(...reshuffled);
    }
    drawn.push(pile.pop());
  }
  return drawn;
}

// Label singkat kartu untuk jurnal dan log, misal "Api 7" atau "Liar".
export function cardLabel(card) {
  if (card.sigil === 'cermin') return 'Cermin';
  if (card.sigil === 'perisai') return 'Perisai';
  if (card.sigil === 'liar') return `Liar ${card.power}`;
  const names = { api: 'Api', daun: 'Daun', batu: 'Batu', air: 'Air' };
  return `${names[card.sigil]} ${card.power}`;
}
