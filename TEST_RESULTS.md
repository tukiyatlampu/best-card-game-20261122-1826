# TEST_RESULTS.md — Ember Court (best-card-game-20261122-1826)

Hasil run nyata di VM ini (Node v24.22.1; grader memakai Node 22, kode hanya
memakai stdlib + ES module). Semua perintah dijalankan dari root repo ini,
kecuali dinyatakan lain. Terakhir diperbarui: 2026-11-23 ~02:05 WIB
(19:05 UTC), setelah perbaikan terakhir (jurnal pendek + favicon data URI).

## 1. Harness logika — `node test.mjs`

```
44 passed, 0 failed
```

Yang diuji: siklus sigil (tiap sigil mengalahkan tepat 1, dikalahkan 1,
netral vs 1); Cermin = lawan +1 (vs Cermin = 6); Liar mengalahkan semua
sigil; Perisai menahan + pulih 2 (dua Perisai saling pulih); keunggulan
sigil +2 luka; luka minimal 1; Resonansi +4 (dan tidak saat sigil/pemenang
berbeda); Bentrok saat seri netral (termasuk Cermin vs Cermin); Near Miss
di 1–5, bukan di 0/6; dek 30 kartu (6/sigil, 2 Cermin, 2 Perisai, 2 Liar);
shuffle deterministik per seed; duel deterministik seed sama (seed beda
hasil beda); AI agresif = kartu terkuat; AI bertahan = Perisai saat nyawa
≤ 12, kartu terlemah bila nyawa penuh; AI penipu deterministik per seed;
buang-tarik sekali per ronde dan reset tiap ronde; tumpukan habis dikocok
ulang dari buang; **150 simulasi duel penuh** (50/mode, seed 1000–1049):
menang 76 / kalah 73 / seri 1, ronde maks 30, tanpa deadlock, tangan
selalu 5 kartu.

Selama build ditemukan dan diperbaiki 2 bug nyata dari harness ini:
AI bertahan memilih Perisai sebagai "kartu terlemah" (bobot −1) dan satu
ekspektasi luka keunggulan sigil (benar = 3, bukan 2: selisih 0 → min 1,
+2 keunggulan).

## 2. Cek sintaks — `node --check game/src/*.js`

Semua 11 modul lolos: ai, audio, config, deck, input, main, random,
render, rules, shots, state. (`game/package.json` berisi
`{"type":"module"}` agar Node memperlakukan `.js` sebagai ES module.)

## 3. E2E browser headless — Chromium 1255 + playwright-core

Skrip: `/tmp/e2e/run.mjs` (serve `game/` di 127.0.0.1:8931, viewport
1280×800). Hasil run terakhir:

```
SHOT 1-title.jpg 103732 byte
SHOT 2-table.jpg 142661 byte
SHOT 3-win.jpg 88314 byte
SHOT 4-loss.jpg 64572 byte
E2E after mode pick: {"started":true,"hand":5,"phase":"play"}
E2E after click card 3: {"round":2,"log":2,"phase":"play"}
E2E after keys 1, D, 2: {"round":3,"discardUsed":true,"hp":[30,23]}
E2E full game: {"phase":"over","winner":"foe","rounds":24,"endVisible":true}
E2E after R replay: {"phase":"play","round":1}
JS ERRORS: 0
```

Klik sungguhan (pilih mode Tembok Lumut, klik kartu ke-3), keyboard
(1 main kartu, D + 2 buang-tarik), duel penuh 24 ronde sampai layar akhir
muncul, lalu R main lagi ke ronde 1. **0 JS exception, 0 console error,
0 request gagal.** Dua 404 favicon pada run pertama diperbaiki dengan
`<link rel="icon" href="data:,">` di `index.html`; run berikutnya 0 error.

## 4. Screenshot — render nyata, dilihat langsung

4 JPEG 1280×800, masing-masing ≤ 256 KiB, dari `?shot=...&seed=20261122`
via headless Chromium (bukan edit/komposit):

