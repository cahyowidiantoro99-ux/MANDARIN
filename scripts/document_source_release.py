from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1];r=json.loads((root/'data/source-release-report.json').read_text(encoding='utf8'));a=json.loads((root/'data/hsk3-official-level-map.json').read_text(encoding='utf8'))
archive=root/'docs/archive';archive.mkdir(exist_ok=True)
for name in ['README.md','TEST_REPORT.md','KNOWN_LIMITATIONS.md']:
    target=archive/(name.removesuffix('.md')+'_DEMO_INITIAL.md')
    if not target.exists():shutil.copyfile(root/name,target)
readme='''# ECB Language Performance System — HSK 3.0

Aplikasi Employee dan Leader sudah memakai materi sumber pengguna, bukan bank fixture berulang. Kurikulum aktif HSK 3.0 level 1–6. Sumber kosakata, contoh, grammar, latihan, PDF dan audio memiliki provenance serta pemisahan arsip versi lama.

Siap dipakai untuk pembelajaran dan evaluasi internal **lokal**. Deployment online/Supabase/SMTP nyata dan kalibrasi psikometrik belum diverifikasi. Work khusus EMERC belum tersedia karena workbook departemennya tidak dapat dibaca; aplikasi menampilkan hambatan ini tanpa membuat soal karangan.

## Menjalankan

Server lokal: http://127.0.0.1:3000. Node.js 24+ dan pnpm 11. Dependensi telah dipasang di workspace ini.

```powershell
Set-Location 'E:\\APP MANDARIN'
# Instalasi baru saja: Copy-Item .env.example .env
pnpm install --frozen-lockfile
node --env-file=.env scripts/seed.mjs --demo
node --env-file=.env scripts/install-source-release.mjs --reset-legacy
node --env-file=.env app/server.mjs
```

Atau `./start-local.ps1`. Jangan menjalankan server kedua jika port3000 sudah aktif. Pada mesin ini pnpm tersedia melalui `C:\\Users\\User\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\bin\\fallback\\pnpm.cmd` bila belum di PATH.

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
'''
(root/'README.md').write_text(readme,encoding='utf8')
gaps=f'''# Laporan sumber dan kesenjangan HSK 3.0

Perubahan pengguna pada31 Oktober2026 mengganti keputusan HSK2.0 menjadi HSK3.0 dan meminta pemakaian seluruh sumber. Spesifikasi awal disimpan sebagai riwayat; keputusan baru berlaku pada aplikasi.

| Hasil | Jumlah |
|---|---:|
| File pengguna diindeks | {r['assets']} |
| File berstatus dapat digunakan/arsip | {r['assets']-len(r['unreadable'])} |
| Workbook berhasil dipulihkan | {len(r['recovered'])} |
| File masih tidak terbaca | {len(r['unreadable'])} |
| Entri kosakata | {r['vocabulary']} |
| Materi grammar | {r['grammar_rules']} |
| Latihan berkunci sumber | {r['authored_practice']} |
| Varian MCQ | {r['questions']} |
| Unit materi/bacaan | {r['lessons']} |

## Cakupan menurut sumber

Workbook HSK: kosakata, POS, Pinyin, arti Indonesia, contoh bilingual, grammar, Practice berkunci dan dropdown distractor. Empat workbook level3–6 kehilangan manifest/akhir ZIP; entri XML yang utuh dan CRC-valid dipulihkan dan manifest dibuat ulang pada salinan di artifacts/material-inspection. File asli tidak diubah.

Workbook departemen:DBB1,DBB2,TRB,TB,EM-ERT,KMU; kata serta kalimat kerja sesuai kolom eksplisit. Delapan dokumen/workbook umum dipakai untuk glosarium, APD, perkakas, mesin, nama departemen, frasa HR dan bacaan. File PDF/MP3/ZIP dan DOCX ujian lama menjadi perpustakaan arsip latihan; tidak dilabeli ulang menjadi ujian HSK3.0.

Rincian pool: data/source-release-report.json. Payload/provenance: data/source-release.json. Inventaris/hash awal: data/source_inventory.json. Detail pemulihan: artifacts/material-inspection/report.json.

## Hambatan yang tersisa

- KOSAKATA PEKERJAAN/KOSAKATA EM-ERC.xlsx tidak merupakan OOXML/ZIP yang dapat dipulihkan. Tidak ada kata khusus EMERC yang dikarang atau diganti dengan umum. Assessment Work EMERC dinonaktifkan dengan penjelasan; bahan umum tetap dapat dipelajari. Diperlukan salinan sumber yang dapat dibaca.
- Pencocokan terhadap silabus resmi HSK3.0: {a['statistics'].get('level_matched',0)} dari5381 entri HSK cocok level/sense lemma. {len(a['review'])} perlu pemeriksaan alias/arti atau parsing homograf. Level sumber tetap dipertahankan; daftar tepat terdapat di data/hsk3-official-level-map.json. Pencocokan lemma bukan kalibrasi psikometrik.
- Tujuh latihan tidak memiliki kombinasi opsi/kunci yang dapat di-resolve secara aman, sehingga tidak dimasukkan ke bank MCQ. Materi yang masih dapat dibaca tetap tersedia untuk belajar. Duplikat entri digabung dengan provenance, bukan dijadikan soal baru.
- Sebagian glosarium sumber memakai istilah Inggris atau terjemahan yang perlu penyuntingan. Makna sumber dipertahankan; aplikasi tidak mengklaim review ahli seluruh terjemahan.
- Benchmark resmi setara dan studi validitas/difficulty empiris belum tersedia. Hasil placement merupakan evaluasi internal; belum sertifikasi HSK atau dasar penghargaan terkalibrasi.

Referensi pembanding: https://www.chinesetest.cn/syllabus (silabus2025-11, efektif2026-07). PDF referensi disimpan terpisah dari213 sumber pengguna.
'''
(root/'DATA_GAP_REPORT.md').write_text(gaps,encoding='utf8')
(root/'KNOWN_LIMITATIONS.md').write_text('''# Keterbatasan saat ini

1. Materi khusus EMERC terblokir oleh workbook tidak terbaca. Dibutuhkan salinan valid; assessment khusus departemen tidak diisi karangan. Enam departemen lainnya diuji pada grammar, Random100 dan komposisi weekly.
2. HSK3.0 mengikuti workbook pengguna dan diperiksa terhadap silabus resmi. Tujuh entri alias/arti perlu pemeriksaan tambahan. Skala kerja adalah heuristik kompleksitas teks, bukan level HSK tersertifikasi. Review editorial dan validitas psikometrik seluruh bank belum diklaim selesai.
3. Soal sumber menggantikan fixture. Jumlah30213 adalah varian MCQ, bukan30213 konsep independen. Pemilihan berdasarkan konsep mencegah duplikasi dalam ujian. Ketika pool habis, pengulangan antar-attempt tidak dapat dihilangkan sepenuhnya.
4. PDF/audio ujian lama adalah arsip pelengkap. Tidak digunakan untuk menaikkan level HSK3.0 dan tidak dicampurkan ke bank placement baru. XLSX berkunci tidak dilayani sebagai unduhan browser.
5. Koneksi proyek Supabase/PostgreSQL TCP/TLS nyata dan email pemulihan SMTP belum dapat diuji tanpa konfigurasi pemilik. SQL/RLS diuji pada PostgreSQL lokal PGlite; Auth REST menggunakan mock. Production menolak fallback SQLite.
6. Hosting/domain/HTTPS, worker terjadwal, load multi-instance dan restore database layanan target belum diverifikasi. Aplikasi aktif lokal menggunakan loopback HTTP; cookie Secure/HSTS berlaku pada mode production.
7. Benchmark improvement setara belum tersedia. Ranking dapat berstatus insufficient_data. Data fixture lama tidak dipakai sebagai baseline, completion atau skor resmi kurikulum baru. Penghargaan berbasis data nyata memerlukan kalibrasi dan persetujuan kebijakan.
8. Jawaban pending ketika offline hanya berada dalam memori tab dan dicoba ulang saat reconnect. Menutup/refresh tab sebelum tersimpan dapat menghilangkannya. Deadline server tetap berlaku.
9. Waktu belajar dibatasi heartbeat/idle/cap dan pemisahan kurikulum. Ini bukan bukti perhatian manusia terhadap klien yang sengaja diotomasi.
10. Reminder tahap pertama in-app, dievaluasi pada dashboard/worker. Push, WhatsApp dan email reminder belum diaktifkan. Identitas registrasi belum dicocokkan dengan HR; akun Leader bersama tidak memberi audit individual.
11. UI diuji di Edge pada lima viewport. Safari/Firefox, perangkat fisik dan audit screen reader belum dijalankan.

Versi ini dapat digunakan untuk belajar/evaluasi internal lokal dengan materi sumber; klaim siap produksi online menunggu dependensi target di atas.
''',encoding='utf8')
plan='''# Status implementasi HSK 3.0

Permintaan terbaru: ganti fixture berulang dengan sumber pengguna, gunakan HSK3.0 dan lanjutkan aplikasi yang dapat dipakai.

| Area | Implementasi |
|---|---|
| Audit/pemulihan |213 sumber;4 workbook dipulihkan pada salinan;1 EMERC tidak terbaca |
| Materi |7492 kosakata,481 grammar,474 latihan berkunci,743 unit,70 paket berisi materi berbeda |
| Bank soal |30213 varian berbasis sumber;concept_key,provenance,level,difficulty;tanpa fallback ke fixture |
| Sampling |Unik berdasarkan konsep,lintas jenis/lintas umum-departemen;rotasi dua attempt terakhir/minggu sebelumnya;least-exposed |
| Placement |20 soal per tahap,4 grammar/8 konteks/8 terjemahan;baseline baru terpisah dari self-assessed |
| Assessment |Weekly HSK6 grammar/12 konteks/12 terjemahan;Work18:12;Random30/100 juga Pinyin |
| Learning |Words,contoh,grammar,provenance,perpustakaan PDF/audio/DOCX asli,heartbeat |
| Migrasi pengguna |Password/profil/histori dipertahankan;fixture diarsipkan;placement/diagnostic/progres baru;policy ranking terpisah |
| Security |Key dan semantic concept key tidak diekspos sebelum submit;media autentikasi/path allowlist/range;RLS tabel baru |
| QA |Regression core,source quality/runtime,UI fixture dan UI sumber,Edge lima viewport;lihat TEST_REPORT |
| Belum terverifikasi |EMERC,review alias/editorial,kalibrasi,proyek Supabase/SMTP,hosting online |

Tidak ada Admin UI. Integrasi Auth/otorisasi/read-only Leader/scoring server tetap dipertahankan.
'''
(root/'IMPLEMENTATION_PLAN.md').write_text(plan,encoding='utf8')
for name in ['docs/OPERATIONS.md','TEST_PLAN.md']:
    p=root/name;s=p.read_text(encoding='utf8').replace('HSK2.0','HSK3.0').replace('HSK 2.0','HSK 3.0');p.write_text(s,encoding='utf8')
