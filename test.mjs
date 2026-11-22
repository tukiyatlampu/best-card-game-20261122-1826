// Ember Court — test.mjs
// Harness logika (Node 22 stdlib saja, tanpa browser):
//   node test.mjs
// Menguji siklus sigil, kartu spesial, Resonansi, Bentrok, Near Miss,
// ketiga AI, determinisme seed, dan 150 simulasi duel penuh.

import { SIGILS, SIGIL_BEATS } from './game/src/config.js';
import { makeRng, shuffleDeck } from './game/src/random.js';
import { buildDeck, freshDrawPile, drawCards } from './game/src/deck.js';
import { resolveRound, sigilBeats, effectivePower, isNearMiss } from './game/src/rules.js';
import { chooseCard } from './game/src/ai.js';
import { createGame, playCard, discardDraw } from './game/src/state.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed += 1; console.log(`PASS ${name}`); }
  else { failed += 1; console.log(`FAIL ${name}`); }
}
const card = (sigil, power) => ({ id: `t-${sigil}-${power}`, sigil, power });
const noPrev = { winner: null, sigil: null };

// 1. Siklus sigil: tiap sigil mengalahkan tepat satu dan dikalahkan satu.
for (const s of SIGILS) {
  check(`siklus ${s} mengalahkan ${SIGIL_BEATS[s]}`, sigilBeats(s, SIGIL_BEATS[s]));
  const beatenBy = SIGILS.filter((o) => SIGIL_BEATS[o] === s);
  check(`siklus ${s} dikalahkan tepat satu (${beatenBy})`, beatenBy.length === 1);
}
check('siklus api vs batu netral', !sigilBeats('api', 'batu') && !sigilBeats('batu', 'api'));
check('siklus daun vs air netral', !sigilBeats('daun', 'air') && !sigilBeats('air', 'daun'));

// 2. Kartu spesial.
check('cermin meniru lawan +1', effectivePower(card('cermin', 5), card('api', 7)) === 8);
check('cermin vs cermin = 6', effectivePower(card('cermin', 5), card('cermin', 5)) === 6);
check('liar mengalahkan semua sigil', SIGILS.every((s) => sigilBeats('liar', s)));
check('liar vs liar netral', !sigilBeats('liar', 'liar'));
check('perisai menahan serangan + pulih 2', (() => {
  const out = resolveRound(card('perisai', 0), card('api', 8), noPrev);
  return out.kind === 'blocked' && out.blocked === 'mine' && out.heal === 2;
})());
check('dua perisai saling pulih', resolveRound(card('perisai', 0), card('perisai', 0), noPrev).blocked === 'both');
check('perisai lawan menahan seranganku', resolveRound(card('api', 8), card('perisai', 0), noPrev).blocked === 'foe');

// 3. Kekuatan memutuskan saat sigil netral; keunggulan sigil +2 luka.
check('netral: kekuatan lebih besar menang', resolveRound(card('api', 8), card('batu', 3), noPrev).winner === 'mine');
check('unggulan sigil menang walau kekuatan kalah', resolveRound(card('api', 3), card('daun', 8), noPrev).winner === 'mine');
check('unggulan sigil memberi +2 luka', resolveRound(card('api', 5), card('daun', 5), noPrev).damage === 3);
check('tanpa keunggulan: luka = selisih kekuatan', resolveRound(card('api', 8), card('batu', 3), noPrev).damage === 5);
check('luka minimal 1', resolveRound(card('api', 4), card('batu', 3), noPrev).damage === 1);

// 4. Resonansi: menang 2 ronde beruntun dengan sigil sama = +4 luka.
check('resonansi +4 luka', (() => {
  const prev = { winner: 'mine', sigil: 'api' };
  const out = resolveRound(card('api', 6), card('batu', 4), prev);
  return out.resonance === true && out.damage === 6; // selisih 2 + 4 resonansi
})());
check('sigil berbeda tidak resonansi', resolveRound(card('daun', 6), card('batu', 4), { winner: 'mine', sigil: 'api' }).resonance === false);
check('pemenang berbeda tidak resonansi', resolveRound(card('api', 6), card('batu', 4), { winner: 'foe', sigil: 'api' }).resonance === false);

// 5. Bentrok: kekuatan seri + netral = keduanya -2.
check('bentrok saat seri netral', (() => {
  const out = resolveRound(card('api', 5), card('batu', 5), noPrev);
  return out.kind === 'clash' && out.damage === 2;
})());
check('bentrok cermin vs cermin', resolveRound(card('cermin', 5), card('cermin', 5), noPrev).kind === 'clash');

// 6. Near Miss: nyawa <= 5 dan masih hidup.
check('near miss di 5', isNearMiss(5) === true);
check('near miss di 1', isNearMiss(1) === true);
check('bukan near miss di 6', isNearMiss(6) === false);
check('bukan near miss di 0', isNearMiss(0) === false);

