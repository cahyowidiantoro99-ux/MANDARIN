# ECB Language Performance System — HSK 3.0

Aplikasi Employee dan Leader sudah memakai materi sumber pengguna, bukan bank fixture berulang. Kurikulum aktif HSK 3.0 level 1–6. Sumber kosakata, contoh, grammar, latihan, PDF dan audio memiliki provenance serta pemisahan arsip versi lama.

Siap dipakai untuk pembelajaran dan evaluasi internal **lokal**. Deployment online/Supabase/SMTP nyata dan kalibrasi psikometrik belum diverifikasi. Work khusus EMERC belum tersedia karena workbook departemennya tidak dapat dibaca; aplikasi menampilkan hambatan ini tanpa membuat soal karangan.

## Menjalankan

Server lokal: http://127.0.0.1:3000. Node.js 24+ dan pnpm 11. Dependensi telah dipasang di workspace ini.

```powershell
Set-Location 'E:\APP MANDARIN'
# Instalasi baru saja: Copy-Item .env.example .env
pnpm install --frozen-lockfile
node --env-file=.env scripts/seed.mjs --demo
node --env-file=.env scripts/install-source-release.mjs --reset-legacy
node --env-file=.env app/server.mjs
```

Atau `./start-local.ps1`. Jangan menjalankan server kedua jika port3000 sudah aktif. Pada mesin ini pnpm tersedia melalui `C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd` bila belum di PATH.

`CONTENT_MODE=source` wajib untuk materi sumber; `DEMO_MODE` hanya mengatur kelompok akun uji/nyata. Pada konfigurasi lokal yang ada, akun lama dan password tetap berlaku. DEMO001/DEMO002/LEADER memakai password development `DemoMandarin!2026`; akun yang Anda daftarkan sendiri tetap memakai password Anda. Jangan gunakan password demo di production.

## Materi dan perubahan penilaian

- 7.492 entri kosakata: 5.381 HSK dan 2.111 kerja, setelah deduplikasi per lingkup sumber.
- 481 materi grammar, 474 latihan dengan kunci workbook, 743 unit materi/bacaan, 70 paket berisi materi berbeda.
- 30.213 varian MCQ dari konsep sumber. Nomor/varian tidak dianggap materi baru: satu konsep hanya dapat dipilih sekali dalam satu ujian, termasuk lintas umum/departemen dan lintas arah terjemahan.
- Placement20 soal per tahap:4 grammar,8 konteks,8 terjemahan. Weekly HSK30:6 grammar,12 konteks,12 terjemahan. Random30/100 juga mencakup Pinyin. Soal dan opsi diacak; materi dari dua attempt terakhir/minggu sebelumnya dihindari jika pool memungkinkan, lalu menggunakan materi yang paling jarang dilihat.
- Work tetap60% umum/40% departemen, termasuk18:12 pada ujian mingguan dan60:40 pada Random100. Kompleksitas kerja disesuaikan secara heuristik dengan level learner; ini bukan klasifikasi HSK resmi untuk istilah teknis.
- Kunci dan identitas konsep yang dapat membocorkan jawaban tidak dikirim sebelum submit. Scoring dan deadline tetap di server. Snapshot mempertahankan konten historis.
- Materi belajar menampilkan Hanzi, Pinyin, arti, contoh, grammar dan sumber file/sheet/baris/kolom. Istilah Indonesia/Inggris yang memang terdapat di glosarium pengguna dipertahankan sebagai makna sumber; tidak diklaim semuanya hasil review penerjemah.
- Perpustakaan Sumber mengindeks213 file. Empat workbook HSK3–6 yang terpotong berhasil dipulihkan; file asli tetap utuh. PDF/MP3 lama berlabel arsip latihan dan tidak dijadikan penentu level HSK3.0. DOCX asli dapat diunduh dengan autentikasi agar gambar tetap dapat diakses. Workbook dengan bank kunci tidak dilayani sebagai file publik.

Pengulangan antar-sesi tetap dapat terjadi setelah pool materi baru habis, terutama Random100 pada level dengan sekitar200 entri. Tidak ada duplikasi konsep dalam satu sesi; aplikasi tidak menciptakan ratusan nomor untuk kosakata yang sama.

## Akun, riwayat dan ranking

Hasil fixture sebelumnya disimpan sebagai arsip/void dan tidak dipakai untuk baseline atau nilai resmi HSK3.0. Placement dan diagnostic perlu diulang. Profil/password tidak dihapus. Progres fixture dipisahkan dari waktu/progres kurikulum sumber. Audit mencatat transisi dan backup sebelum perubahan tersedia di data/before-hsk3-source-transition.sqlite.

Leader tetap akun bersama read-only; tidak ada Admin UI. Ranking memakai kebijakan terpisah hsk3-source-v2 agar snapshot fixture tidak muncul sebagai hasil kurikulum baru. Benchmark terkalibrasi belum tersedia: improvement/overall dapat berstatus insufficient_data, tidak diberi skor buatan.

## Menguji dan membangun ulang materi

```powershell
node --test tests/*.test.mjs
node tests/ui.mjs                 # regresi alur/5 viewport, fixture terisolasi
node tests/source-ui.mjs          # E2E materi sumber asli, database terisolasi
node scripts/build.mjs
node --env-file=.env scripts/verify-local.mjs
```

Browser test memakai Edge. Atur BROWSER_PATH jika executable berbeda. Kode JavaScript diperiksa parser Node + security lint. Suite PostgreSQL menggunakan PGlite dan RLS role nyata lokal; kontrak Supabase memakai mock transport, bukan bukti koneksi production.

Untuk memperbarui semua sumber jalankan `./scripts/build-sources.ps1`. Script membaca/memulihkan XLSX ke salinan, mengekstrak DOCX, mengindeks PDF/audio, memvalidasi pilihan/kunci/provenance, lalu memasang release secara transaksional. Membutuhkan Python dengan openpyxl, python-docx, pypdf; runtime bundled workspace ini sudah menyediakan pustaka tersebut. Instalasi ulang release yang sama tidak menggandakan bank atau menghapus placement baru.

CLI konten curated tetap tersedia melalui scripts/content.mjs, sekarang menerima HSK3.0. Sertakan concept_key, source_ref dan difficulty agar semantik dan asal dapat dipertahankan. Review/publish hanya melalui proses teknis, bukan endpoint publik.

## Dokumen

TEST_REPORT.md, TEST_PLAN.md, DATA_GAP_REPORT.md, IMPLEMENTATION_PLAN.md, KNOWN_LIMITATIONS.md, docs/OPERATIONS.md dan docs/HSK3_SOURCE_CHANGE.md mencatat implementasi aktual serta dependensi yang belum tersedia. Laporan DEMO awal disimpan di docs/archive.
