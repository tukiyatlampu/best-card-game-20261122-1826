// Ember Court — rules.js
// Mesin aturan murni: tanpa DOM, tanpa RNG. Satu ronde diselesaikan dari
// dua kartu yang dimainkan bersamaan plus jejak ronde sebelumnya.
//
// Urutan penyelesaian:
//   1. Perisai menahan serangan dan memulihkan 2 nyawa (tanpa pemenang).
//   2. Keunggulan sigil memutuskan; Liar unggul atas semua sigil.
//   3. Bila sigil netral, kekuatan memutuskan (Cermin = kekuatan lawan + 1).
//   4. Kekuatan seri -> Bentrok: kedua duelist -2 nyawa.
//   5. Menang 2 ronde beruntun dengan sigil sama -> Resonansi +4 luka.

import {
  SIGIL_BEATS,
  SIGIL_INFO,
  CLASH_DAMAGE,
  SHIELD_HEAL,
  RESONANCE_BONUS,
  ADVANTAGE_BONUS,
} from './config.js';

export function isSpecial(card) {
  return card.sigil === 'cermin' || card.sigil === 'perisai' || card.sigil === 'liar';
}

// Kekuatan yang tercetak di kartu (Cermin memakai angka dasarnya).
export function printedPower(card) {
  return card.power;
}

// Sigil efektif sebuah kartu melawan lawan: Cermin meniru sigil lawan.
export function effectiveSigil(card, foe) {
  if (card.sigil === 'cermin') return foe.sigil;
  return card.sigil;
}

// Kekuatan efektif: Cermin = kekuatan lawan + 1 (lawan Cermin -> 6).
export function effectivePower(card, foe) {
  if (card.sigil === 'cermin') {
    return foe.sigil === 'cermin' ? foe.power + 1 : printedPower(foe) + 1;
  }
  return printedPower(card);
}

// Apakah sigil a mengalahkan sigil b? Liar mengalahkan semua sigil.
export function sigilBeats(a, b) {
  if (a === 'liar' && b !== 'liar') return true;
  if (a === 'liar' && b === 'liar') return false;
  if (a === 'cermin' || a === 'perisai') return false;
  if (b === 'liar') return false;
  if (b === 'cermin' || b === 'perisai') return false;
  return SIGIL_BEATS[a] === b;
}

// Apakah pasangan sigil ini netral (tidak ada yang unggul)?
export function sigilsNeutral(a, b) {
  return !sigilBeats(a, b) && !sigilBeats(b, a);
}

// Nama tampilan sigil efektif untuk jurnal.
export function sigilName(sigil) {
  return SIGIL_INFO[sigil] ? SIGIL_INFO[sigil].name : sigil;
}

/**
 * Selesaikan satu ronde.
 * @param {object} mine kartu pemain, {object} foe kartu lawan
 * @param {object} prev jejak ronde sebelumnya { winner: 'mine'|'foe'|null, sigil }
 * @returns outcome { kind, winner, damage, resonance, clash, blocked, heal,
 *   minePower, foePower, mineSigil, foeSigil, text }
 * kind: 'win' | 'clash' | 'blocked' — blocked = Perisai menahan serangan.
 */
export function resolveRound(mine, foe, prev) {
  const mineSigil = effectiveSigil(mine, foe);
  const foeSigil = effectiveSigil(foe, mine);
  const minePower = effectivePower(mine, foe);
  const foePower = effectivePower(foe, mine);
  const base = { minePower, foePower, mineSigil, foeSigil, resonance: false };

  // Perisai: menahan serangan lawan dan memulihkan 2 nyawa.
  if (mine.sigil === 'perisai' && foe.sigil === 'perisai') {
    return { ...base, kind: 'blocked', winner: null, damage: 0, clash: false, blocked: 'both', heal: SHIELD_HEAL, text: 'Dua Perisai beradu — keduanya pulih 2 nyawa.' };
  }
  if (mine.sigil === 'perisai') {
    return { ...base, kind: 'blocked', winner: null, damage: 0, clash: false, blocked: 'mine', heal: SHIELD_HEAL, text: 'Perisaimu menahan serangan dan memulihkan 2 nyawa.' };
  }
  if (foe.sigil === 'perisai') {
    return { ...base, kind: 'blocked', winner: null, damage: 0, clash: false, blocked: 'foe', heal: SHIELD_HEAL, text: 'Perisai lawan menahan seranganmu dan memulihkan 2 nyawa.' };
  }

  const mineAdv = sigilBeats(mineSigil, foeSigil);
  const foeAdv = sigilBeats(foeSigil, mineSigil);

  // Kekuatan seri dan sigil netral -> Bentrok.
  if (!mineAdv && !foeAdv && minePower === foePower) {
    return { ...base, kind: 'clash', winner: null, damage: CLASH_DAMAGE, clash: true, blocked: null, heal: 0, text: `Bentrok! Kekuatan ${minePower} sama — keduanya kehilangan ${CLASH_DAMAGE} nyawa.` };
  }

  const winner = mineAdv || (!foeAdv && minePower > foePower) ? 'mine' : 'foe';
  const winPower = winner === 'mine' ? minePower : foePower;
  const losePower = winner === 'mine' ? foePower : minePower;
  const winSigil = winner === 'mine' ? mineSigil : foeSigil;
  const hasAdvantage = winner === 'mine' ? mineAdv : foeAdv;

  // Resonansi: pemenang yang sama menang 2 ronde beruntun dengan sigil sama.
  const resonance = !!prev && prev.winner === winner && prev.sigil === winSigil;
  let damage = Math.max(1, winPower - losePower) + (hasAdvantage ? ADVANTAGE_BONUS : 0);
  if (resonance) damage += RESONANCE_BONUS;

  const who = winner === 'mine' ? 'Kamu' : 'Lawan';
  const parts = [`${who} menang ronde ini.`];
  if (hasAdvantage) parts.push(`${sigilName(winSigil)} mengungguli ${sigilName(winner === 'mine' ? foeSigil : mineSigil)} (+${ADVANTAGE_BONUS}).`);
  if (resonance) parts.push(`Resonansi ${sigilName(winSigil)}! +${RESONANCE_BONUS} luka.`);
  parts.push(`Luka ${damage}.`);
  return { ...base, kind: 'win', winner, damage, resonance, clash: false, blocked: null, heal: 0, text: parts.join(' ') };
}

// Apakah nyawa ini masuk zona Near Miss (tersisa <= 5 tapi masih hidup)?
export function isNearMiss(hp) {
  return hp > 0 && hp <= 5;
}
