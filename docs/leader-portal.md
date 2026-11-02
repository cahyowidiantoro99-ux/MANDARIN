# Portal Leader — audit dan perombakan

## Temuan dan susunan akhir

Sebelumnya Ringkasan, Karyawan dan Hasil memakai KPI dan tabel roster yang sama. Analitik Belajar mengulang nilai resmi, sementara detail hasil masih memuat bahasa dan tautan untuk Employee. Statistik periode terpilih dan status minggu berjalan juga perlu dibedakan lebih jelas.

| Menu | Tanggung jawab tunggal |
| --- | --- |
| Ringkasan Program | Cakupan peserta, placement, kelengkapan dua ujian minggu berjalan, prioritas pendampingan, peta level dan cakupan organisasi |
| Direktori Karyawan | Identitas organisasi, status level, aktivitas terakhir, pencarian dan akses profil individual; tanpa tabel nilai atau XP kolektif |
| Analitik Belajar | Aktivitas, waktu, misi inti, bonus interaktif opsional, penguasaan kosakata, XP dan latihan; nilai ujian tidak ditampilkan ulang |
| Hasil Evaluasi | Checklist dua jalur minggu berjalan serta arsip periode dengan jenis, status dan level ujian; rata-rata hanya hasil mingguan valid |
| Panggung Prestasi | Enam kategori penghargaan existing; tidak dibuat skor gabungan baru |

Profil individual menggabungkan konteks orang yang dipilih dalam dua tab: pembelajaran minggu berjalan dan riwayat evaluasi. Baseline serta penilaian diri dilipat. Detail hasil Leader menampilkan pemilik hasil dan tidak menyediakan tombol memulai ujian, belajar, grading AI, atau naik level.

## Definisi dan batas data

- Level dan identitas selalu snapshot saat ini. Arsip hasil mengikuti tanggal mulai sesi dalam periode pilihan WITA. Kepatuhan dua ujian selalu minggu berjalan, termasuk saat periode arsip historis dipilih; UI menjelaskan perbedaan ini.
- Nilai nol valid tetap tampil nol. Nilai kosong dan jawaban menunggu penilaian tidak dianggap nol. Sesi kedaluwarsa yang belum diproses worker ditampilkan Waktu berakhir.
- Selesai berbeda dari lulus. Checklist memakai hasil valid pertama mingguan dengan official_key, bukan latihan atau percobaan ulang.
- Filter level belajar mengacu profil saat ini. Filter Level ujian di arsip mengacu sesi ujian sebenarnya. Untuk perbandingan nilai, gunakan level sama; materi Work dapat berbeda antar-departemen.
- Aktivitas terakhir berasal dari sesi aktif minimal satu menit, XP, atau latihan tersimpan; bukan login atau absensi HR. Belum aktif pada periode bukan bukti pelanggaran kerja.
- Mastery, tiga misi inti dan jadwal pribadi tetap memakai definisi existing. Bonus interaktif menghitung hari dengan hasil eligible minimal 80; tidak menambah denominator misi inti atau memberi XP ganda.
- Perubahan aturan naik level dan penambahan bank simulasi masih rencana pembahasan; tidak diterapkan pada rilis ini.

## Integrasi, keamanan dan performa

API GET `/api/leader/portal` memakai lima query batched tetap, tanpa N+1 dan tanpa writes. Role diperiksa server-side; cohort demo/produksi dipisahkan. Response tidak memuat email, nomor karyawan, password, jawaban, kunci soal atau official_key. API existing tetap tersedia.

Tidak ada migrasi, penghapusan data, perubahan Auth/RLS, secret, peran, aturan ujian, skor, atau biaya hosting. Ekspor tetap mengikuti `allow_export` existing; UI tidak menampilkan tombol jika perusahaan belum mengizinkan. CSV existing tetap memuat direktori dan status minggu berjalan, dengan perlindungan formula dan audit existing.

Halaman baru lazy-loaded. Read cache existing diperluas untuk dua read model Leader, tetap terisolasi akun dan diinvalidasi setelah mutasi/logout. Pagination 20 baris dan pergantian tab memakai data yang sudah dimuat. Filter lanjutan dilipat; form dan tabel menyesuaikan viewport HP. Filter/tab pada halaman portal disimpan di URL. Filter analitik terpisah, dengan dukungan parameter dari tautan Ringkasan.

## File

- Backend: `app/leader-portal.mjs`, `app/learning-analytics.mjs`, `app/server.mjs`.
- UI: `public/leader-portal.js`, `public/app.js`, `public/learning-analytics.js`, `public/official-exam.js`, `public/learning-i18n.js`, `public/read-cache.js`, `public/style.css`.
- Build: `scripts/build.mjs`, `scripts/build-production.mjs`.
- Tes: `tests/leader-portal.test.mjs`, `tests/leader-portal-ui.mjs`, `tests/postgres-service.test.mjs`, `tests/i18n-ui.mjs`.

## Verifikasi

- Regresi unit/integrasi: 77 lulus, 0 gagal. SQL baru diuji pada SQLite dan PostgreSQL/PGlite termasuk mode source. Mencakup periode, nol vs pending, akses role, privasi, konfigurasi, serta regresi placement/ujian/XP.
- Build produksi dan syntax/security lint: lulus, 91 file JavaScript.
- `tests/leader-portal-ui.mjs`: lulus dengan cohort DEMO 28 karyawan; pagination tanpa refetch, filter, profil, pending AI, refresh, read-only viewer, penolakan anonymous/Employee dan viewport 360px serta Indonesia/中文.
- `tests/i18n-ui.mjs`: lulus kedua portal, ujian aktif, draft dan pergantian bahasa.
- `tests/official-hsk-ui.mjs`: lulus regresi tampilan soal asli, waktu bagian, fase terkunci, jawaban, zoom mobile, HSK6 dan pending AI.
- Screenshot lokal: `artifacts/leader-overview-desktop.png`, `artifacts/leader-overview-mobile.png`, `artifacts/leader-results-zh-mobile.png`. Semua memakai fixture DEMO, bukan laporan produksi.

## Deploy dan batasan

Deploy memakai push repository deployment dan manual deploy layanan ecb-mandarin, start command existing. Tidak ada impor materi atau migrasi. Belum melakukan load test cloud berskala besar maupun login Leader produksi dalam pengujian ini. Fitur audio bergantung perangkat existing. Render Free tetap bisa cold start. Statistik snapshot bukan rekonstruksi level karyawan pada tanggal historis.