| File | Isi | Ukuran |
| --- | --- | --- |
| `screenshots/1-title.jpg` | Layar judul + 3 kartu mode | 103.732 byte |
| `screenshots/2-table.jpg` | Meja live ronde 5 | 142.661 byte |
| `screenshots/3-win.jpg` | Layar menang + confetti | 88.314 byte |
| `screenshots/4-loss.jpg` | Layar kalah | 64.572 byte |

Cover = `1-title.jpg` (pertama menurut nama). Semua screenshot dilihat
langsung di sesi ini: judul terbaca, meja menampilkan tangan pemain +
lawan, kartu bernilai + sigil berwarna, nyawa 23/30 vs 27/30, meter
Resonansi, status AI, misi, jurnal (entri 1–5 lengkap), dan legenda siklus.

## 5. main.ts — 2 run deterministik

```
MAKEFUN_OUTPUT_DIR=/tmp/f1 node main.ts   # dossier 592.523 byte
MAKEFUN_OUTPUT_DIR=/tmp/f2 node main.ts   # dossier 592.523 byte
cmp /tmp/f1/dossier.json /tmp/f2/dossier.json  -> identik
diff -r /tmp/f1 /tmp/f2                     -> identik
```

Verifikasi independen: `buildDossier` dijalankan ulang atas `/tmp/f1`
dan dibandingkan byte-per-byte dengan `dossier.json` yang ditulis
`main.ts` → **identik**. Dossier: schema `makefun/dossier/v1`,
14 source file (57.485 byte teks, di bawah cap 160 KiB), 4 gambar,
total output 1.066.379 byte (di bawah cap 64 MiB).

## 6. Zero-fail QA — direktori bersih

Salin repo ke `/tmp/qa-clean`, jalankan dari sana:

```
node test.mjs            -> 44 passed, 0 failed
MAKEFUN_OUTPUT_DIR=/tmp/qa-out node main.ts
                         -> dossier ditulis (592.523 byte), game/ + screenshots/ + dossier.json lengkap
```

Scan secret: tidak ada API key / password / token di file repo
(`grep -riE api[_-]?key|password|secret|token` → nihil).
Scan network: tidak ada `http(s)://`, `fetch(`, `eval(`, `new Function`,
`document.cookie`, atau service worker di `game/` (grep → nihil).
`game/index.html` = 5.463 byte (di bawah cap 1 MiB).

## 7. Judge 2-pass (SolAPI gpt-6.1-sol Mode MAX)

**TIDAK JALAN — SolAPI `/v1/responses` HTTP 503.** Dicek 2× di sesi ini
(18:47 dan ~19:00 WIB; helper retry 3× tiap percobaan, total 6 upaya
gagal) setelah seharian 503 pada 2026-11-22. Karena itu **tidak ada skor
judge yang diklaim**. Sebagai gantinya dilakukan self-critique
terstruktur terhadap 5 kriteria juri:

1. Kelengkapan (judul, meja, tangan pemain + lawan, nilai/sigil terbaca,
   nyawa, menang, kalah) — terpenuhi, dibuktikan 4 screenshot.
2. Kedalaman (siklus 4 sigil + 3 spesial + Resonansi + Bentrok + Near
   Miss + buang-tarik + 3 AI berkepribadian + misi) — kuat; kelemahan
   yang diakui: AI tidak membaca sigil tangan pemain.
3. Feel (animasi deal, banner, confetti, synth WebAudio + bisu) — kuat;
   kelemahan: belum ada flip 3D kartu, hanya animasi deal.
4. Tampilan/orisinalitas (nama + tema Indonesia orisinal, sigil beda
   warna + glyph + nama, palet per mode) — kuat.
5. Struktur (11 modul, satu tugas tiap file, nama sesuai fungsi) —
   kuat; dossier outline menampilkan `config/deck/rules/ai/state/
   render/input/audio/shots/main` + `index.html` + `style.css`.

Perbaikan dari self-critique yang sudah diterapkan: jurnal ronde
dipersingkat (1–2 baris/entri) agar 5 entri muat penuh di screenshot
meja; favicon `data:` agar 0 console error.
