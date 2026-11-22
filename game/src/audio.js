// Ember Court — audio.js
// Synth WebAudio tanpa file suara: tiap efek adalah osilator pendek.
// AudioContext dibuat saat gestur pertama (aturan autoplay browser).

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Pastikan ada AudioContext; gagal diam-diam bila browser menolak.
export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch (err) { /* suara tidak wajib */ }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Satu nada: frekuensi, durasi detik, bentuk gelombang, volume.
export function tone(freq, seconds, type, volume, when) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ac.currentTime + (when || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume || 0.12, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  } catch (err) { /* abaikan */ }
}

// Efek bernama: klik, main kartu, menang/kalah ronde, resonansi, akhir.
export function playSfx(name) {
  if (muted) return;
  if (name === 'click') tone(660, 0.07, 'triangle', 0.08);
  else if (name === 'play') { tone(392, 0.09, 'square', 0.07); tone(523, 0.12, 'square', 0.06, 0.07); }
  else if (name === 'win-round') { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.1, 0.09); tone(784, 0.16, 'triangle', 0.1, 0.18); }
  else if (name === 'lose-round') { tone(330, 0.12, 'sawtooth', 0.06); tone(247, 0.18, 'sawtooth', 0.06, 0.11); }
  else if (name === 'clash') { tone(180, 0.15, 'square', 0.1); tone(140, 0.2, 'square', 0.09, 0.08); }
  else if (name === 'shield') { tone(880, 0.1, 'sine', 0.09); tone(1174, 0.14, 'sine', 0.07, 0.08); }
  else if (name === 'resonance') { tone(523, 0.12, 'triangle', 0.11); tone(659, 0.12, 'triangle', 0.11, 0.08); tone(784, 0.12, 'triangle', 0.11, 0.16); tone(1046, 0.22, 'triangle', 0.11, 0.24); }
  else if (name === 'win-game') { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.11)); }
  else if (name === 'lose-game') { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.06, i * 0.14)); }
}
