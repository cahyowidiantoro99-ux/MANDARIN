# Flashcard responsiveness

## Implementasi

- Prefetch satu challenge kartu berikutnya selama pengguna mempelajari kartu saat ini. Antrean dalam memori dibatasi dua entri, deduplikasi request, TTL 60 detik, dibersihkan saat berganti halaman/filter. Kegagalan prefetch tidak memblokir kartu saat ini; pengambilan berikutnya dapat mencoba lagi.
- Header, sidebar, pengatur filter, dan penghitung waktu dipertahankan selama perpindahan dalam satu deck. Hanya area kartu, hitungan dan progress diperbarui. Mount baru tetap membuat header baru.
- Mulai pencatatan sesi dan buka jawaban dapat berjalan paralel. Tidak menunggu request mulai sesi sebelum menampilkan respons reveal.
- Tidak melakukan prefetch reveal atau kunci recall. Jawaban tetap dibuka melalui server saat pengguna memilih Buka jawaban. Jeda baca dan seluruh aturan SRS/XP tetap sama.
- Status memuat/menyimpan lebih jelas. Status tersimpan hanya tampil setelah konfirmasi server. Retry recall terpisah dari penyimpanan status kartu sehingga tidak mengirim ulang review yang sudah berhasil.
- Callback lama, timer jeda baca dan respons jaringan diperiksa terhadap mount/view aktif. Audio listener dibersihkan lalu dipasang ulang pada area kartu baru.

Jumlah kosakata/paket, contoh kalimat, Pinyin, audio perangkat, tiga status, recall, XP dan validasi server dipertahankan. Tidak ada migrasi, perubahan API, backend, konfigurasi rahasia atau layanan berbayar. Prefetch dapat membuat satu challenge belum digunakan bila pengguna keluar; challenge ini tidak memberikan XP atau mengubah progres.

## Pengujian nyata

- `node --test tests/*.test.mjs`: 76 lulus, 0 gagal. Termasuk antrean terbatas, deduplikasi, TTL, retry dan respons sesi lama; regresi database, isolasi karyawan, placement, ujian dan XP.
- `node scripts/build-production.mjs`: lulus; syntax/security lint 87 file JavaScript.
- `node tests/flashcard-ui.mjs`: lulus pada versi akhir. API challenge diberi delay buatan 600 ms; perpindahan ke kartu prefetched tercatat 42 ms pada run akhir (run sebelumnya 33 ms). Ini pengukuran browser lokal, bukan jaminan waktu perangkat produksi atau perbandingan benchmark lengkap sebelum/sesudah.
- Browser juga menguji identitas DOM header/sidebar, gagal simpan tanpa konfirmasi palsu, retry kartu gagal dimuat, retry recall tanpa review ganda, penilaian server, filter kosong dan kembali ke filter lain, Gudang Kata, viewport 360px, 中文/Pinyin, serta berpindah halaman saat reveal masih berlangsung.
- `node tests/i18n-ui.mjs`: lulus kedua portal, ujian aktif dan draft formulir.

File: public/learning-center.js, public/learning-i18n.js, tests/flashcard-queue.test.mjs, tests/flashcard-ui.mjs.

## Batasan

Kartu pertama, reveal dan konfirmasi simpan masih memerlukan jaringan. Prefetch yang belum selesai tidak dapat menjamin perpindahan instan. Tidak ada mode offline atau penilaian optimistis yang melewati server. Cache hanya berada pada mount aktif, bukan penyimpanan permanen. Tidak ada uji perangkat Android fisik/audio native atau load test produksi besar. Cold start Render Free tetap dapat terjadi.

Deploy: build produksi existing, push repository deployment, manual deploy ecb-mandarin. Tidak perlu impor konten atau migrasi database.

Rilis produksi: deploy `dep-dbl0ka15efls73ft63g0` Live, runtime commit `6a0f014b026f9b62eac57267b5d3250db819754d`. Pemeriksaan cloud health 200 (production_content/PostgreSQL); learning-center.js dan learning-i18n.js 200 dengan hash sesuai build lokal. Pengujian interaksi terautentikasi dilakukan pada fixture lokal, bukan akun karyawan produksi.
