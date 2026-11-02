# Dasbor dan alur Pembelajaran

## Perubahan

- Dasbor menampilkan XP hari ini/total, waktu aktif hari ini/total, streak, misi dengan progress dan tautan aktivitas. Misi selesai ditandai hijau.
- Status Hafal/Ragu/Belum hafal berwarna hijau/kuning/merah; Belum dipelajari dihitung terpisah. Jumlah terbukti recall dan jatuh tempo ditampilkan tanpa persentase kelulusan yang menyesatkan.
- Tautan lanjut belajar memakai paket sesi terakhir yang masih memiliki materi published dan dapat diakses pengguna. Jika belum ada sesi, gunakan rekomendasi existing. Resume berada pada tingkat paket, bukan jaminan kembali ke posisi kartu tertentu.
- Evaluasi mingguan tetap tersedia. Riwayat ujian dan baseline dapat dibuka; empat kartu statistik lama yang duplikatif dihapus.
- Pembelajaran fokus pada pilihan jalur HSK/pekerjaan, paket, status review, grammar, dan latihan tambahan. Panduan empat langkah dapat dibuka agar pengguna HP segera menemukan paket.
- Statistik dan misi lengkap dipindahkan dari Pembelajaran ke dasbor. Riwayat aktivitas tetap tersedia. Indonesia/中文 mengikuti pilihan bahasa; materi asli dipertahankan.

## Data dan performa

Tidak ada migrasi, penghapusan data, perubahan level, XP reward, ujian, autentikasi, Leader Portal atau paket hosting. Summary menambah dua query tetap untuk agregat harian dan paket terakhir, semuanya memakai user ID dari sesi server. Waktu harian mengikuti tanggal mulai sesi dalam WITA, bukan pembagian per detik lintas tengah malam. Existing active-time validation tetap berlaku.

Dasbor memuat data dashboard, summary dan modul UI secara paralel; summary menggunakan cache memori existing yang terisolasi akun dan diinvalidasi setelah mutasi. Tidak ada pemuatan seluruh deck kosakata ke browser dasbor.

## File

`app/learning-center.mjs`, `public/app.js`, `public/learning-center.js`, `public/learning-i18n.js`, `public/style.css`, `tests/dashboard-learning.test.mjs`, `tests/dashboard-learning-ui.mjs`.

## Verifikasi

- `node --test tests/*.test.mjs`: 72 lulus, 0 gagal pada run akhir. Mencakup isolasi karyawan, WITA day, PostgreSQL, RLS, placement dan ujian mingguan.
- `node scripts/build-production.mjs`: lulus, syntax/security lint 84 file JavaScript.
- `node tests/dashboard-learning-ui.mjs`: lulus; misi/XP/status, kedua jalur, tautan flashcard, refresh, Indonesia/中文, desktop dan viewport 360px, tidak menghasilkan XP dengan melihat halaman.
- `node tests/i18n-ui.mjs`: lulus kedua portal, persistence, ujian aktif dan form draft.
- Screenshot lokal memakai data DEMO: `artifacts/dashboard-learning-desktop.png`, `artifacts/dashboard-learning-mobile.png`, `artifacts/learning-guided-desktop.png`, `artifacts/learning-guided-mobile.png`.

Deploy menggunakan alur existing: commit/push deployment repository, lalu manual deploy layanan ecb-mandarin. Tidak ada konfigurasi rahasia baru. Belum dilakukan load test besar atau pengujian login karyawan produksi. Render Free masih memiliki cold start.

Deploy `dep-dbl043bm8hqs738on100` berstatus Live, runtime commit `0f41f40f25173fe55af596b6bbb3cf7ea8ac3b20`. Health produksi 200 (production_content/PostgreSQL); modul Learning Center dan CSS cocok dengan kode lokal. Bundle app.js dibandingkan dengan dist-production karena build produksi menghapus banner/akun demo.
