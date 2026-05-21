# Catatan Modul Keuangan (ERP Finance)

Modul Keuangan adalah "otak pembukuan" salon. Semua transaksi dari POS (penjualan, refund) dan dari Inventori (pembelian barang) otomatis menghasilkan jurnal akuntansi di sini. Jadi pemilik tidak perlu repot-repot catat manual — cukup review laporan yang sudah jadi.

Ada 4 fungsi utama:

**Auto Journal (Jurnal Otomatis)**
Setiap kali kasir mencatat transaksi penjualan, sistem otomatis membuat jurnal akuntansi. Contoh: penjualan tunai Rp 200.000 → otomatis Debit Kas Rp 200.000, Kredit Pendapatan Jasa Rp 200.000. Tidak perlu entry manual, semua real-time.

**Bank Reconciliation (Rekonsiliasi Bank)**
Sistem mencocokkan transaksi salon (penjualan via QRIS/transfer) dengan mutasi dari rekening bank. Kalau ada yang tidak cocok, sistem akan tandai dan minta diverifikasi. Ini penting untuk memastikan semua uang benar-benar masuk.

**Asset Management (Manajemen Aset)**
Catat semua aset salon: bed treatment, lampu, kursi, alat sterilisasi, dll. Sistem hitung penyusutan (depresiasi) otomatis tiap bulan — jadi nilai aset selalu update. Cocok untuk laporan pajak dan evaluasi bisnis.

**General Ledger (Buku Besar)**
Buku besar adalah kumpulan semua jurnal yang sudah diposting. Dari sini, pemilik bisa lihat laporan laba/rugi, neraca, dan arus kas kapan saja. Semua data akurat karena berasal dari transaksi nyata.

**Fitur utama:**
- **Auto Journal** — Jurnal akuntansi otomatis dari transaksi POS dan Inventori
- **Bank Reconciliation** — Cocokkan transaksi dengan mutasi bank, tandai yang tidak cocok
- **Asset Management** — Daftar aset salon, hitung depresiasi otomatis
- **General Ledger** — Buku besar, laporan laba rugi, neraca, arus kas
