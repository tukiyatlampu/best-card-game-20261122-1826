// main.js — bootstrap and the duel's timed flow.
// One job: wire state + render + input together and drive the round clock.

import { MODE_ORDER, MODES } from './config.js';
import { makeRng } from './deck.js';
import { aiPlayCard, createGame, nextRound, resolveCurrentRound, startDuel } from './state.js';
import { buildEnd, buildHud, buildTable, buildTitle, confetti, render, showBanner } from './render.js';
import { bindInput } from './input.js';
import {
  isMuted, sfxDefeat, sfxFlip, sfxLoseRound, sfxPlay, sfxResonance, sfxVictory, sfxWinRound, toggleMuted,
} from './audio.js';
import { applyShot } from './shots.js';
import { verdictLine } from './rules.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || (SHOT ? 7 : Date.now() % 100000));
const START_MODE = MODES[params.get('mode')] ? params.get('mode') : 'ember';

const app = document.querySelector('#app');
let state = createGame(START_MODE, makeRng(SEED));
let generation = 0; // stale timers from an abandoned duel do nothing

function after(ms, fn) {
  const gen = generation;
  window.setTimeout(() => { if (gen === generation) fn(); }, ms);
}

function refresh() {
  render(state);
}

function banner(text, kind, hold = false) {
  showBanner(text, kind);
  if (!hold) {
    after(1700, () => {
      const b = document.querySelector('#banner');
      if (b) b.classList.remove('show');
    });
  }
}

function driveRound() {
  // AI answers after a beat, so the player can read the table.
  after(650, () => {
    if (state.phase !== 'ai-think') return;
    aiPlayCard(state);
    sfxFlip();
    refresh();
    after(800, () => {
      if (state.phase !== 'reveal') return;
      const result = resolveCurrentRound(state);
      if (!result) return;
      if (result.winner === 'player') sfxWinRound();
      else if (result.winner === 'ai') sfxLoseRound();
      if (result.resonance) sfxResonance();
      refresh();
      if (state.phase === 'over') {
        finishDuel();
        return;
      }
      const line = verdictLine(result, 'Kamu', state.mode.foeName);
      banner(
        result.resonance ? `RESONANSI! ${line} · +4 luka` : line,
        result.winner === 'player' ? 'win-round' : result.winner === 'ai' ? 'lose-round' : '',
      );
      after(1700, () => {
        if (state.phase !== 'resolve') return;
        nextRound(state);
        refresh();
      });
    });
  });
}

function finishDuel() {
  refresh();
  if (state.winner === 'player') {
    sfxVictory();
    confetti();
    banner('✦ KEMENANGAN — TAKHTA MILIKMU ✦', 'win', true);
  } else {
    sfxDefeat();
    banner('TAKHTA JATUH — COBA LAGI', 'lose', true);
  }
}

const controller = {
  get state() { return state; },
  act(fn) {
    const before = state.phase;
    const ok = fn();
    if (!ok) return;
    if (before === 'pick' && state.phase === 'ai-think') sfxPlay();
    refresh();
    if (state.phase === 'ai-think') driveRound();
  },
  toggleSound() {
    const muted = toggleMuted();
    document.querySelector('#btn-sound').textContent = muted ? 'Suara: mati (M)' : 'Suara: nyala (M)';
  },
  toMenu() {
    generation += 1;
    state = createGame(state.mode.id, makeRng(Date.now() % 100000));
    refresh();
  },
  again() {
    generation += 1;
    state = createGame(state.mode.id, makeRng(Date.now() % 100000));
    startDuel(state);
    refresh();
  },
  pickMode(modeId) {
    generation += 1;
    state = createGame(modeId, makeRng(Date.now() % 100000));
    startDuel(state);
    refresh();
  },
};

buildHud(app, state);
buildTable(app);
buildTitle(app, MODE_ORDER.map((id) => MODES[id]), (modeId) => controller.pickMode(modeId));
buildEnd(app, () => controller.again(), () => controller.toMenu());
bindInput(controller);

// Screenshot mode: a fixed table state, no timers, banner held on screen.
if (SHOT) {
  const held = applyShot(state, SHOT);
  refresh();
  if (held) showBanner(held.text, held.kind);
  if (state.phase === 'over' && state.winner === 'player') confetti();
} else {
  refresh();
}

if (isMuted()) document.querySelector('#btn-sound').textContent = 'Suara: mati (M)';
