# Audit responsivitas dan keandalan — 4 November 2026

## Ruang lingkup dan hasil

Audit aplikasi existing: navigasi Employee/Leader, pengiriman aset, flashcard, audio perangkat, menu ujian baru, lokalisasi, serta regresi autentikasi dan data. Tidak ada perubahan skema, akun, hasil ujian, aturan level, mingguan, ranking, SRS atau hadiah XP. Tidak menambah layanan, API suara, dependensi atau biaya hosting.

| Temuan | Perbaikan / bukti |
|---|---|
| JS/CSS memakai `no-store`; kunjungan ulang harus mengunduh isinya lagi | Aset publik allowlist mendapat ETag per representasi dan `public, max-age=0, must-revalidate`. File berubah tetap diambil setelah deploy; cocok mendapat 304. HTML dan seluruh API tetap `no-store`. |
| Origin belum mengompres teks | Gzip sekali per aset pada proses produksi; memori dibatasi allowlist. Namun baseline produksi menunjukkan Render **sudah** gzip di edge: tidak mengklaim tambahan hemat 68% di cloud. Rasio lokal sekitar 68% adalah mentah versus gzip, bukan benchmark sebelum/sesudah. |
| Viewer ujian arsip dimuat pada semua kunjungan | `official-exam.js` baru diimpor ketika membuka sesi arsip. |
| Tab Evaluasi menunggu Buku Kesalahan yang belum diperlukan | Buku Kesalahan baru diminta pada tab Latihan. Error memiliki retry tersendiri, tidak menghalangi latihan bagian. Pembaruan hanya area riwayat agar pilihan level/paket tidak ter-reset. Respons lama tidak mengubah halaman baru. |
| Pembacaan API dapat menunggu tanpa batas | Deadline GET 15 detik dengan pesan ID/中文 dan tombol retry halaman. Mutasi jawaban/progres tidak diberi retry otomatis atau konfirmasi penyimpanan palsu. |
| Speech observer memindai seluruh area pada setiap perubahan teks | Hanya kontrol yang ditambahkan dipindai; perubahan daftar voice masih disinkronkan. Audio aktif dihentikan saat tab disembunyikan. Playback langsung menggantikan audio sebelumnya; callback lama diabaikan, teks kosong ditolak. |
| Tiga ringkasan dinamis Leader masih berbahasa Indonesia pada 中文 | Pola terjemahan diperbaiki; uji lokalisasi yang sempat gagal kemudian lulus. Isi materi/soal dan identitas tetap dipertahankan. |

## Pengujian yang dijalankan

- `node --test tests/*.test.mjs`: **84 lulus, 0 gagal**. Termasuk PostgreSQL/PGlite, RLS, isolasi akun, reset single-use/session revocation, kontrak Supabase mock, XP anti-duplikasi, SRS, placement dan mingguan.
- `node tests/responsiveness-ui.mjs`: lulus. Lazy viewer/riwayat, gagal riwayat dan retry, pilihan paket tetap, respons terlambat, GET timeout (deadline dipercepat dalam tes) dan retry; pembatalan audio tumpang tindih/tab tersembunyi dengan engine mock.
- `node tests/navigation-ui.mjs`: lulus, reaksi navigasi lokal **175 ms** dengan respons paket diberi delay 600 ms; satu dashboard read, sidebar tutup, cache dan isolasi respons lama.
- `node tests/flashcard-ui.mjs`: lulus, perpindahan prefetched **57 ms** dengan delay API kartu 600 ms; gagal simpan/retry, recall tanpa review ganda, mobile dan 中文.
- `node tests/listening-ui.mjs`: lulus, preferred/fallback Mandarin, stop/retry, batas startup 2,5 detik, perangkat tanpa voice disembunyikan. Transport suara mock.
- `node tests/exam-center-ui.mjs`: lulus, tiga jalur, kebijakan 80/60, satu tingkat, reserve privat, simpan/jeda/refresh, pembahasan dan koreksi Buku Kesalahan, XP tidak berubah, mobile/中文.
- `node tests/i18n-ui.mjs`, `node tests/leader-portal-ui.mjs`, `node tests/learning-language-ui.mjs`: lulus kedua portal, draft, jawaban aktif, green completed grammar, read-only, viewport 360px dan desktop. Uji learning-language awal menemukan tiga string; setelah perbaikan dijalankan ulang dan lulus.
- `node tests/learning-play-ui.mjs`: lulus game/story/recorder, unsupported/denied microphone/audio/ASR, 360px; media mock.
- `node scripts/build-production.mjs`: lulus, syntax/security lint **98 JS files**. Tidak ada TypeScript dalam proyek.
- `tests/public-assets.test.mjs`: gzip/identity/q=0, variasi ETag, 304 tanpa body, HEAD, no-store HTML/API, endpoint privat 401 dan file bank tersembunyi 404.

