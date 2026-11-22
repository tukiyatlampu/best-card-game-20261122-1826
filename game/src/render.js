// render.js — everything the player sees: HUD panel, table, cards, banners.
// One job: turn game state into DOM. No rules, no input handling.

import { SIGILS, START_LIFE } from './config.js';
import { aiMoodLine } from './ai.js';
import { verdictLine } from './rules.js';

const $ = (sel, root = document) => root.querySelector(sel);

const KIND_LABEL = { atk: 'SERANG', mirror: 'CERMIN', ward: 'PERISAI', wild: 'LIAR' };

// One card face. Colour + shape + name tell the sigil apart, never text alone.
export function cardElement(card, opts = {}) {
  const el = document.createElement('div');
  if (opts.faceDown) {
    el.className = `card back${opts.small ? ' small' : ''}`;
    el.innerHTML = `<div class="card-back-pattern">✦</div><div class="card-back-name">EMBER<br>COURT</div>`;
    return el;
  }
  const sigil = SIGILS[card.sigil];
  el.className = `card sigil-${card.sigil}${opts.small ? ' small' : ''}${opts.playable ? ' playable' : ''}${opts.selected ? ' selected' : ''}`;
  if (opts.index != null) el.dataset.index = String(opts.index);
  el.style.setProperty('--sigil', sigil.color);
  el.style.setProperty('--sigil-dark', sigil.dark);
  el.innerHTML = `
    <div class="card-top"><span class="card-power">${card.kind === 'mirror' ? '↻' + card.power : card.power}</span><span class="card-shape">${sigil.shape}</span></div>
    <div class="card-mid"><span class="card-big-shape">${sigil.shape}</span></div>
    <div class="card-sigil">${sigil.name.toUpperCase()}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-kind">${KIND_LABEL[card.kind]}</div>`;
  return el;
}

// The dense side panel: mode, lives, score, resonance, AI state, objectives, log.
export function buildHud(app, state) {
  const hud = document.createElement('aside');
  hud.id = 'hud';
  hud.innerHTML = `
    <div class="hud-title"><span class="hud-logo">✦ EMBER COURT ✦</span><span class="hud-mode" id="hud-mode"></span></div>
    <div class="hud-row"><span class="hud-label">RONDE</span><span class="hud-value" id="hud-round">1</span></div>
    <div class="hud-row"><span class="hud-label">SKOR</span><span class="hud-value" id="hud-score">0</span></div>
    <div class="hud-life">
      <div class="life-head"><span id="hud-pname">KAMU</span><span id="hud-plife">30 / 30</span></div>
      <div class="life-bar"><div class="life-fill player" id="hud-pbar"></div></div>
      <div class="life-head"><span id="hud-aname">LAWAN</span><span id="hud-alife">30 / 30</span></div>
      <div class="life-bar"><div class="life-fill ai" id="hud-abar"></div></div>
    </div>
    <div class="hud-resonance"><span class="hud-label">RESONANSI</span><span id="hud-reso">—</span></div>
    <div class="hud-ai"><span class="hud-label">LAWAN</span><span id="hud-aimood"></span></div>
    <div class="hud-objectives"><span class="hud-label">MISI</span><ul id="hud-objectives"></ul></div>
    <div class="hud-counts"><span id="hud-deck"></span><span id="hud-hand"></span></div>
    <div class="hud-log"><span class="hud-label">JURNAL DUEL</span><ul id="hud-log"></ul></div>
    <div class="hud-buttons">
      <button id="btn-discard" type="button">Buang 1 kartu · tarik baru (D)</button>
      <button id="btn-sound" type="button">Suara: nyala (M)</button>
      <button id="btn-menu" type="button">Menu (Esc)</button>
    </div>
    <div class="hud-cycle"><span class="hud-label">SIKLUS SIGIL</span><span class="cycle-line">▲ Api &gt; ◆ Daun &gt; ■ Batu &gt; ● Air &gt; ▲ Api</span><span class="cycle-note">★ Liar unggul atas semua sigil · ↻ Cermin meniru kekuatan lawan +1</span></div>`;
  app.appendChild(hud);
}

// The table: foe zone, arena, player zone.
export function buildTable(app) {
  const table = document.createElement('main');
  table.id = 'table';
  table.innerHTML = `
    <section id="foe-zone" class="zone">
      <div class="zone-head"><span id="foe-name"></span><span id="foe-hand-count"></span></div>
      <div id="foe-hand" class="mini-hand"></div>
      <div class="played-row"><div id="foe-played" class="played-slot"></div><div id="arena-mid"></div><div id="player-played" class="played-slot"></div></div>
    </section>
    <section id="arena"><div id="banner" class="banner hidden"></div><div id="arena-line" class="arena-line"></div></section>
    <section id="player-zone" class="zone">
      <div class="zone-head"><span>KAMU · Tanganmu</span><span id="player-hint">Klik kartu untuk memainkannya · 1–5 di keyboard</span></div>
      <div id="player-hand" class="hand"></div>
    </section>`;
  app.appendChild(table);
}

