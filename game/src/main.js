// Ember Court — main.js
// Bootstrap: baca ?shot/ ?seed/ ?mode, buat duel, sambungkan input,
// render, dan suara. Satu-satunya modul yang menyentuh alur aplikasi.

import { DEFAULT_SEED, MODES } from './config.js';
import { createGame, playCard, discardDraw } from './state.js';
import { renderAll, renderCycle, showBanner, showTitle, showEnd } from './render.js';
import { bindKeyboard, bindButtons, bindModeCards } from './input.js';
import { playSfx, toggleMute, isMuted, ensureAudio } from './audio.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') || '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : DEFAULT_SEED;
const shot = params.get('shot') || '';
const modeParam = params.get('mode') || '';

// Keadaan UI: apakah mode buang-tarik sedang dipersenjatai.
const ui = { discardArmed: false, started: false };
let game = createGame('berburu', seed);

function muteLabel() {
  const btn = document.getElementById('btn-mute');
  if (btn) btn.textContent = isMuted() ? '🔇 Bisu' : '🔊 Suara';
}

// Setelah ronde: banner + suara sesuai hasil.
function afterRound(outcome) {
  if (!outcome) return;
  if (outcome.resonance) {
    showBanner('🔥 RESONANSI! +4 luka beruntun', 'resonance');
    playSfx('resonance');
  } else if (outcome.kind === 'clash') {
    showBanner('💥 BENTROK! Keduanya −2 nyawa', 'clash');
    playSfx('clash');
  } else if (outcome.kind === 'blocked') {
    showBanner('🛡️ PERISAI MENAHAN SERANGAN', 'shield');
    playSfx('shield');
  } else if (outcome.winner === 'mine') {
    playSfx('win-round');
  } else if (outcome.winner === 'foe') {
    playSfx('lose-round');
  }
  if (game.nearMiss === 'foe') showBanner('⚠️ NEAR MISS! Lawan tersisa ≤ 5 nyawa', 'near');
  if (game.nearMiss === 'mine') showBanner('⚠️ NEAR MISS! Nyawamu tersisa ≤ 5', 'near');
  if (game.phase === 'over') {
    playSfx(game.winner === 'mine' ? 'win-game' : 'lose-game');
    showEnd(game);
  }
}

// Mainkan kartu tangan ke-i (atau buang bila mode buang aktif).
function onPlay(index) {
  if (!ui.started || game.phase !== 'play') return;
  ensureAudio();
  if (ui.discardArmed) {
    const res = discardDraw(game, index);
    ui.discardArmed = false;
    if (res.ok) playSfx('click');
    renderAll(game, ui, onPlay);
    return;
  }
  const outcome = playCard(game, index);
  if (outcome) playSfx('play');
  afterRound(outcome);
  renderAll(game, ui, onPlay);
}

// Mulai duel baru di mode yang dipilih.
function startMode(modeId) {
  const mode = MODES[modeId] || MODES.berburu;
  game = createGame(mode.id, seed);
  ui.started = true;
  ui.discardArmed = false;
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.add('hidden');
  playSfx('click');
  renderAll(game, ui, onPlay);
}

// Kembali ke layar judul.
function toMenu() {
  ui.started = false;
  ui.discardArmed = false;
  game = createGame(game.mode.id, seed);
  showTitle(game, seed);
  renderAll(game, ui, onPlay);
}

// Main lagi di mode yang sama (tombol R / layar akhir).
function replay() {
  if (!ui.started && !document.getElementById('end-screen').classList.contains('hidden')) {
    startMode(game.mode.id);
    return;
  }
  if (game.phase === 'over') startMode(game.mode.id);
}

const handlers = {
  play: onPlay,
  armDiscard: () => {
    if (!ui.started || game.phase !== 'play' || game.discardUsed) return;
    ui.discardArmed = !ui.discardArmed;
    playSfx('click');
    renderAll(game, ui, onPlay);
  },
  toMenu,
  replay,
  toggleMute: () => {
    toggleMute();
    muteLabel();
  },
};

bindKeyboard(handlers);
bindButtons(handlers);
bindModeCards(startMode);
renderCycle();
muteLabel();

// Mode preset: ?shot=title|table|win|loss untuk screenshot deterministik.
if (shot) {
  const preset = applyShot(shot, seed);
  game = preset.game;
  ui.started = !preset.title;
  if (preset.title) {
    showTitle(game, seed);
  } else {
    document.getElementById('title-screen').classList.add('hidden');
    if (game.phase === 'over') showEnd(game);
  }
  renderAll(game, ui, onPlay);
} else if (modeParam && MODES[modeParam]) {
  startMode(modeParam);
} else {
  showTitle(game, seed);
  renderAll(game, ui, onPlay);
}

// Tandai siap untuk harness screenshot/E2E.
document.documentElement.dataset.ready = '1';
window.__emberCourt = { get game() { return game; }, ui, seed };