Awal percobaan browser/socket dalam sandbox dibatasi lingkungan. Rerun dengan izin eksekusi pengujian lokal berhasil; bukan kegagalan aplikasi yang disembunyikan.

## Produksi sebelum rilis

Render: layanan existing `srv-dbioafjbc2fs73ashu5g`, workspace existing `tea-dbinm1ajnfac73b4kqt0`, Singapore, Free, auto-deploy off. Tidak mengubah konfigurasi/billing.

Sampel jaringan satu kali, bukan benchmark statistik: health 200/352 ms, app.js 200/112 ms/17.154 byte gzip, style.css 200/99 ms/12.577 byte gzip. JS/CSS `no-store`, tanpa ETag.

Hitungan Supabase read-only sebelum rilis: profiles 8, exam_results 61, vocabulary_progress 97, lc_reviews 186, lc_xp 156. Tidak membuat aktivitas uji pada produksi.

## Batasan dan tindak lanjut

- Angka browser adalah pengujian lokal terisolasi, bukan SLA HP/jaringan nyata. Suara fisik Android/iPhone, volume perangkat dan kualitas native voice belum bisa dibuktikan oleh mock desktop.
- Suara tetap memakai Mandarin TTS yang benar-benar tersedia di perangkat; tidak mengklaim model penilaian pelafalan atau suara anak/lansia universal.
- Render Free masih dapat cold start setelah 15 menit idle. Optimalisasi aplikasi tidak menghilangkan startup page penyedia. Referensi: https://render.com/docs/free#spinning-down-on-idle . Tidak menjalankan keep-alive atau menaikkan paket berbayar.
- Tidak melakukan load test besar pada produksi atau mengirim email reset nyata. Kontrak recovery/reset dan revokasi sesi diuji terisolasi.
- 18 arsip soal yang belum tervalidasi tetap ditahan. Pemeriksaan linguistik manual seluruh korpus dan penambahan konten bukan bagian rilis performa ini.
- Dashboard sudah memiliki resume/misi/XP dan menu ujian sudah membedakan tujuan/durasi/dampak level; tidak menambah menu duplikat.

## File dan deploy

Runtime: `app/static-assets.mjs` (baru), `app/server.mjs`, `public/app.js`, `public/exam-center.js`, `public/speech.js`, `public/learning-i18n.js`.

Tes baru: `tests/public-assets.test.mjs`, `tests/responsiveness-ui.mjs`. Dokumen ini mencatat hasil dan batas audit.

Jalankan build produksi, salin file tersebut ke repository deployment existing, commit/push `main`, trigger manual deploy pada layanan existing, tunggu Live lalu cek health, hash aset, gzip/ETag/304 dan no-store endpoint privat. Tidak ada migrasi atau perubahan rahasia. Rollback dengan deploy commit runtime sebelumnya `1d84c996ec9831ae3b8fa8ffe5ca709293d278eb` bila verifikasi gagal.
