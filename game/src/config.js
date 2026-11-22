// config.js — every tunable number, sigil, card and mode of EMBER COURT.
// One job: the game's data. No logic lives here.

export const START_LIFE = 30;
export const HAND_SIZE = 5;
export const CLASH_DAMAGE = 2;
export const ADVANTAGE_DAMAGE = 3;
export const RESONANCE_BONUS = 4;
export const RESONANCE_STREAK = 2;
export const WARD_HEAL = 2;
export const NEAR_MISS_LIFE = 5;
export const MIRROR_BASE = 5;

// Sigil cycle: FLAME beats LEAF, LEAF beats STONE, STONE beats TIDE, TIDE beats FLAME.
// Each sigil is told apart by colour AND shape AND name, never by text alone.
export const SIGILS = {
  FLAME: { id: 'FLAME', name: 'Api', shape: '▲', color: '#ff6b35', dark: '#7c2d12', beats: 'LEAF' },
  LEAF: { id: 'LEAF', name: 'Daun', shape: '◆', color: '#4ade80', dark: '#14532d', beats: 'STONE' },
  STONE: { id: 'STONE', name: 'Batu', shape: '■', color: '#d6a35c', dark: '#57534e', beats: 'TIDE' },
  TIDE: { id: 'TIDE', name: 'Air', shape: '●', color: '#38bdf8', dark: '#0c4a6e', beats: 'FLAME' },
  WILD: { id: 'WILD', name: 'Liar', shape: '★', color: '#c084fc', dark: '#581c87', beats: null },
};

export const SIGIL_ORDER = ['FLAME', 'LEAF', 'STONE', 'TIDE'];

// 26 cards. power = printed power; kind: 'atk' | 'mirror' | 'ward' | 'wild'.
// Mirror copies the foe's base power +1. Ward negates the round and heals.
// Wild counts as sigil-advantaged against anything, power fixed at 4.
export const CARD_DEFS = [
  // FLAME
  { id: 'FL2', sigil: 'FLAME', power: 2, kind: 'atk', name: 'Percik Bara' },
  { id: 'FL4', sigil: 'FLAME', power: 4, kind: 'atk', name: 'Lidah Api' },
  { id: 'FL6', sigil: 'FLAME', power: 6, kind: 'atk', name: 'Badai Bara' },
  { id: 'FL8', sigil: 'FLAME', power: 8, kind: 'atk', name: 'Mahkota Inferno' },
  { id: 'FLM', sigil: 'FLAME', power: 5, kind: 'mirror', name: 'Cermin Bara' },
  { id: 'FLW', sigil: 'FLAME', power: 1, kind: 'ward', name: 'Perisai Abu' },
  // LEAF
  { id: 'LE2', sigil: 'LEAF', power: 2, kind: 'atk', name: 'Tunas Muda' },
  { id: 'LE4', sigil: 'LEAF', power: 4, kind: 'atk', name: 'Daun Berbisik' },
  { id: 'LE6', sigil: 'LEAF', power: 6, kind: 'atk', name: 'Akar Menjalar' },
  { id: 'LE8', sigil: 'LEAF', power: 8, kind: 'atk', name: 'Mahkota Rimba' },
  { id: 'LEM', sigil: 'LEAF', power: 5, kind: 'mirror', name: 'Cermin Daun' },
  { id: 'LEW', sigil: 'LEAF', power: 1, kind: 'ward', name: 'Perisai Lumut' },
  // STONE
  { id: 'ST2', sigil: 'STONE', power: 2, kind: 'atk', name: 'Kerikil Tajam' },
  { id: 'ST4', sigil: 'STONE', power: 4, kind: 'atk', name: 'Batu Pijak' },
  { id: 'ST6', sigil: 'STONE', power: 6, kind: 'atk', name: 'Pilar Granit' },
  { id: 'ST8', sigil: 'STONE', power: 8, kind: 'atk', name: 'Gunung Runtuh' },
  { id: 'STM', sigil: 'STONE', power: 5, kind: 'mirror', name: 'Cermin Batu' },
  { id: 'STW', sigil: 'STONE', power: 1, kind: 'ward', name: 'Perisai Batu' },
  // TIDE
  { id: 'TI2', sigil: 'TIDE', power: 2, kind: 'atk', name: 'Tetes Embun' },
  { id: 'TI4', sigil: 'TIDE', power: 4, kind: 'atk', name: 'Arus Tenang' },
  { id: 'TI6', sigil: 'TIDE', power: 6, kind: 'atk', name: 'Gelombang Pasang' },
  { id: 'TI8', sigil: 'TIDE', power: 8, kind: 'atk', name: 'Pusaran Samudra' },
  { id: 'TIM', sigil: 'TIDE', power: 5, kind: 'mirror', name: 'Cermin Ombak' },
  { id: 'TIW', sigil: 'TIDE', power: 1, kind: 'ward', name: 'Perisai Karang' },
  // WILD (no sigil of its own)
  { id: 'WI1', sigil: 'WILD', power: 4, kind: 'wild', name: 'Angin Tak Bernama' },
  { id: 'WI2', sigil: 'WILD', power: 4, kind: 'wild', name: 'Bayang Tanpa Wujud' },
];

// Three named duels. Each has its own theme, palette and AI personality.
export const MODES = {
  ember: {
    id: 'ember',
    name: 'Ember Court',
    subtitle: 'Dewan Bara · Takhta Api',
    foeName: 'Cinder Baron',
    foeTitle: 'Baron Bara · Agresif',
    personality: 'aggressive',
    accent: '#ff6b35',
    table: '#3b1d0f',
    felt: '#5c2a12',
  },
  tide: {
    id: 'tide',
    name: 'Tide Hollow',
    subtitle: 'Relung Pasang · Kedalaman Air',
    foeName: 'Drowned Duchess',
    foeTitle: 'Adipati Tenggelam · Bertahan',
    personality: 'defensive',
    accent: '#38bdf8',
    table: '#0b2233',
    felt: '#123a52',
  },
  thorn: {
    id: 'thorn',
    name: 'Thornwood',
    subtitle: 'Hutan Duri · Takhta Rimba',
    foeName: 'Bramble Queen',
    foeTitle: 'Ratu Semak · Penipu',
    personality: 'trickster',
    accent: '#4ade80',
    table: '#12240f',
    felt: '#1d3a17',
  },
};

export const MODE_ORDER = ['ember', 'tide', 'thorn'];

export const SCORE = { trick: 100, damage: 10, resonance: 150, clash: 25, win: 500 };
