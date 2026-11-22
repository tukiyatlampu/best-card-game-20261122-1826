[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/tukiyatlampu/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/tukiyatlampu/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Ember Court — Duel Empat Sigil

Duel kartu 1 lawan 1 di browser, offline penuh, tanpa build step. Setiap ronde kedua duelist memainkan 1 kartu secara bersamaan: sigil yang unggul menang, kekuatan memutuskan sisanya. Menang 2 ronde beruntun dengan sigil yang sama memicu **Resonansi +4**. Kalahkan lawan hingga nyawanya 0.

- **26 kartu, 4 sigil** (Api ▲, Daun ◆, Batu ■, Air ●) + kartu Liar ★, Cermin ↻, dan Perisai — tiap sigil dibedakan warna, bentuk, dan nama.
- **3 mode bernama** dengan tema, palet, dan AI berkepribadian sendiri: Ember Court vs Cinder Baron (agresif), Tide Hollow vs Drowned Duchess (bertahan), Thornwood vs Bramble Queen (penipu).
- **HUD padat**: nyawa, skor, ronde, meter Resonansi, status AI, misi, jurnal duel, siklus sigil.
- **Rasa**: kartu meluncur, berbalik, dan menancap; banner Resonansi / Near Miss; confetti saat menang; efek suara synth WebAudio (M untuk bisu).
- **Kontrol**: klik kartu atau tombol 1–5, D buang & tarik 1 kartu per ronde, Esc menu, R main lagi.

## Main

```sh
# tanpa build: layani folder game/ dengan server statis apa pun, lalu buka:
python3 -m http.server 8080 --directory game
# buka http://localhost:8080
```

Atau `node serve.ts` bila ada. Screenshot deterministik: `index.html?shot=play|title|win|loss&seed=7`.

## Tes cepat

```sh
for f in game/src/*.js; do node --check "$f"; done   # syntax 10 modul ES
MAKEFUN_OUTPUT_DIR=/tmp/ember-out node main.ts       # tulis dossier.json + salinan game/
```

Lihat `TEST_RESULTS.md` untuk bukti run nyata.

## Struktur

```
main.ts            entrypoint: salin game/ + screenshots/ ke /output, tulis dossier.json
game/index.html    halaman game (tanpa dependensi jaringan)
game/style.css     semua tampilan (CSS saja, tanpa gambar/font eksternal)
game/src/config.js data: sigil, 26 kartu, 3 mode
game/src/deck.js   bangun/acak/tarik dek + RNG deterministik
game/src/rules.js  resolusi ronde: keunggulan sigil, Cermin, Perisai, Resonansi
game/src/ai.js     3 kepribadian AI (agresif / bertahan / penipu)
game/src/state.js  state duel + transisi fase
game/src/render.js HUD padat, meja, kartu, banner, layar akhir
game/src/input.js  mouse + keyboard
game/src/audio.js  synth WebAudio (tanpa file audio)
game/src/shots.js  state deterministik untuk 4 screenshot
screenshots/      4 render nyata game (cover: 1-play.jpg)
vendor/makefun-game.ts  pustaka dossier dari kit (tidak diubah)
```

## Lisensi

MIT — lihat `LICENSE`.
