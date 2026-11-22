// input.js — mouse and keyboard for the duel.
// One job: translate clicks and keys into state actions. No rendering here.

import { discardAndDraw, playPlayerCard } from './state.js';

// controller: { state, onAction(fn), onDiscardToggle(), onSoundToggle(), onMenu(), onAgain() }
// onAction wraps every state change so main.js can re-render + play sounds.
export function bindInput(controller) {
  const hand = document.querySelector('#player-hand');
  hand.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card');
    if (!cardEl || cardEl.dataset.index == null) return;
    const idx = Number(cardEl.dataset.index);
    controller.act(() => {
      const st = controller.state;
      if (st.discardMode) return discardAndDraw(st, idx);
      return playPlayerCard(st, idx);
    });
  });

  document.querySelector('#btn-discard').addEventListener('click', () => {
    controller.act(() => {
      const st = controller.state;
      if (st.phase !== 'pick' || st.discardUsed) return false;
      st.discardMode = !st.discardMode;
      return true;
    });
  });
  document.querySelector('#btn-sound').addEventListener('click', () => controller.toggleSound());
  document.querySelector('#btn-menu').addEventListener('click', () => controller.toMenu());

  document.addEventListener('keydown', (ev) => {
    const st = controller.state;
    if (ev.key >= '1' && ev.key <= '5') {
      const idx = Number(ev.key) - 1;
      if (st.phase === 'pick' && idx < st.player.hand.length) {
        controller.act(() => (st.discardMode ? discardAndDraw(st, idx) : playPlayerCard(st, idx)));
      }
    } else if (ev.key === 'd' || ev.key === 'D') {
      controller.act(() => {
        if (st.phase !== 'pick' || st.discardUsed) return false;
        st.discardMode = !st.discardMode;
        return true;
      });
    } else if (ev.key === 'm' || ev.key === 'M') {
      controller.toggleSound();
    } else if (ev.key === 'Escape') {
      controller.toMenu();
    } else if ((ev.key === 'r' || ev.key === 'R') && st.phase === 'over') {
      controller.again();
    } else if (ev.key === 'Enter' && st.phase === 'title') {
      controller.pickMode(st.mode.id);
    }
  });
}
