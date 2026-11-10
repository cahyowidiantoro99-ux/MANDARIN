# Materi Tersimpan dan Uji Ingatan

10 November 2026. Implementasi meneruskan aplikasi existing.

- Uji Ingatan ditempatkan di Zona Interaktif. Rute #recall tetap valid dan tombol akhir flashcard memakai nama yang sama.
- Gudang Kata diganti Kata Perlu Diulang. Filter Ragu/Belum Hafal/Hafal jatuh tempo dan aturan SRS tetap sama.
- Materi Tersimpan (#saved) mencakup bookmark katalog kosakata, Hanzi, flashcard dan grammar; filter jenis, pencarian, pagination24; contoh dapat dibuka/tutup.
- Ikon pita outline/teal terisi, keyboard accessible, status akun tersimpan server-side, dapat dibatalkan. Menyimpan tidak memberi XP atau mengubah hafalan.
- Data lc_saved_words existing dipertahankan untuk flashcard/cerita. lc_saved_materials merupakan tabel tambahan dengan primary key(user_id,kind,target_id), FK akun ON DELETE CASCADE, RLS dan REVOKE anon/authenticated. Katalog memakai ID deterministik berbasis level+Hanzi. Tidak menghapus/memindahkan data existing.
- API GET/PUT /api/learn/saved dan POST /api/learn/saved/status memeriksa Employee, sesi, CSRF saat mutasi, validitas materi dan scope akses. Identitas akun diambil server, bukan dari body.
- Status bookmark diminta per batch maksimal100 tombol yang baru terlihat pada DOM; katalog tetap pagination24, dictionary indeks cached. Koleksi resolve vocabulary/grammar dibatch tanpa query per kartu.
- Migrasi: migrations/002_sources.sql untuk SQLite, migrations/001_supabase.sql untuk PostgreSQL. prepare-production menjalankan migrasi idempotent sebelum server mulai.

## Verifikasi
- 101/101 unit/integration/regression tests lulus, termasuk akses antar-akun, legacy saves, idempotensi, non-XP, HTTP auth/CSRF/Leader, serta PostgreSQL RLS/revoke.
- Build production dan syntax/security lint125JS lulus.
- Edge lokal: simpan katalog, reload persisten, Hanzi, grammar, flashcard, filter/hapus, akun kedua kosong, Chinese labels, viewport360/390/768/1672 tanpa overflow dan tanpa pageerror. Screenshot artifacts/refresh-bookmarks-*.png.
- Audio memakai speech module existing; tidak menambahkan layanan/rekaman cloud.

## File utama
app/saved-materials.mjs, app/server.mjs, app/vocab-atlas.mjs, public/bookmarks.js, public/saved-materials.js, public/app.js, public/learning-center.js, public/vocab-atlas.js, public/hanzi-atlas.js, public/recall.js, public/learning-i18n.js, public/style.css, scripts/build.mjs, scripts/build-production.mjs, kedua migration di atas, tests/saved-materials.test.mjs, tests/bookmarks-ui.mjs.
