// Ember Court — render.js
// Semua gambar ke layar: kartu, nyawa, HUD padat, jurnal, banner,
// layar judul/akhir, dan confetti. Tidak ada logika aturan di sini.

import { SIGIL_INFO, SIGILS, SIGIL_BEATS, START_HP } from './config.js';
import { cardLabel } from './deck.js';
import { endSummary } from './state.js';

function el(id) {
  return document.getElementById(id);
}

// Satu kartu menghadap atas: glyph besar, nama sigil, angka kekuatan.
export function cardElement(card, opts) {
  const o = opts || {};
  const div = document.createElement('div');
  div.className = `card sig-${card.sigil}${o.small ? ' small' : ''}${o.playable ? ' playable' : ''}`;
  if (o.index !== undefined) div.dataset.index = String(o.index);
  const info = SIGIL_INFO[card.sigil];
  const power = card.sigil === 'cermin' ? '?' : String(card.power);
  div.innerHTML =
    `<span class="card-glyph">${info.glyph}</span>` +
    `<span class="card-name">${info.name}</span>` +
    `<span class="card-power">${power}</span>` +
    `<span class="card-corner">${power}</span>`;
  if (o.onClick) div.addEventListener('click', () => o.onClick(o.index));
  return div;
}

// Punggung kartu tertutup untuk tangan lawan.
export function cardBackElement() {
  const div = document.createElement('div');
  div.className = 'card back';
  div.innerHTML = '<span class="card-glyph">🔥</span><span class="card-name">Ember</span>';
  return div;
}

// Slot kosong di arena saat belum ada kartu dimainkan.
export function emptySlotElement(label) {
  const div = document.createElement('div');
  div.className = 'card slot';
  div.innerHTML = `<span class="card-name">${label}</span>`;
  return div;
}

// Bilah nyawa: lebar persen + angka + kelas near-miss saat <= 5.
export function renderHpBar(fillEl, textEl, hp, max) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  fillEl.style.width = `${pct}%`;
  fillEl.classList.toggle('low', hp <= 5 && hp > 0);
  fillEl.classList.toggle('dead', hp <= 0);
  textEl.textContent = `${Math.max(0, hp)} / ${max}`;
}

// Tangan pemain (5 kartu, bisa diklik) dan tangan lawan (tertutup).
export function renderHands(game, ui, onPlay) {
  const myHand = el('my-hand');
  myHand.innerHTML = '';
  game.player.hand.forEach((card, i) => {
    const node = cardElement(card, {
      index: i,
      playable: game.phase === 'play',
      onClick: (idx) => onPlay(idx),
    });
    if (ui.discardArmed) node.classList.add('discard-target');
    myHand.appendChild(node);
  });
  const aiHand = el('ai-hand');
  aiHand.innerHTML = '';
  game.ai.hand.forEach(() => aiHand.appendChild(cardBackElement()));
}

// Kartu yang baru dimainkan di arena + lencana VS.
export function renderPlayed(game) {
  const mine = el('my-played');
  const foe = el('foe-played');
  mine.innerHTML = '';
  foe.innerHTML = '';
  const last = game.lastOutcome;
  if (last) {
    mine.appendChild(cardElement(last.mineCard, { small: false }));
    mine.firstChild.classList.add('deal-in');
    foe.appendChild(cardElement(last.foeCard, { small: false }));
    foe.firstChild.classList.add('deal-in');
    el('vs-badge').textContent = last.kind === 'clash' ? 'BENTROK' : last.kind === 'blocked' ? 'DITAHAN' : 'VS';
  } else {
    mine.appendChild(emptySlotElement('Kartumu'));
    foe.appendChild(emptySlotElement(game.mode.aiName));
    el('vs-badge').textContent = 'VS';
  }
}

// HUD padat: ronde, skor, meter Resonansi, status AI, misi, jurnal.
export function renderHud(game, ui) {
  el('round-label').textContent = `Ronde ${game.round}`;
  el('score-label').textContent = `Skor ${game.player.roundsWon} – ${game.ai.roundsWon}`;
  el('mode-label').textContent = game.mode.name;
  el('ai-name').textContent = game.mode.aiName;
  el('ai-blurb').textContent = game.mode.aiBlurb;

  // Meter Resonansi: streak sigil + jumlah beruntun (0/1/2).
  const streak = game.player.streakSigil
    ? `${SIGIL_INFO[game.player.streakSigil].glyph} ${SIGIL_INFO[game.player.streakSigil].name} ×${game.player.streakCount}`
    : '—';
  el('resonance-text').textContent = `Resonansimu: ${streak} (2× beruntun = +4 luka)`;
  const pips = el('resonance-pips').children;
  for (let i = 0; i < pips.length; i++) {
    pips[i].classList.toggle('on', game.player.streakCount > i);
  }
  const aiStreak = game.ai.streakSigil
    ? `${SIGIL_INFO[game.ai.streakSigil].glyph} ${SIGIL_INFO[game.ai.streakSigil].name} ×${game.ai.streakCount}`
    : '—';
  el('ai-streak-text').textContent = `Resonansi lawan: ${aiStreak}`;

  // Status AI: kartu terakhir + kepribadian.
  const last = game.lastOutcome;
  el('ai-status').textContent = last
    ? `${game.mode.aiName} memainkan ${cardLabel(last.foeCard)}. ${game.mode.aiBlurb}`
    : `${game.mode.aiName} menunggumu. ${game.mode.aiBlurb}`;

  // Misi mode ini.
  el('mission-text').textContent = game.mode.mission;
  el('mission-progress').textContent = game.mission.done
    ? `Selesai ✓ (${game.mission.count}/${game.mode.missionGoal})`
    : `${game.mission.count}/${game.mode.missionGoal}`;
  el('mission-box').classList.toggle('done', game.mission.done);

  // Jurnal duel (entri terbaru di bawah).
  const journal = el('journal');
  journal.innerHTML = '';
  game.log.slice(-9).forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    journal.appendChild(li);
  });
  journal.scrollTop = journal.scrollHeight;

  // Tombol buang-tarik dan statusnya.
  const btn = el('btn-discard');
  btn.disabled = game.phase !== 'play' || game.discardUsed;
  btn.textContent = game.discardUsed ? 'Buang dipakai ✓' : ui.discardArmed ? 'Pilih kartu untuk dibuang…' : 'Buang & Tarik (D)';
  el('discard-state').textContent = game.discardUsed
    ? 'Buang-tarik sudah dipakai ronde ini.'
    : 'Sekali per ronde: buang 1 kartu, tarik 1 baru.';
}

