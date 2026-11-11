# Placement v2

60 soal, dua variasi untuk setiap kombinasi lima jenis dan enam level HSK3.0. Server menyimpan snapshot 30 soal dan mengacak opsi serta potongan kalimat. Satu soal aktif ditampilkan. Jawaban pertama salah menghentikan sesi dan menetapkan level soal tersebut; semua benar menetapkan HSK6.

Sumber kata/pola: data/source-release.json; konteks soal baru ditulis untuk evaluasi internal ECB, bukan paket resmi HSK. Kesulitan mengikuti kurikulum dan kompleksitas bahasa, belum dikalibrasi secara psikometrik. Pengacakan tidak menjamin setiap peserta mendapat set unik.

Integrasi: Service source placement baru memakai app/placement-v2.mjs. Sesi aktif lama dan mode fixture tetap memakai alur lama. Tidak ada migrasi schema atau reset data. Batas waktu memakai konfigurasi exam_minutes existing; jika kedaluwarsa, level mengikuti soal aktif, dengan alasan time_expired yang dibedakan dari jawaban salah. Tidak ada perubahan baseline_hsk/hsk_benchmark karena skor campuran level tidak sebanding dengan baseline satu level.

Keamanan: hanya satu soal berikutnya dikirim, kunci server-only, jawaban terkunci, retry identik idempotent, transaksi menyimpan hasil sekali. Kontrol kepemilikan dan peran memakai Service existing. Snapshot memakai UUID agar cocok dengan PostgreSQL.

Verifikasi: 116 tes keseluruhan lulus, termasuk 12 tes placement bank/runtime/PostgreSQL; build dan lint dijalankan. Preview UI memakai respons Service lokal dan diuji di desktop serta 390px. Belum deploy pada saat dokumen ini ditulis.