ops=root/'docs/OPERATIONS.md';s=ops.read_text(encoding='utf8');note='''# Pembaruan operasional HSK3.0 — berlaku sebelum prosedur lama

CONTENT_MODE=source memilih materi asli; DEMO_MODE hanya kelompok akun. Untuk sumber baru gunakan scripts/build-sources.ps1 atau install payload yang sudah dibangun: node --env-file=.env scripts/install-source-release.mjs --reset-legacy. Pipeline ini memakai pemeriksaan struktur/kunci/provenance otomatis; tidak menyebut operator sebagai reviewer pedagogis. Update versi mengarsipkan versi aktif lama, menjaga snapshot dan tidak menghapus placement HSK3.0 saat release yang sama dipasang ulang.

Transisi pertama mengarsipkan hasil fixture/HSK2.0, membatalkan attempt fixture aktif, mengosongkan baseline lama, memisahkan learning time/progres dan memakai policy hsk3-source-v2. Akun dan riwayat tetap ada. Backup pra-transisi tersedia. Worker tetap diperlukan untuk expiry/reminder/snapshot. Media PDF/MP3/DOCX sumber memerlukan sesi; XLSX berkunci tidak diberikan ke browser. Katalog library mencakup sumber lama dengan label arsip.

Untuk impor curated, tambahkan concept_key yang sama untuk varian satu materi, source_ref {file,sheet,row,column}, difficulty1–6 dan arah terjemahan. Konten tanpa kalibrasi tidak diberi benchmark buatan. Template sekarang HSK3.0.

Sumber EMERC yang gagal dipulihkan tidak dipublikasikan sebagai kosakata khusus. Setelah file valid disediakan, letakkan sebagai pengganti yang telah dibackup dan jalankan pipeline; uji komposisi18:12 dan level kompleksitas sebelum digunakan.

Bagian berikut tetap menjadi pedoman keamanan dan layanan produksi; konfigurasi Supabase/SMTP/domain belum tersedia pada run ini.

---

''';
if not s.startswith('# Pembaruan operasional HSK3.0'):ops.write_text(note+s,encoding='utf8')
(root/'docs/HSK3_SOURCE_CHANGE.md').write_text('''# Perubahan bank sumber HSK3.0

Penyebab keluhan: seed awal menggandakan sepuluh kata dan satu grammar menjadi banyak nomor di enam level. Unit test mekanisme berhasil tetapi tidak menguji kelayakan pedagogis fixture. Fixture seharusnya tidak menjadi bahan penentuan level pengguna.

Perbaikan: publish release sumber tersendiri, arsipkan fixture, samakan level bank dengan workbook HSK3.0, tambahkan metadata konsep dan sampling per keterampilan, lalu validasi sumber dan browser menggunakan corpus nyata. Penomoran baru atau pembalikan arah tidak menambah hitungan konsep. Departemen dipilih lebih dahulu agar pool terbatasnya tidak habis oleh kata yang juga ada pada umum.

Bank sumber memakai jawaban bilingual/Practice yang eksplisit. Distractor kamus menggunakan kelompok level dan POS serta mengecualikan arti yang bertumpuk secara tekstual; latihan authored mempertahankan opsi dan kunci sumber lalu menambah opsi keempat dari kalimat sumber lain. Seluruhnya tetap memerlukan review editorial/validitas empiris sebelum dianggap instrumen tersertifikasi. Asal setiap jawaban dapat dibuka setelah submit.

Empat XLSX dipulihkan dari local ZIP entries yang datanya utuh/CRC-valid dan manifest dibangun ulang. Tidak ada perubahan pada byte sumber asli. EMERC tidak dapat dipulihkan. Semua213 file terlihat dalam perpustakaan, termasuk status gagal dan arsip HSK lama.

Kesesuaian lemma diperiksa terhadap silabus resmi https://www.chinesetest.cn/syllabus. Hasil5374/5381 cocok; tujuh entri tercatat untuk pemeriksaan alias/arti. Referensi ini tidak menggantikan uji kesulitan empiris.

Riwayat lama tersedia sebagai arsip. Penentuan level, baseline, progres dan ranking baru tidak mengambil skor fixture. Akun/password tidak diganti. Instalasi ulang idempotent dan server-side security tetap diuji.
''',encoding='utf8')
print('Documentation updated for the actual source release.')
