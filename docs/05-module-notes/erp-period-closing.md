# Catatan Penutupan Periode (ERP Period Closing)

Penutupan periode adalah proses "mengunci" data di akhir bulan atau akhir tahun. Setelah periode ditutup, transaksi di periode tersebut tidak bisa diubah lagi. Ini penting untuk menjaga integritas laporan keuangan — data yang sudah dilaporkan ke pemilik atau pajak harus tetap konsisten.

**Proses Penutupan Periode:**

**1. Period Review**
Sebelum menutup, pemilik atau supervisor harus review data periode tersebut: total penjualan, mutasi stok, rekonsiliasi bank, daftar aset, dan buku besar. Sistem akan menampilkan ringkasan dan memastikan tidak ada yang janggal. Kalau ada selisih, harus diperbaiki dulu sebelum lanjut.

**2. Owner Approval**
Setelah review selesai, pemilik harus memberikan persetujuan (approval) untuk menutup periode. Ini sebagai tanda bahwa pemilik sudah melihat dan menyetujui laporan periode tersebut. Tanpa approval, periode tidak bisa ditutup.

**3. Period Lock**
Setelah di-approve, periode terkunci. Artinya:
- Tidak bisa input transaksi baru dengan tanggal di periode tersebut
- Tidak bisa edit atau hapus transaksi yang sudah ada
- Laporan periode tersebut jadi final

**4. Correction (Jika Ada Kesalahan)**
Kalau setelah periode terkunci ternyata ada kesalahan? Tidak bisa edit langsung. Perbaikan hanya bisa dilakukan dengan dua cara:
- **Adjustment** — Buat jurnal penyesuaian di periode berjalan untuk mengoreksi
- **Reversal** — Batalkan transaksi lama dengan membuat transaksi reversal (pembalikan)

Semua koreksi tercatat di audit trail dan terlihat jelas oleh pemilik.

**Fitur utama:**
- **Period Review** — Review penjualan, stok, bank, aset, dan GL sebelum closing
- **Owner Approval** — Pemilik approve penutupan periode sebagai tanda final
- **Period Lock** — Semua transaksi di periode terkunci, tidak bisa diubah
- **Correction via Adjustment/Reversal** — Koreksi hanya via adjustment journal atau reversal, tidak bisa edit langsung
- **Audit Trail** — Semua koreksi tercatat dan bisa dilacak
