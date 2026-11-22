# TEST_RESULTS.md — Ember Court (best-card-game-20261122-1826)

Ringkasan run nyata. Semua perintah dijalankan di VM ini; tidak ada output exec
yang di-redirect ke file repo — file ini ditulis tangan dari hasil run tersebut.

## 1. Harness logika — `node /tmp/test-card-game.mjs`

121 checks, **121 pass, 0 fail**.

- Dek: 26 kartu (4 sigil × 6 + 2 Liar), 4 Cermin, 4 Perisai; RNG deterministik
  (seed sama → shuffle sama).
- Siklus sigil: Api > Daun > Batu > Air > Api; Liar unggul atas semua sigil;
  Liar vs Liar netral; sigil sama netral.
- Cermin: meniru kekuatan lawan +1 (lawan 8 → 9; Cermin vs Cermin → 6;
  Cermin vs Perisai → 2). Liar selalu berkekuatan 4.
- Resolusi: keunggulan menang walau lebih lemah (luka 3); keunggulan +
  selisih kekuatan (8 vs 6 → 5 luka); seri kekuatan → BENTROK, keduanya −2;
  Perisai menahan + pulih 2; dua Perisai → keduanya +2.
- Resonansi: menang 2× beruntun dengan sigil sama → +4 luka (6 vs 6 +
  streak Api → 7 luka).
- Near miss: korban tersisa ≤ 5 nyawa terdeteksi; nyawa tidak pernah < 0.
- AI: defensif di nyawa ≤ 12 memainkan Perisai; agresif memilih indeks valid.
- 90 game simulasi penuh (30 per mode, pemain acak): semua berakhir < 200
  ronde, 0 seri. Menang pemain: Ember 15/30, Tide 15/30, Thorn 10/30
  (pemain acak — bukan ukuran skill; membuktikan tidak ada deadlock).

## 2. Syntax — semua modul ES

`node --input-type=module --check` pada 10 file `game/src/*.js`: semua OK.

## 3. End-to-end browser (CDP, Chromium headless) — `node /tmp/cdp-test.mjs`

19 checks, **19 pass, 0 fail, 0 JS exception**.

- Title menampilkan 3 mode; pilih Tide Hollow → HUD, tangan 5 kartu,
  tangan lawan 5 kartu tertutup, ronde 1.
- Klik kartu → kartu pindah ke meja; AI menjawab; verdict muncul di arena;
  ronde maju ke 2; tangan diisi ulang ke 5.
- Buang & tarik: tangan tetap 5, tombol nonaktif setelah dipakai.
- Keyboard "2" memainkan kartu ke-2.
- Loop 4 ronde tambahan: mencapai ronde ≥ 6, jurnal duel terisi.
- Screenshot live table tersimpan di `/tmp/shots/live.png`.

## 4. Screenshot — 4 render nyata via chrome-headless-shell

`--window-size=1280,800 --virtual-time-budget=6000`, `?shot=<...>&seed=7`:

- `1-play.jpg` 112.604 byte — meja live: tangan pemain + lawan, kartu
  terbuka 8 Api vs 6 Daun, nyawa 24/30 vs 10/30, skor 680, banner
  RESONANSI +4, HUD lengkap.
- `2-title.jpg` 74.522 byte — title + 3 mode.
- `3-win.jpg` 54.081 byte — TAKHTA MILIKMU + 8 statistik.
- `4-loss.jpg` 52.240 byte — TAKHTA JATUH + 8 statistik.
- Semua 1280×800 JPEG, < 256 KiB. Dilihat langsung hasil rendernya.

## 5. Entrypoint — `main.ts` (2 run, determinisme)

```sh
mkdir -p out out2 && MAKEFUN_OUTPUT_DIR=out node main.ts && MAKEFUN_OUTPUT_DIR=out2 node main.ts
diff -r out out2   # IDENTICAL
```

- `out/` berisi `dossier.json` (450.221 byte, < 1,5 MiB), `game/` (12 file),
  `screenshots/` (4 file). Dossier schema `makefun/dossier/v1`, cover = index 0
  (`1-play.jpg`), teks dossier 56.846 byte (< 163.840), memuat ke-12 file game.

## 6. Zero-fail QA — direktori bersih `/tmp/qa-clean`

Salinan paket (tanpa `out/`) → `MAKEFUN_OUTPUT_DIR=out node main.ts` OK.
Gate checks: game 12 file (cap 993), 56.020 byte (cap 48 MiB),
`index.html` 380 byte (cap 1 MiB), 4 screenshot ≤ 256 KiB, nama file valid,
tidak ada referensi jaringan di `game/` maupun `main.ts` (grep `http://`,
`https://`, `//host`: kosong). Render dari direktori bersih byte-identik
dengan render dari direktori kerja (md5 sama).

## 7. SolAPI judge — TIDAK JALAN

`POST /v1/responses` HTTP 503 pada 2 percobaan terpisah (helper retry 3×
internal tiap percobaan). `GET /v1/models` HTTP 200 — endpoint list hidup,
responses mati sepanjang 22 Nov. Karena itu **tidak ada skor judge 2-pass
yang diklaim**. Sebagai gantinya: self-critique terstruktur terhadap 5
kriteria juri (lihat laporan koordinator) + 4 perbaikan nyata ditemukan dan
diperbaiki dari screenshot (face-down crash, banner menempel, duplikasi
prefix log, tanpa animasi flip).