// Banner besar di tengah arena: Resonansi / Near Miss / Bentrok.
export function showBanner(text, kind) {
  const banner = el('banner');
  banner.textContent = text;
  banner.className = `show ${kind || 'info'}`;
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { banner.className = ''; banner.textContent = ''; }, 2200);
}

// Diagram siklus sigil di arena: Api > Daun > Batu > Air > Api.
export function renderCycle() {
  const strip = el('cycle-strip');
  strip.innerHTML = '';
  SIGILS.forEach((sigil, i) => {
    const chip = document.createElement('span');
    chip.className = 'cycle-chip';
    chip.style.setProperty('--sigil', SIGIL_INFO[sigil].color);
    chip.textContent = `${SIGIL_INFO[sigil].glyph} ${SIGIL_INFO[sigil].name}`;
    strip.appendChild(chip);
    if (i < SIGILS.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'cycle-arrow';
      arrow.textContent = '›';
      strip.appendChild(arrow);
    }
  });
  const loop = document.createElement('span');
  loop.className = 'cycle-arrow';
  loop.textContent = '↺ Api';
  strip.appendChild(loop);
  const legend = el('cycle-legend');
  legend.textContent = 'Api mengalahkan Daun · Daun mengalahkan Batu · Batu mengalahkan Air · Air mengalahkan Api · Liar mengalahkan semua · Cermin meniru lawan +1';
}

// Layar judul: tiga kartu mode + cara main + seed.
export function showTitle(game, seed) {
  document.body.dataset.mode = game.mode.id;
  el('title-screen').classList.remove('hidden');
  el('end-screen').classList.add('hidden');
  el('seed-line').textContent = `Seed ${seed} · Dek 30 kartu · Nyawa 30 · Keyboard: 1–5 main, D buang, Esc menu, R main lagi, M bisu`;
}

// Layar akhir: menang / kalah / seri + statistik + confetti bila menang.
export function showEnd(game) {
  const s = endSummary(game);
  const screen = el('end-screen');
  const title = el('end-title');
  if (s.winner === 'mine') {
    title.textContent = '👑 KAMU MENANG!';
    title.className = 'win';
    confettiBurst();
  } else if (s.winner === 'foe') {
    title.textContent = '💀 KAMU KALAH';
    title.className = 'lose';
  } else {
    title.textContent = '🤝 SERI';
    title.className = 'draw';
  }
  el('end-stats').innerHTML =
    `<p>${game.mode.aiName} · ${game.mode.name} · ${s.rounds} ronde</p>` +
    `<p>Nyawa akhir — Kamu ${s.playerHp} : ${s.aiHp} ${game.mode.aiName}</p>` +
    `<p>Resonansi ${s.resonanceHits}× · Bentrok ${s.clashes}× · Perisai menahan ${s.blocks}×</p>` +
    `<p>Misi: ${game.mission.done ? 'selesai ✓' : 'belum selesai'} (${game.mission.count}/${game.mode.missionGoal})</p>`;
  screen.classList.remove('hidden');
}

// Confetti DOM: 90 serpihan jatuh saat menang.
export function confettiBurst() {
  const layer = el('confetti');
  layer.innerHTML = '';
  const colors = ['#ff6a3d', '#ffd23d', '#7fce62', '#b78cff', '#2f7fc9', '#ff8fb0'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 4000);
}

// Gambar ulang seluruh layar dari keadaan game.
export function renderAll(game, ui, onPlay) {
  document.body.dataset.mode = game.mode.id;
  renderHpBar(el('my-hp-fill'), el('my-hp-text'), game.player.hp, START_HP);
  renderHpBar(el('ai-hp-fill'), el('ai-hp-text'), game.ai.hp, START_HP);
  renderHands(game, ui, onPlay);
  renderPlayed(game);
  renderHud(game, ui);
}
