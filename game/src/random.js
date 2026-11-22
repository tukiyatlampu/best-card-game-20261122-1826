// Ember Court — random.js
// RNG deterministik (mulberry32): seed yang sama selalu menghasilkan
// urutan angka dan shuffle yang sama, jadi duel bisa diulang persis.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Acak Fisher-Yates memakai RNG yang diberikan; mengembalikan dek baru.
export function shuffleDeck(cards, rng) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Pilih satu elemen acak dari daftar memakai RNG yang diberikan.
export function pickRandom(list, rng) {
  return list[Math.floor(rng() * list.length)];
}