// Title overlay with the three named modes and the rules at a glance.
export function buildTitle(app, modes, onPick) {
  const ov = document.createElement('div');
  ov.id = 'title-overlay';
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="title-card">
      <div class="title-kicker">DUEL EMPAT SIGIL · 26 KARTU · 3 LAWAN</div>
      <h1>EMBER<br>COURT</h1>
      <p class="title-sub">Setiap ronde, mainkan 1 kartu. Sigil yang unggul menang; kekuatan memutuskan sisanya. Menang 2 ronde beruntun dengan sigil yang sama untuk memicu <b>RESONANSI +4</b>. Kalahkan lawan hingga nyawanya 0.</p>
      <div class="cycle-diagram"><span>▲ Api</span><i>›</i><span>◆ Daun</span><i>›</i><span>■ Batu</span><i>›</i><span>● Air</span><i>›</i><span>▲ Api</span></div>
      <div class="mode-pick" id="mode-pick"></div>
      <p class="title-foot">Keyboard: 1–5 pilih kartu · D buang &amp; tarik · M suara · Esc menu · Offline penuh, tanpa jaringan.</p>
    </div>`;
  const pick = ov.querySelector('#mode-pick');
  modes.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-card';
    b.style.setProperty('--accent', m.accent);
    b.innerHTML = `<b>${m.name}</b><span>${m.subtitle}</span><span class="mode-foe">Lawan: ${m.foeName} — ${m.foeTitle}</span>`;
    b.addEventListener('click', () => onPick(m.id));
    pick.appendChild(b);
  });
  app.appendChild(ov);
  return ov;
}

// End overlay: win flourish or defeat, with the duel's stats.
export function buildEnd(app, onAgain, onMenu) {
  const ov = document.createElement('div');
  ov.id = 'end-overlay';
  ov.className = 'overlay hidden';
  ov.innerHTML = `
    <div class="title-card end-card">
      <div class="title-kicker" id="end-kicker"></div>
      <h1 id="end-title"></h1>
      <p class="title-sub" id="end-sub"></p>
      <div class="end-stats" id="end-stats"></div>
      <div class="end-buttons">
        <button id="btn-again" type="button">Main Lagi (R)</button>
        <button id="btn-endmenu" type="button">Ganti Mode</button>
      </div>
    </div>`;
  ov.querySelector('#btn-again').addEventListener('click', onAgain);
  ov.querySelector('#btn-endmenu').addEventListener('click', onMenu);
  app.appendChild(ov);
  return ov;
}

// Full re-render from state. Cheap: the table is small.
export function render(state) {
  const mode = state.mode;
  document.body.style.setProperty('--table', mode.table);
  document.body.style.setProperty('--felt', mode.felt);
  document.body.style.setProperty('--accent', mode.accent);

  $('#hud-mode').textContent = `${mode.name} — ${mode.foeName}`;
  $('#hud-round').textContent = String(state.round);
  $('#hud-score').textContent = String(state.pScore);
  $('#hud-pname').textContent = 'KAMU';
  $('#hud-plife').textContent = `${state.pLife} / ${START_LIFE}`;
  $('#hud-pbar').style.width = `${(state.pLife / START_LIFE) * 100}%`;
  $('#hud-aname').textContent = mode.foeName.toUpperCase();
  $('#hud-alife').textContent = `${state.aLife} / ${START_LIFE}`;
  $('#hud-abar').style.width = `${(state.aLife / START_LIFE) * 100}%`;
  $('#foe-name').textContent = `${mode.foeName} · ${mode.foeTitle}`;

  const reso = state.pStreak.count > 0
    ? `${SIGILS[state.pStreak.sigil].shape} ${SIGILS[state.pStreak.sigil].name} ${state.pStreak.count}/2`
    : '—';
  $('#hud-reso').textContent = reso;
  $('#hud-aimood').textContent = aiMoodLine(mode.personality, state.aLife, state.pLife);
  $('#hud-deck').textContent = `Dek: ${state.player.deck.length} kartu`;
  $('#hud-hand').textContent = `Tangan: ${state.player.hand.length} · Lawan: ${state.ai.hand.length}`;
  $('#foe-hand-count').textContent = `${state.ai.hand.length} kartu di tangan lawan`;

  // Objectives with live checkmarks.
  const objectives = [
    { done: state.winner === 'player', text: `Kalahkan ${mode.foeName}` },
    { done: state.stats.tricks >= 3, text: `Menang 3 trik (${state.stats.tricks}/3)` },
    { done: state.stats.resonances >= 1, text: `Picu 1 Resonansi (${state.stats.resonances}/1)` },
    { done: state.stats.damageDealt >= 20, text: `Beri 20 luka (${state.stats.damageDealt}/20)` },
  ];
  $('#hud-objectives').innerHTML = objectives
    .map((o) => `<li class="${o.done ? 'done' : ''}">${o.done ? '✓' : '○'} ${o.text}</li>`)
    .join('');

  $('#hud-log').innerHTML = state.log
    .map((e) => `<li><b>R${e.round}</b> ${e.text}</li>`)
    .join('');

  // Foe hand: face-down backs.
  const foeHand = $('#foe-hand');
  foeHand.innerHTML = '';
  state.ai.hand.forEach(() => foeHand.appendChild(cardElement(null, { faceDown: true, small: true })));

  // Played cards in the arena.
  const foeSlot = $('#foe-played');
  foeSlot.innerHTML = '';
  if (state.aPlayed) foeSlot.appendChild(cardElement(state.aPlayed, { small: false }));
  else foeSlot.appendChild(slotPlaceholder('Kartu lawan'));
  const playerSlot = $('#player-played');
  playerSlot.innerHTML = '';
  if (state.pPlayed) playerSlot.appendChild(cardElement(state.pPlayed, { small: false }));
  else playerSlot.appendChild(slotPlaceholder('Kartumu'));

  // Player hand.
  const hand = $('#player-hand');
  hand.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    hand.appendChild(cardElement(card, {
      index: i,
      playable: state.phase === 'pick',
      selected: state.discardMode,
    }));
  });

  // Arena line: phase hint or last verdict.
  const line = $('#arena-line');
  if (state.phase === 'pick') {
    line.textContent = state.discardMode
      ? 'Mode buang: klik 1 kartu untuk membuangnya dan menarik pengganti.'
      : 'Giliranmu — pilih 1 kartu untuk dimainkan.';
  } else if (state.phase === 'ai-think') {
    line.textContent = `${mode.foeName} sedang menimbang kartu…`;
  } else if (state.phase === 'reveal') {
    line.textContent = 'Kartu dibuka!';
  } else if (state.lastResult) {
    line.textContent = verdictLine(state.lastResult, 'Kamu', mode.foeName);
  }

  // Overlays.
  $('#title-overlay').classList.toggle('hidden', state.phase !== 'title');
  const end = $('#end-overlay');
  if (state.phase === 'over') {
    end.classList.remove('hidden');
    fillEnd(state);
  } else {
    end.classList.add('hidden');
  }

  // Discard button state.
  const btn = $('#btn-discard');
  btn.disabled = state.phase !== 'pick' || state.discardUsed;
  btn.textContent = state.discardUsed
    ? 'Buang sudah dipakai ronde ini'
    : state.discardMode ? 'Batal mode buang (D)' : 'Buang 1 kartu · tarik baru (D)';
}

function slotPlaceholder(text) {
  const d = document.createElement('div');
  d.className = 'slot-placeholder';
  d.textContent = text;
  return d;
}

function fillEnd(state) {
  const win = state.winner === 'player';
  $('#end-kicker').textContent = win ? '✦ KEMENANGAN ✦' : 'KEKALAHAN';
  $('#end-title').textContent = win ? 'TAKHTA MILIKMU' : 'TAKHTA JATUH';
  $('#end-sub').textContent = win
    ? `${state.mode.foeName} bertekuk lutut. Dewan Bara mengakui namamu — ${state.pScore} poin.`
    : `${state.mode.foeName} merebut takhta. Nyawamu habis di ronde ${state.round} — coba lagi dengan sigil berbeda.`;
  const s = state.stats;
  $('#end-stats').innerHTML = [
    ['Skor akhir', state.pScore],
    ['Trik dimenangkan', s.tricks],
    ['Luka diberikan', s.damageDealt],
    ['Luka diterima', s.damageTaken],
    ['Resonansi', s.resonances],
    ['Bentrok', s.clashes],
    ['Ronde dimainkan', state.round],
    ['Kartu dimainkan', s.cardsPlayed],
  ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
}

// Center banner: result, resonance, near miss. Auto-hides via the caller.
export function showBanner(text, kind = '') {
  const b = $('#banner');
  b.textContent = text;
  b.className = `banner show ${kind}`;
}

// Win flourish: golden confetti pieces over the table.
export function confetti() {
  const table = $('#table');
  for (let i = 0; i < 42; i += 1) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = ['#ffd166', '#ff6b35', '#4ade80', '#38bdf8', '#c084fc'][i % 5];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    table.appendChild(p);
    window.setTimeout(() => p.remove(), 2600);
  }
}
