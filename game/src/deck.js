// deck.js — builds, shuffles and draws from a 26-card deck.
// One job: the deck. No rules, no rendering.

import { CARD_DEFS, HAND_SIZE } from './config.js';

// mulberry32: small deterministic RNG so ?shot= screenshots are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A fresh deck: one copy of every card definition, in definition order.
export function buildDeck() {
  return CARD_DEFS.map((d) => ({ ...d, uid: d.id }));
}

// Fisher-Yates shuffle, in place, using the given rng.
export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw n cards from the front of the deck. Returns the drawn cards.
export function draw(deck, n) {
  return deck.splice(0, n);
}

// A full hand: a shuffled deck plus its opening hand of HAND_SIZE cards.
export function newPlayerDeck(rng) {
  const deck = shuffle(buildDeck(), rng);
  const hand = draw(deck, HAND_SIZE);
  return { deck, hand, discard: [] };
}

// Rebuild a deck from the discard pile when the draw pile runs out.
export function recycleDiscard(pile, rng) {
  const fresh = shuffle(pile.splice(0, pile.length), rng);
  return fresh;
}
