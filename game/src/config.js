// Ember Court — config.js
// Semua angka dan teks yang mengatur duel. Satu sumber kebenaran untuk
// aturan, dek, mode, dan palet; modul lain hanya membaca dari sini.

export const START_HP = 30;
export const HAND_SIZE = 5;
export const NEAR_MISS_HP = 5;
export const CLASH_DAMAGE = 2;
export const SHIELD_HEAL = 2;
export const RESONANCE_BONUS = 4;
export const ADVANTAGE_BONUS = 2;

// Siklus sigil: Api > Daun > Batu > Air > Api. Tiap sigil mengalahkan satu,
// dikalahkan satu, dan netral melawan satu sigil lainnya.
export const SIGILS = ['api', 'daun', 'batu', 'air'];
export const SIGIL_BEATS = { api: 'daun', daun: 'batu', batu: 'air', air: 'api' };
export const SIGIL_INFO = {
  api: { name: 'Api', glyph: '🔥', color: '#e2482e', dark: '#7a1d10' },
  daun: { name: 'Daun', glyph: '🍃', color: '#3f9e4d', dark: '#1d5c28' },
  batu: { name: 'Batu', glyph: '🪨', color: '#8a7f8d', dark: '#4c4550' },
  air: { name: 'Air', glyph: '💧', color: '#2f7fc9', dark: '#174a7d' },
  cermin: { name: 'Cermin', glyph: '🪞', color: '#c9a227', dark: '#6d5610' },
  perisai: { name: 'Perisai', glyph: '🛡️', color: '#4d7c8a', dark: '#274b57' },
  liar: { name: 'Liar', glyph: '🃏', color: '#8e5fc0', dark: '#4b2a72' },
};

// Kekuatan kartu sigil yang masuk dek: 6 tingkat per sigil.
export const SIGIL_POWERS = [3, 4, 5, 6, 7, 8];
export const SPECIAL_COUNTS = { cermin: 2, perisai: 2, liar: 2 };
export const MIRROR_BASE_POWER = 5;
export const WILD_POWER = 6;
export const SHIELD_POWER = 0;

// Tiga mode bernama: tema, palet, kepribadian AI, dan misi masing-masing.
export const MODES = {
  berburu: {
    id: 'berburu',
    name: 'Bara Memburu',
    tagline: 'Raka menyerang tanpa henti. Bertahanlah dari bara.',
    aiName: 'Raka si Pemburu',
    aiPersonality: 'agresif',
    aiBlurb: 'Selalu memainkan kartu terkuat di tangannya.',
    mission: 'Menangkan 3 ronde dengan sigil Api',
    missionGoal: 3,
    palette: { bg: '#1c0f0a', panel: '#2a1710', accent: '#ff6a3d', ink: '#ffe8d6' },
  },
  tembok: {
    id: 'tembok',
    name: 'Tembok Lumut',
    tagline: 'Sari menunggu di balik perisai. Pancing ia keluar.',
    aiName: 'Sari si Penjaga',
    aiPersonality: 'bertahan',
    aiBlurb: 'Berperisai saat nyawanya rendah, menyimpan kartu kuat.',
    mission: 'Tahan 3 serangan dengan Perisai',
    missionGoal: 3,
    palette: { bg: '#0d1a10', panel: '#152619', accent: '#7fce62', ink: '#e2f5d8' },
  },
  topeng: {
    id: 'topeng',
    name: 'Topeng Asap',
    tagline: 'Wira menipu di setiap ronde. Jangan percaya polanya.',
    aiName: 'Wira si Penipu',
    aiPersonality: 'penipu',
    aiBlurb: 'Memainkan kartu acak — kadang umpan, kadang Liar.',
    mission: 'Menangkan 2 ronde dengan kartu Liar',
    missionGoal: 2,
    palette: { bg: '#150f22', panel: '#1f1733', accent: '#b78cff', ink: '#efe6ff' },
  },
};
export const MODE_ORDER = ['berburu', 'tembok', 'topeng'];
export const DEFAULT_SEED = 20261122;
export const GAME_TITLE = 'Ember Court';
export const GAME_SUBTITLE = 'Duel Kartu Sigil — Dewan Bara';
