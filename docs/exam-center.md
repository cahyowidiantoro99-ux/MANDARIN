# Pusat Ujian ECB — arsip HSK dan kebijakan naik level

## Hasil implementasi

Menu Ujian memiliki tiga jalur: Evaluasi Karyawan, Simulasi HSK, dan Latihan Terarah. Evaluasi berisi placement satu kali, dua ujian mingguan, diagnostic kerja, dan evaluasi naik level. Simulasi memakai PDF/MP3 sumber dengan pilihan paket dan mode penuh atau belajar. Latihan menyediakan listening/reading/writing sesuai level, Buku Kesalahan, serta latihan kosakata/grammar aplikasi yang sudah ada.

Tidak mengubah nilai mingguan, ranking, baseline, kosakata, XP, akun atau data historis. Sesi HSK latihan tidak memberikan XP atau menit belajar mandiri tambahan. Source arsip mengikuti dokumen HSK yang diberikan, terpisah dari kurikulum kosakata HSK 3.0 existing. Hasil internal bukan sertifikasi atau skor resmi HSK terkalibrasi.

## Bank sumber

79 kode unik diperiksa. Importer memeriksa identitas sampul, jumlah dan waktu bagian, kunci objektif, rentang halaman pertanyaan vs transkrip/kunci, keberadaan MP3, durasi frame MP3 dan hash PDF/audio. 60 paket lolos pemeriksaan otomatis. Manifest enam paket lama dipertahankan byte-for-byte untuk kompatibilitas; H11007 menambah satu paket yang telah terverifikasi sebelumnya tetapi teks sampulnya tidak terbaca lengkap oleh parser baru.

Total 61 paket: 51 tersedia untuk simulasi/latihan, 10 dicadangkan untuk evaluasi HSK 1–5 (dua per level). Level 6 sudah maksimum, sehingga semua 12 paket HSK 6 yang lolos tersedia untuk latihan. Sebanyak 18 kode lain belum ditayangkan: teks/struktur/kunci belum lengkap atau ambigu. H51333 mempunyai duplikasi kode dengan isi berbeda dan ditahan. Paket di folder HSK1 yang ternyata berkode level lain tidak dikelompokkan berdasarkan nama folder.

Data: `data/official-hsk/bank.json`, `bank-report.json`, manifest lama, dan JPG pertanyaan. Script: `scripts/build-hsk-bank.py`, membutuhkan Python+pypdf dan Poppler; runtime produksi tidak membutuhkan Python. Parser tidak mengganti PDF, membuat soal baru, atau mengarang terjemahan/pembahasan. Halaman gambar dipertahankan dari sumber. Ini validasi struktur/kunci dan pemeriksaan visual sampel, bukan audit linguistik manual setiap butir.

## Naik level versi 2

- Menguji level belajar saat ini; lulus HSK n internal membuka belajar HSK n+1. HSK 6 tidak naik ke 7.
- Memerlukan hasil mingguan valid HSK dan Work pada level saat ini. Tidak memaksa mengulang hasil valid hanya karena minggu kalender berganti. Skor mingguan tidak harus lulus untuk memenuhi syarat mengikuti evaluasi akhir.
- Kelulusan internal: total >=80/100 dan setiap keterampilan yang diuji >=60/100. Pilihan Hafal, XP dan durasi tidak menjadi bukti kelulusan.
- Paket dipilih server dari cadangan, terpisah dari katalog latihan. Retake memakai paket lain dari percobaan sebelumnya. Dengan dua paket, rotasi dapat kembali ke paket sebelumnya setelah digunakan bergantian; tidak menjanjikan soal selalu baru sepanjang waktu.
- Jika gagal, masa tunggu tujuh hari dihitung sejak nilai akhir tersedia. Jawaban tulis yang pending tidak bernilai nol dan belum memberi keputusan/promosi.
- Promosi atomik satu tingkat, hanya jika profil masih berada pada level asal. Submit berulang tidak menaikkan lagi. Tidak otomatis membuka ujian berikutnya.
- Mengakhiri evaluasi aktif lebih awal adalah gagal bernilai 0 dengan masa tunggu tujuh hari; UI menjelaskan sebelum tombol konfirmasi. Pembatalan latihan tidak menghasilkan nilai akhir.
- Sesi lama tanpa opsi versi 2 tetap memakai kebijakan saat dibuat. Riwayat tidak dinilai ulang. Pending evaluasi lama juga harus diselesaikan sebelum promosi baru.

## Simulasi dan latihan

Simulasi penuh menggunakan fase persiapan/listening/pemindahan/reading/writing sesuai paket. Audio mengikuti durasi MP3 asli; angka menit pada kartu mengikuti perkiraan sumber. HSK6 tetap menutup bacaan setelah sepuluh menit untuk fase menulis berikutnya.

Mode belajar dan latihan bagian tidak mempunyai timer bagian; sesi aktif dapat dilanjutkan dalam 30 hari. Ini tidak memperpanjang masa login normal. Tombol Simpan dan jeda menunggu konfirmasi server, kemudian kembali ke menu. Sesi dapat dilanjutkan setelah login ulang. Mode belajar menyediakan pemutaran ulang/kecepatan audio dan kunci setelah jawaban disimpan. Writing menggunakan penilaian internal existing; AI adalah estimasi dengan status pending jika kuota/layanan belum tersedia. Tidak ada fallback nilai palsu.

