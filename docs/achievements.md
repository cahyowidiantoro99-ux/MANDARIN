# Panggung Prestasi ECB

Enam kategori belajar pada menu Peringkat, terpisah dari evaluasi resmi:

| Kategori | Perhitungan |
| --- | --- |
| Pendaki HSK | Level placement/promosi server, bukan penilaian diri |
| Bintang Ketekunan | Durasi belajar aktif tervalidasi |
| Penggerak Semangat | XP yang diberikan server |
| Penakluk Kosakata | Hanzi unik berstatus hafal, minimal dua recall benar, recall terakhir benar dan recall benar dalam periode |
| Bintang Evaluasi | Hasil resmi mingguan pertama yang valid pada level ujian yang sama; gabungan membutuhkan HSK dan Work, berbobot sama |
| Langkah Tanpa Putus | Streak saat ini berdasarkan jadwal pribadi dan hari istirahat, maksimum 730 hari |

Filter minggu, bulan, sepanjang waktu dan departemen. Nilai seri mendapat peringkat sama (1,1,3). Aktivitas nol tidak menjadi pemenang; nilai ujian resmi nol tetap sah. Level HSK merupakan snapshot saat ini. Mastery memakai status saat ini dengan bukti recall dalam periode. Streak bukan rekor terpanjang atau metrik absensi HR. Durasi sesi diatribusikan berdasarkan awal sesi. Materi Work berbeda antar departemen; gunakan filter departemen untuk perbandingan lebih sebanding.

## Integrasi

- Halaman baru: `#ranking`; halaman resmi lama: `#ranking/official`.
- API baru: GET `/api/achievements`, autentikasi employee/leader, tujuh query batched tanpa penulisan data.
- `/api/rankings`, formula resmi, placement dan ujian mingguan tidak diubah.
- Tidak memerlukan migrasi, izin database, environment variable atau layanan berbayar baru.
- Kategori berpindah dari data yang sudah dimuat, tanpa meminta API ulang. Daftar dipaginasi 20 baris.

## File

`app/achievements.mjs`, `app/server.mjs`, `public/achievements.js`, `public/app.js`, `public/learning-i18n.js`, `public/style.css`, kedua build script, serta tes achievements, UI, PostgreSQL dan i18n.

## Verifikasi

- `node --test tests/*.test.mjs`: 71 lulus, 0 gagal pada run akhir.
- `node scripts/build.mjs` dan `node scripts/build-production.mjs`: lulus; pemeriksaan sintaks/security lint 82 file JavaScript.
- `node tests/achievements-ui.mjs`: lulus, desktop dan viewport 360px, bahasa Indonesia/中文, seri, filter, refresh, jalur peringkat resmi, tanpa XP tambahan saat melihat halaman.
- PGlite menjalankan SQL PostgreSQL termasuk source-content joins. Tes memastikan isolasi demo, autentikasi, parameter, deduplikasi mastery dan seri.
- Screenshot lokal memakai fixture DEMO, bukan hasil karyawan produksi: `artifacts/achievement-categories.png`.

Jalankan server sesuai konfigurasi existing; deploy dengan commit/push repository deployment dan manual deploy layanan Render existing. Tidak ada template impor baru karena fitur memakai data existing.

## Batasan

Belum ada load test berskala besar atau pengujian login karyawan produksi untuk halaman baru. Tidak ada arsip pemenang historis. Render Free tetap dapat mengalami cold start. Data historis tanpa bukti recall tidak otomatis dihitung sebagai mastery terverifikasi.
