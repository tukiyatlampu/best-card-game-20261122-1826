// Ember Court — input.js
// Keyboard + tombol: 1-5 main kartu, D buang-tarik, Esc menu, R main lagi,
// M bisu. Semua handler didaftarkan sekali dari main.js.

export function bindKeyboard(handlers) {
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key >= '1' && key <= '5') {
      handlers.play(Number(key) - 1);
    } else if (key === 'd') {
      handlers.armDiscard();
    } else if (key === 'escape') {
      handlers.toMenu();
    } else if (key === 'r') {
      handlers.replay();
    } else if (key === 'm') {
      handlers.toggleMute();
    }
  });
}

// Tombol-tombol tetap di topbar dan arena.
export function bindButtons(handlers) {
  const bind = (id, fn) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener('click', fn);
  };
  bind('btn-mute', handlers.toggleMute);
  bind('btn-menu', handlers.toMenu);
  bind('btn-discard', handlers.armDiscard);
  bind('btn-again', handlers.replay);
  bind('btn-tomenu', handlers.toMenu);
}

// Kartu mode di layar judul: klik memilih mode dan memulai duel.
export function bindModeCards(onPick) {
  document.querySelectorAll('.mode-card').forEach((node) => {
    node.addEventListener('click', () => onPick(node.dataset.mode));
  });
}