Menekan Kirim mengakhiri seluruh sesi, termasuk bagian lain; soal kosong bernilai 0. Jumlah jawaban terisi ditampilkan. Buku Kesalahan memuat jawaban objektif yang diisi salah pada hasil tersimpan; soal belum diisi tidak dianggap sebagai kesalahan yang sudah dicoba. Jawaban benar pada percobaan terbaru menghilangkan butir tersebut. Konteks halaman asli dan audio tetap tersedia; soal tidak diacak lepas dari bacaan.

## API dan migrasi

GET `/api/hsk-center`, GET `/api/hsk-mistakes`, serta action section/feedback/abandon pada `/api/official-exams/:id` melengkapi endpoint existing. Start tetap POST `/api/exams` dengan mode levelup/hsk_simulation/hsk_learning/hsk_section/hsk_mistakes. Role, kepemilikan sesi, CSRF, fase waktu, paper cadangan dan kunci diverifikasi server-side.

Satu tabel backend-only ditambahkan secara idempotent: `hsk_attempt_options(session_id,purpose,section,policy_json)`, FK ke sesi existing. PostgreSQL mengaktifkan RLS dan mencabut akses anon/authenticated; tidak ada grant baru atau perubahan public aplikasi lain. SQL berada pada migrasi existing `001_supabase.sql` dan `002_sources.sql`, dijalankan oleh startup production existing. Izin CREATE schema role backend telah diverifikasi; tabel belum ada sebelum rilis. Tidak ada penghapusan atau rewrite baris lama.

Policy JSON merupakan snapshot internal server; input client tidak dapat mengganti threshold, level target, daftar soal atau purpose. Katalog client tidak berisi kunci atau ID cadangan yang belum digunakan. Konten PDF/audio sendiri merupakan arsip yang sudah dimiliki perusahaan; pembatasan aplikasi tidak menjamin kerahasiaan sumber yang dibagikan di luar aplikasi.

## File perubahan utama

Backend: `app/hsk-bank.mjs`, `app/official-hsk.mjs`, `app/service.mjs`, `app/server.mjs`. UI: `public/exam-center.js`, `public/official-exam.js`, `public/app.js`, `public/leader-portal.js`, `public/learning-i18n.js`, `public/style.css`. Build: kedua script build. Data: bank, report, JPG sumber; manifest lama dipertahankan. Tes: hsk-center, exam-center-ui dan adaptasi tes source/legacy/viewer/i18n/PostgreSQL.

## Verifikasi dan batasan

Tes mencakup tepat 80/60, total tinggi dengan keterampilan rendah yang tetap gagal, cooldown, rotasi paket, maksimum level, pending tulisan, idempotensi promosi, baseline, source hashes, batas halaman, reserved access, ownership, mode belajar tanpa perpanjangan login, resume setelah autentikasi, Buku Kesalahan, serta regresi SQLite/PostgreSQL/RLS dan portal existing.

Tes browser mencakup ketiga jalur, promosi satu tingkat tanpa auto-next, pagination katalog, mode belajar, audio/halaman sumber, bantuan setelah simpan, pergantian bagian, refresh, bank kesalahan, viewport 360px, bahasa Indonesia/中文, dan tidak ada XP tambahan. Pemeriksaan media menggunakan file asli; audio di perangkat fisik serta penilaian bahasa manusia belum diuji. Pengujian AI menggunakan transport mock; kuota cloud Gemini bergantung layanan existing. Tidak dilakukan transaksi ujian uji pada akun karyawan produksi.

Run regresi akhir: 83 unit/integration test lulus, 0 gagal; build produksi dan syntax/security lint 95 file JavaScript lulus. Tes browser exam-center-ui, official-hsk-ui, i18n-ui dan Leader Portal lulus. Termasuk klik Simpan dan jeda, melanjutkan sesi, serta mempertahankan jawaban setelah refresh/login ulang.

Halaman dan MP3 dimuat sesuai permintaan, bukan seluruh bank ke browser. Katalog dipaginasi enam paket. Aset sumber berukuran sekitar 102 MB pada disk; Render Free masih bisa cold start. Tidak menambah paket hosting berbayar, kunci API atau penyedia AI.

Deploy: jalankan build/import di lokal, commit sumber/data, push repository deployment, lalu manual deploy layanan existing. Startup menjalankan migrasi additive. Untuk rollback kode, pertahankan tabel dan data baru; jangan hapus data atau menimpa manifest sesi yang sudah digunakan. Tinjau sesi versi 2 aktif sebelum rollback agar tidak diproses dengan kebijakan lama.

## Verifikasi rilis produksi

Deploy `dep-dbl7mmtbedkc73893l40` Live, runtime commit `1d84c996ec9831ae3b8fa8ffe5ca709293d278eb`. Health 200 (production_content/PostgreSQL); exam-center.js, official-exam.js dan bundle app.js 200 dengan hash sesuai build. Endpoint hsk-center/hsk-mistakes menolak anonymous dengan 401; akses langsung JSON bank ditolak 404.

Migrasi terverifikasi: tabel hsk_attempt_options dibuat, owner ecb_mandarin_app, RLS aktif, anon/authenticated tidak memiliki SELECT. Tabel berisi nol percobaan saat pemeriksaan karena tidak membuat transaksi uji produksi. Data sebelum/sesudah sama: 8 profil, 61 hasil ujian, 97 progres kosakata, 186 review dan 156 transaksi XP. Pengujian interaksi autentikasi, grading dan promosi dilakukan di fixture lokal/transport AI mock; belum memakai akun karyawan produksi atau pengujian beban besar cloud.
