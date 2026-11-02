# Misi bonus interaktif

Satu bonus opsional harian ditampilkan terpisah dari tiga misi inti. Bonus otomatis selesai jika ada hasil tersimpan milik karyawan pada hari WITA yang sama, completed=1 dan nilai >=80, untuk matching, sentence, listening, story, atau contrast. Rekam suara tidak termasuk. Hasil masa depan dan hasil milik pengguna lain tidak dihitung.

Status dihitung dari lc_activity_results, bukan klaim browser atau transaksi XP. Tidak ada reward bonus baru: XP mengikuti batas dan deduplikasi aktivitas existing. Misi inti dapat selesai meskipun bonus belum dikerjakan. Hasil valid tetap memenuhi bonus meskipun hadiah XP aktivitas telah mencapai batas harian.

Dasbor menautkan ke #practice/bonus. Hub menandai latihan yang memenuhi syarat; hasil latihan menampilkan status bonus dan tautan kembali ke dasbor. Mutasi existing membatalkan cache summary/catalog sehingga status diperbarui ketika navigasi kembali. Hari baru otomatis mengulang target bonus tanpa menghapus riwayat.

Tantangan mingguan bernama Jelajah 3 Jenis Game, tetap membutuhkan matching, sentence dan listening pada minggu WITA berjalan. Satu hasil dapat memenuhi bonus harian dan progres mingguan. Tidak ada perubahan ujian wajib, level atau nilai evaluasi.

File: app/learning-motivation.mjs, app/learning-center.mjs, app/learning-play.mjs, public/learning-center.js, public/learning-play.js, public/learning-i18n.js, public/style.css, tests/interactive-mission.test.mjs, tests/learning-play.test.mjs, tests/dashboard-learning-ui.mjs.

Tidak ada migrasi database, konfigurasi rahasia atau layanan baru. Deploy memakai build-production dan layanan Render existing.

Verifikasi: tes unit batas hari/nilai dan isolasi pengguna; integrasi hasil lima jenis aktivitas dan XP tanpa duplikasi; browser desktop/360px, navigasi dasbor–latihan–hasil–dasbor dan refresh. Tes memastikan bonus nol tidak menghalangi tiga misi inti yang sudah selesai. Pengujian memakai fixture lokal, tidak membuat aktivitas karyawan produksi.
