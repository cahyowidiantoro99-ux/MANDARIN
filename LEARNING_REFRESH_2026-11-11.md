# Pembaruan lokal 11 November 2026

- Tombol selanjutnya teal, kirim merah, dialog konfirmasi dengan pilihan Ya/Tidak. Pengiriman otomatis saat waktu habis tetap mengikuti server.
- Banner PDF responsif memakai SVG kecil, CSS dan aset WebP proyek. PDF hanya dimuat ketika diunduh; isi PDF tidak diubah.
- Prestasi: enam kategori, ilustrasi panda, ringkasan posisi dan podium. Perhitungan peringkat tidak berubah.
- Alur belajar dipindah di atas submenu; preferensi hari belajar tetap tersedia.
- Pasangan Kata berada dalam Katalog Kosakata. Tab aktif Hanzi dan Kosakata diberi warna teal/emas.
- Chengyu: 2.144 entri (sesuai isi HTML, bukan angka pada nama file), 67 hubungan, pencarian, filter, detail, audio melalui mekanisme perangkat yang sudah ada, dan status per akun. Data disajikan 12 entri per halaman. Atribusi sumber dipertahankan.
- Status lama dari localStorage HTML tidak diimpor otomatis. Progres baru terikat akun melalui atlas_progress; tidak ada migrasi skema atau penghapusan data.
- XP Chengyu: 2 XP per idiom berbeda per hari, maksimum 20 idiom / 40 XP sehari. Perubahan status berulang tidak menggandakan XP. Hafal tetap penilaian diri, bukan bukti penguasaan.
- Misi inti: review 10 kosakata/idiom, selesaikan 1 latihan bahasa, jawab 3 recall benar. Latihan grammar/interaktif yang memenuhi kriteria tetap dihitung meskipun tidak mendapat XP ulang. Bonus opsional tetap terpisah, tanpa XP ganda.

## Verifikasi
125 tes regresi lolos; tambahan uji HTTP Chengyu dan pengujian ulang Chengyu juga lolos (2/2). Lint 144 file dan build produksi berhasil. Uji browser Chengyu, status setelah refresh, banner PDF, Prestasi, desktop/HP dan dialog kirim lolos. Regresi flashcard, recall, navigasi 360/390/768/desktop, PDF terautentikasi, serta tabel 16 aturan XP lolos. Tidak ada publikasi pada tahap ini.

## Berkas

Backend: app/chengyu.mjs, app/learning-center.mjs, app/server.mjs, app/xp-policy.mjs; data/chengyu-atlas.json.
Antarmuka: public/chengyu.js, confirm-submit.js, achievements.js, app.js, hanzi-atlas.js, i18n.js, learning-center.js, material-download.js, official-exam.js, style.css, vocab-atlas.js.
Build: Dockerfile, scripts/build.mjs, scripts/build-production.mjs.
Tes: tests/chengyu.test.mjs, tests/chengyu-refresh-ui.mjs, tests/learning-refresh-ui.mjs, tests/xp-transparency-ui.mjs.

## Final headset edit and release preparation

Ten new illustrations now have plain teal earcups. All 24 deployed panda illustrations were visually audited; no printed white headphone emblems remain. Existing ECB application logo is unchanged. 126/126 full regression tests passed. Final production build and desktop/tablet/HP UI verification are required before publish. No database migration or deletion.