// 7. Dek: 30 kartu, komposisi benar.
check('dek 30 kartu', buildDeck().length === 30);
check('dek: 6 kartu per sigil', SIGILS.every((s) => buildDeck().filter((c) => c.sigil === s).length === 6));
check('dek: 2 cermin 2 perisai 2 liar', (() => {
  const d = buildDeck();
  return d.filter((c) => c.sigil === 'cermin').length === 2
    && d.filter((c) => c.sigil === 'perisai').length === 2
    && d.filter((c) => c.sigil === 'liar').length === 2;
})());

// 8. Determinisme: seed sama -> shuffle dan duel sama.
check('shuffle deterministik', (() => {
  const key = (c) => `${c.sigil}:${c.power}`;
  const a = shuffleDeck(buildDeck(), makeRng(99)).map(key);
  const b = shuffleDeck(buildDeck(), makeRng(99)).map(key);
  const c = shuffleDeck(buildDeck(), makeRng(100)).map(key);
  return JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) !== JSON.stringify(c);
})());
check('duel deterministik seed sama', (() => {
  const run = (seed) => {
    const g = createGame('berburu', seed);
    const rng = makeRng(seed + 7);
    while (g.phase === 'play' && g.round < 200) playCard(g, Math.floor(rng() * g.player.hand.length));
    return JSON.stringify({ hp: [g.player.hp, g.ai.hp], rounds: g.round, winner: g.winner, log: g.log });
  };
  return run(42) === run(42) && run(42) !== run(43);
})());

// 9. AI: agresif terkuat, bertahan berperisai saat nyawa rendah.
check('ai agresif memainkan kartu terkuat', (() => {
  const hand = [card('api', 3), card('daun', 8), card('liar', 6)];
  return chooseCard(hand, 'agresif', { hp: 30 }, makeRng(1)).sigil === 'daun';
})());
check('ai bertahan berperisai saat nyawa 10', (() => {
  const hand = [card('api', 8), card('perisai', 0), card('daun', 4)];
  return chooseCard(hand, 'bertahan', { hp: 10 }, makeRng(1)).sigil === 'perisai';
})());
check('ai bertahan tidak berperisai saat nyawa penuh', (() => {
  const hand = [card('api', 8), card('perisai', 0), card('daun', 4)];
  return chooseCard(hand, 'bertahan', { hp: 30 }, makeRng(1)).sigil === 'daun';
})());
check('ai penipu deterministik dengan seed', (() => {
  const hand = [card('api', 3), card('daun', 8), card('liar', 6)];
  const a = chooseCard(hand, 'penipu', { hp: 30 }, makeRng(5));
  const b = chooseCard(hand, 'penipu', { hp: 30 }, makeRng(5));
  return a.id === b.id;
})());

// 10. Buang-tarik: sekali per ronde, tangan tetap 5 kartu.
check('buang-tarik sekali per ronde', (() => {
  const g = createGame('tembok', 11);
  const first = discardDraw(g, 0);
  const second = discardDraw(g, 0);
  return first.ok === true && second.ok === false && g.player.hand.length === 5;
})());
check('buang-tarik reset tiap ronde', (() => {
  const g = createGame('tembok', 11);
  discardDraw(g, 0);
  playCard(g, 0);
  return g.discardUsed === false;
})());

// 11. Simulasi penuh: 50 duel per mode, tanpa deadlock, selalu berakhir.
let sims = 0;
let simWins = { mine: 0, foe: 0, draw: 0 };
let maxRounds = 0;
for (const mode of ['berburu', 'tembok', 'topeng']) {
  for (let s = 0; s < 50; s++) {
    const g = createGame(mode, 1000 + s);
    const rng = makeRng(5000 + s);
    let guard = 0;
    while (g.phase === 'play' && guard < 300) {
      if (!g.discardUsed && rng() < 0.25) discardDraw(g, Math.floor(rng() * g.player.hand.length));
      playCard(g, Math.floor(rng() * g.player.hand.length));
      guard += 1;
    }
    sims += 1;
    simWins[g.winner] += 1;
    maxRounds = Math.max(maxRounds, g.round);
    if (g.phase !== 'over') { failed += 1; console.log(`FAIL simulasi ${mode} seed ${1000 + s} tidak berakhir`); }
    if (g.player.hand.length !== 5 || g.ai.hand.length !== 5) { failed += 1; console.log(`FAIL tangan bukan 5 kartu ${mode} ${1000 + s}`); }
  }
}
passed += 1;
console.log(`PASS simulasi penuh ${sims} duel (menang ${simWins.mine} / kalah ${simWins.foe} / seri ${simWins.draw}), ronde maks ${maxRounds}`);

// 12. drawCards mengocok ulang tumpukan buang saat tumpukan habis.
check('tumpukan habis dikocok ulang dari buang', (() => {
  const pile = [];
  const discard = buildDeck().slice(0, 10);
  const drawn = drawCards(pile, discard, 5, makeRng(3));
  return drawn.length === 5 && pile.length === 5;
})());

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
