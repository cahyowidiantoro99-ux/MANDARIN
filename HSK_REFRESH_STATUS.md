# Pembaruan simulasi dan naik level

Konfigurasi pengguna: per level 7 mudah, 7 sedang, 4 sulit untuk simulasi; tiga kode terbesar dari kelompok sulit untuk naik level. 108 simulasi dan 18 naik level terdaftar. Tingkat kesulitan adalah klasifikasi internal pengguna, bukan label resmi penerbit. H41005/H41008/H41329 disimpan sebagai cadangan, tidak masuk daftar utama.

116 paket tervalidasi; 10 paket simulasi belum diaktifkan karena sumber belum terverifikasi:
- H31007: Kunci sumber tidak ditemukan
- H61007: Kunci sumber tidak ditemukan
- H61008: Urutan bagian tidak konsisten
- H61009: Urutan bagian tidak konsisten
- H61110: Urutan bagian tidak konsisten
- H61111: Urutan bagian tidak konsisten
- H61218: Urutan bagian tidak konsisten
- H61219: Urutan bagian tidak konsisten
- H61220: Urutan bagian tidak konsisten
- H61221: Urutan bagian tidak konsisten

Seluruh 18 paket naik level valid. Bank historis dipertahankan; tidak ada migrasi atau perubahan riwayat/nilai akun. Belum diterbitkan.

UI: daftar paket dengan filter otomatis HSK/kesulitan/mode; mulai/lanjutkan/sesi baru. Jawaban mengikuti grup nomor pada halaman asli, bukan semua jawaban satu bagian. Gambar hanya dimuat untuk halaman yang dipilih. Desktop panel soal dan jawaban berdampingan; HP panel gambar dibatasi tinggi dan jawaban grup di bawah. Tidak ada klaim ekstraksi per-soal lengkap: grup saat ini mengikuti halaman sumber.

Verifikasi: 14/14 tes official-hsk + hsk-center lulus; browser lokal daftar 7 mudah / 4 sulit, filter otomatis, 390px, dan grup halaman 1=1-5, halaman2=6-8 lulus. Screenshot di artifacts/hsk-refresh/.

Final validation: 102/102 existing tests passed; build/lint125 passed. New selection invariant test added; latest page-coverage guard protects any unmapped answer. UI screenshot tests are isolated synthetic sessions with real source pages; production not changed.

## Verifikasi 10 paket — 11 November 2026
- H31007: kunci halaman 15–16 ditranskripsi dari scan asli dan diperiksa visual. 70 kunci objektif dan 10 referensi Writing lengkap.
- H61007: kunci halaman 21–22 ditranskripsi dari scan asli dan diperiksa visual. 100 kunci objektif lengkap; naskah Writing tersedia, kunci esai bertanda 略 sesuai sumber.
- Transkripsi di verified-source-overrides.json dibatasi SHA-256 sumber agar tidak diterapkan jika PDF berubah.
- H61008, H61009, H61110, H61111, H61218, H61219, H61220, H61221: 100 kunci objektif tersedia, tetapi PDF lokal tidak memuat naskah Writing sebelum kunci. Tetap tidak dibuka sebagai simulasi penuh. Perlu masing-masing lampiran 书写 sesuai kode. Pencarian publik menemukan referensi lampiran terpisah; unduhan yang dicoba belum menghasilkan sumber lengkap terverifikasi.
- 118/126 paket terpilih tervalidasi; bank runtime 120 termasuk dua paket historis. 18 paket promotion tervalidasi.
- Full regression awal: 103 pass, 2 fail karena aset baru belum disalin; setelah aset disalin, dua tes terkait beserta regresi HSK lulus 12/12. Build/security lint 127 JS lulus. Preview desktop dan 390px lulus, tombol H31007 aktif. Tidak deploy pada tahap ini.
