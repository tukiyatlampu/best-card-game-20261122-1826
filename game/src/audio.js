// audio.js — tiny WebAudio synth. No audio files, no network.
// One job: bleeps for play, flip, win and loss. Silent until the first gesture.

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  if (muted) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + when);
    o.stop(c.currentTime + when + dur);
  } catch (_) {
    // Audio is decoration; a blocked context never breaks the game.
  }
}

export function sfxPlay() { tone(520, 0.12, 'triangle'); tone(780, 0.1, 'triangle', 0.05, 0.06); }
export function sfxFlip() { tone(880, 0.07, 'square', 0.04); }
export function sfxWinRound() { tone(660, 0.12, 'triangle'); tone(990, 0.16, 'triangle', 0.07, 0.08); }
export function sfxLoseRound() { tone(220, 0.2, 'sawtooth', 0.05); }
export function sfxResonance() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, i * 0.07)); }
export function sfxVictory() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, i * 0.12)); }
export function sfxDefeat() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.05, i * 0.14)); }

export function toggleMuted() {
  muted = !muted;
  return muted;
}
export function isMuted() { return muted; }
