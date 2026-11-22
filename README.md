[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/tukiyatlampu/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/tukiyatlampu/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# 🔥 Ember Court — Duel Kartu Sigil

Duel kartu 1v1 orisinal berbahasa Indonesia, offline penuh, tanpa build step. Nyawa 30 lawan 30; tiap ronde kedua pihak main 1 kartu bersamaan. Siklus sigil **Api > Daun > Batu > Air > Api**; kekuatan 1–9 memutuskan bila sigil netral. Kartu spesial: **Cermin** (meniru lawan +1), **Perisai** (menahan serangan + pulih 2), **Liar** (unggul atas semua sigil). Menang 2 ronde beruntun dengan sigil sama → **Resonansi +4 luka**. Seri kekuatan → **Bentrok −2 keduanya**. Korban tersisa ≤ 5 nyawa → **Near Miss**. Buang 1 kartu & tarik baru 1×/ronde. Dek 30 kartu, RNG deterministik (seed sama → shuffle sama).

Tiga mode bernama, masing-masing tema + palet + AI berkepribadian sendiri: **Bara Memburu** (Raka si Pemburu, agresif — selalu kartu terkuat), **Tembok Lumut** (Sari si Penjaga, bertahan — berperisai saat nyawa rendah), **Topeng Asap** (Wira si Penipu, acak/bluff). HUD padat: nyawa, skor, ronde, meter Resonansi, status AI, misi, jurnal duel, legenda siklus. Ada banner Resonansi/Near Miss, animasi deal/flip, confetti saat menang, synth WebAudio (tombol bisu), dan keyboard **1–5** main kartu, **D** buang-tarik, **Esc** menu, **R** main lagi, **M** bisu.

## Cara main

Buka `game/index.html` di desktop Chrome (cukup double-click, atau layani statis: `python3 -m http.server` dari folder `game/`). Pilih mode, klik kartu atau tekan 1–5.

## Tes cepat

```sh
node test.mjs            # harness logika: 44 cek, 0 gagal
node --check game/src/rules.js   # contoh cek sintaks modul (berlaku untuk semua modul di game/src/)
MAKEFUN_OUTPUT_DIR=out node main.ts   # tulis game + screenshots + dossier.json ke out/
```

## Struktur

- `main.ts` — program penyerahan: salin `game/` + `screenshots/` ke output, tulis `dossier.json` via `buildDossier` (Node 22 stdlib saja).
- `game/index.html`, `game/style.css` — meja + HUD, tanpa dependensi jaringan.
- `game/src/` — `config` (angka & mode), `random` (RNG seed), `deck` (dek 30 kartu), `rules` (mesin aturan murni), `ai` (3 kepribadian), `state` (alur duel + misi), `render` (DOM + banner + confetti), `input` (keyboard/tombol), `audio` (synth WebAudio), `shots` (preset screenshot `?shot=`), `main` (bootstrap).
- `screenshots/` — 4 render nyata dari kode ini (1280×800 JPEG): judul, meja live, menang, kalah.
- `TEST_RESULTS.md` — bukti run nyata semua tes di atas.
