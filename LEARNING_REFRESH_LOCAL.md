# Pembaruan Pembelajaran — verifikasi lokal 10 November 2026

Diterbitkan pada 10 November 2026: commit aplikasi 5e16bf0d338ba874ec8763beea746a092a8e1e43, Render dep-dbph1vmc6qcc73al0hbg (Deploy succeeded | Live).

## Fitur
- Kosakata dasbor memakai entri flashcard HSK pada level aktif, tanpa kosakata kerja atau level lain. Label HSK, persentase dan jumlah dipelajari memakai denominator yang sama.
- Bonus selesai menuju Zona Interaktif. Misi recall menuju menu Recall.
- Membuka jawaban flashcard opsional; tiga status dapat langsung disimpan. Recall terpisah di akhir paket dan tersedia pada menu Pembelajaran.
- Recall memakai riwayat akun, scope paket/level/tema/kata pribadi, pembahasan benar/salah, dan pencatatan waktu aktif. Kosakata yang baru direcall ditunda satu jam. Aturan mastery dan reward server existing dipertahankan.
- Toolbar Gudang kata/Kata pribadi/Gudang Kesalahan di samping Zona Interaktif. Zona Interaktif tetap default. Dua ilustrasi baru WebP sekitar 45 KB total, lazy loaded.
- Link Pasangan Kata pada breadcrumb katalog kosakata dihapus; modul dan tautan per-entri tetap tersedia.
- Halaman perpustakaan dan daftar API sumber dihapus. File sumber ujian dan detail materi yang masih digunakan tidak dihapus. Halaman hub practice lama dialihkan ke Pembelajaran; game tetap berfungsi. Jadwal belajar pribadi dipertahankan di Alur belajar Anda.
- Header awal ujian selalu Pusat Ujian ECB.
- 14 PDF landscape per kelompok HSK, mencakup 11.092 kosakata dan 3.000 Hanzi. HSK 7–9 merupakan satu kelompok sesuai Atlas. PDF prebuilt, tidak dibuat saat membuka katalog dan baru ditransfer saat unduh; akses Employee saja.

## File
app/learning-center.mjs; app/server.mjs; public/app.js; public/learning-center.js; public/recall.js; public/learning-play.js; public/exam-center.js; public/vocab-atlas.js; public/hanzi-atlas.js; public/material-download.js; public/learning-i18n.js; public/style.css; public/hub-pinyin.webp; public/hub-pairs.webp; scripts/build.mjs; scripts/build-production.mjs; scripts/generate-material-pdfs.py; data/material-pdfs/*; Dockerfile; tests/learning-center.test.mjs; tests/learning-refresh.test.mjs; tests/learning-refresh-ui.mjs.

## Data dan XP
Tidak ada migrasi database, penghapusan data, atau perubahan nilai ujian/placement/ranking. Menggunakan tabel existing. XP tetap dihitung server dengan unique reward per aktivitas/target/hari, challenge sekali submit, isolasi akun, dan batas existing. Hafal bukan bukti penguasaan; recall tetap diperlukan.

## Pengujian
- Build production dan lint syntax/security lulus.
- 7 tes fokus summary/SRS/progress/recall/akses/XP lulus.
- Browser Edge headless: desktop dan lebar 360/390/768, direct rating tanpa reveal, 10 kartu lengkap, link recall akhir, feedback benar/salah, PDF authenticated dan larangan anonymous/Leader, header ujian, redirect hub lama, bahasa Mandarin, tanpa pageerror. Screenshot artifacts/refresh-*.png.
- 14 PDF diperiksa halaman landscape, jumlah halaman/cakupan, dan 4 halaman dirender untuk pemeriksaan visual. Preview artifacts/pdf-*.png.
- Tindak lanjut regresi: 98 dari 98 tes lulus. Fixture Leader dan analitik memakai clock tetap yang sama dengan tanggal tes agar seed historis tidak masuk periode pengujian. Tes naik level memastikan ujian arsip dapat dimulai tanpa assessment mingguan, sesi aktif dilanjutkan tanpa duplikasi, baseline tetap utuh, dan permulaan sesi baru ditolak pada level tertinggi. Tidak mengubah kode aplikasi untuk menyesuaikan tes.

## Menjalankan
node scripts/build-production.mjs
node --test tests/learning-refresh.test.mjs tests/learning-center.test.mjs tests/dashboard-learning.test.mjs tests/interactive-mission.test.mjs
node tests/learning-refresh-ui.mjs

PDF sudah disertakan dalam data/material-pdfs dan Dockerfile. Generator PDF merupakan langkah authoring lokal menggunakan Python/reportlab, font Arial Windows, dan font CID STSong-Light; runtime server tidak memerlukan Python. Pembaca PDF menggunakan font CID CJK standar/substitusi bila diperlukan.

Log rinci: artifacts/regression-followup-all.log, regression-followup-build.log, regression-followup-ui.log. Verifikasi produksi: health200, sembilan aset rilis cocok, endpoint PDF/recall tanpa login401, dan menu baru terlihat pada browser akun aktif. Perubahan tindak lanjut hanya tes/dokumentasi, tanpa migrasi atau perubahan data produksi.
