# Test Cases — QA Documentation

**Project:** Salon Eyelash POS/ERP System
**Versi Dokumen:** 1.0
**Tanggal:** 18 Mei 2026

---

## Ringkasan Modul yang Diuji

| No | Modul | Jumlah Test Case |
|----|---|---|
| 1 | Login / Auth | 2 |
| 2 | POS Transaction | 3 |
| 3 | Customer Management | 2 |
| 4 | Booking | 2 |
| 5 | Payment & Receipt | 3 |
| 6 | Daily Closing | 2 |
| 7 | Products / Inventory | 2 |
| 8 | Stock Movement | 2 |
| 9 | Commissions | 2 |
| 10 | Reports (Sales, Expenses, Bookkeeping) | 2 |
| 11 | Expenses | 2 |
| 12 | User Management | 2 |
| | **Total** | **26** |

---

## 1. Modul: Login / Auth

### TC-AUTH-001 — Login Berhasil dengan Kredensial Valid

| Item | Detail |
|---|---|
| **ID** | TC-AUTH-001 |
| **Modul** | Login / Auth |
| **Fitur** | Autentikasi Pengguna |
| **Skenario** | **Positif** — User login menggunakan username dan password yang benar |
| **Langkah Uji** | 1. Buka halaman login sistem<br>2. Masukkan username valid (contoh: `cashier01`)<br>3. Masukkan password yang sesuai<br>4. Klik tombol "Masuk" |
| **Hasil yang Diharapkan** | Sistem mengautentikasi user, menampilkan dashboard sesuai role (cashier/terapis/owner/finance), dan user berhasil masuk ke sistem tanpa error. Token JWT tergenerate dan tersimpan di session. |

### TC-AUTH-002 — Login Gagal dengan Password Salah

| Item | Detail |
|---|---|
| **ID** | TC-AUTH-002 |
| **Modul** | Login / Auth |
| **Fitur** | Autentikasi Pengguna — Validasi Kredensial |
| **Skenario** | **Negatif** — User memasukkan password yang salah |
| **Langkah Uji** | 1. Buka halaman login sistem<br>2. Masukkan username valid<br>3. Masukkan password yang salah (contoh: `wrongpass123`)<br>4. Klik tombol "Masuk" |
| **Hasil yang Diharapkan** | Sistem menampilkan pesan error: "Username atau password salah." User tetap berada di halaman login. Tidak ada session yang dibuat. Percobaan login gagal dicatat di audit log. |

---

## 2. Modul: POS Transaction

### TC-POS-001 — Transaksi Walk-in dengan Pembayaran Tunai

| Item | Detail |
|---|---|
| **ID** | TC-POS-001 |
| **Modul** | POS Transaction |
| **Fitur** | Transaksi Walk-in |
| **Skenario** | **Positif** — Customer walk-in, kasir membuat transaksi baru, memilih treatment, membayar tunai |
| **Langkah Uji** | 1. Kasir buka POS Session (shift)<br>2. Klik "Transaksi Baru"<br>3. Pilih customer dari daftar (atau buat baru jika tidak terdaftar)<br>4. Pilih treatment: "Classic Eyelash Extension 120s"<br>5. Pilih staff terapis<br>6. Pilih bed yang tersedia<br>7. Klik "Proses Treatment"<br>8. Setelah treatment selesai, klik "Bayar"<br>9. Pilih metode pembayaran: **Tunai**<br>10. Masukkan nominal uang Rp200.000<br>11. Klik "Konfirmasi Pembayaran" |
| **Hasil yang Diharapkan** | Transaksi berhasil dibuat dengan nomor dokumen POS dan BOOK. Status transaksi berubah menjadi `paid`. Sistem menghitung dan menampilkan kembalian secara otomatis. Struk tercetak. Data masuk ke queue sync ERP. |

### TC-POS-002 — Transaksi dengan Treatment Gagal karena Bed Tidak Tersedia

| Item | Detail |
|---|---|
| **ID** | TC-POS-002 |
| **Modul** | POS Transaction |
| **Fitur** | Alokasi Bed |
| **Skenario** | **Negatif** — Kasir mencoba memilih bed yang sudah di-occupied oleh transaksi lain |
| **Langkah Uji** | 1. Kasir buka POS Session<br>2. Buat transaksi baru untuk customer<br>3. Pilih treatment<br>4. Pilih bed yang saat ini berstatus `occupied` (sedang dipakai transaksi lain)<br>5. Klik "Konfirmasi" |
| **Hasil yang Diharapkan** | Sistem menampilkan peringatan: "Bed tidak tersedia. Silakan pilih bed lain." Transaksi tidak dapat dilanjutkan. Status bed tetap `occupied`. |

### TC-POS-003 — Pembatalan Transaksi (Void) dengan Alasan

| Item | Detail |
|---|---|
| **ID** | TC-POS-003 |
| **Modul** | POS Transaction |
| **Fitur** | Cancel / Void Transaksi |
| **Skenario** | **Positif** — Transaksi yang sudah `paid` dibatalkan oleh supervisor dengan alasan valid |
| **Langkah Uji** | 1. Buka daftar transaksi yang sudah selesai<br>2. Pilih transaksi yang akan dibatalkan<br>3. Klik "Batalkan Transaksi"<br>4. Pilih alasan pembatalan dari daftar Cancel Reason (misal: "Customer cancel")<br>5. Masukkan catatan tambahan (opsional)<br>6. Supervisor melakukan konfirmasi approval<br>7. Klik "Void Transaksi" |
| **Hasil yang Diharapkan** | Status transaksi berubah menjadi `cancelled`. Stok material yang sudah terpakai dikembalikan (reversal). Jurnal pembalik (reversing journal entry) terbuat secara otomatis. Nomor dokumen tetap tercatat di Document Registry dengan status `cancelled`. |

---

## 3. Modul: Customer Management

### TC-CUST-001 — Registrasi Customer Baru Lengkap

| Item | Detail |
|---|---|
| **ID** | TC-CUST-001 |
| **Modul** | Customer Management |
| **Fitur** | Registrasi Customer |
| **Skenario** | **Positif** — Kasir mendaftarkan customer baru dengan data lengkap |
| **Langkah Uji** | 1. Buka menu "Customer"<br>2. Klik "Tambah Customer Baru"<br>3. Isi semua field: nama lengkap, nomor telepon, email, tanggal lahir, jenis kelamin, catatan<br>4. Centang "Jadikan Member"<br>5. Klik "Simpan" |
| **Hasil yang Diharapkan** | Customer baru tersimpan dengan nomor member unik (auto-generate). Data muncul di daftar customer. Poin loyalitas awal = 0. Total kunjungan = 0. |

### TC-CUST-002 — Registrasi Customer dengan Nomor Telepon Duplikat

| Item | Detail |
|---|---|
| **ID** | TC-CUST-002 |
| **Modul** | Customer Management |
| **Fitur** | Validasi Data Duplikat |
| **Skenario** | **Negatif** — Kasir mencoba mendaftarkan customer baru dengan nomor telepon yang sudah terdaftar |
| **Langkah Uji** | 1. Buka menu "Tambah Customer Baru"<br>2. Isi nama lengkap<br>3. Masukkan nomor telepon yang sudah terdaftar di sistem<br>4. Isi field lainnya<br>5. Klik "Simpan" |
| **Hasil yang Diharapkan** | Sistem menolak penyimpanan dan menampilkan pesan: "Nomor telepon sudah terdaftar. Gunakan nomor lain atau cari customer yang sudah ada." Data tidak tersimpan. |

---

## 4. Modul: Booking

### TC-BOOK-001 — Booking Janji Temu Berhasil

| Item | Detail |
|---|---|
| **ID** | TC-BOOK-001 |
| **Modul** | Booking |
| **Fitur** | Scheduled Booking |
| **Skenario** | **Positif** — Customer melakukan booking janji temu untuk tanggal dan jam tertentu |
| **Langkah Uji** | 1. Buka menu "Booking"<br>2. Klik "Buat Booking Baru"<br>3. Pilih customer (atau daftarkan baru)<br>4. Pilih treatment<br>5. Pilih terapis preferensi<br>6. Pilih tanggal dan jam booking<br>7. Sistem otomatis menampilkan slot waktu yang tersedia<br>8. Konfirmasi booking |
| **Hasil yang Diharapkan** | Booking berhasil dengan nomor `BOOK-XXX-YYYYMMDD-SEQ`. Jadwal terapis terblokir untuk slot waktu tersebut. Bed teralokasi (status reserve). Customer mendapat notifikasi (jika terintegrasi). Status booking: `confirmed`. |

### TC-BOOK-002 — Booking di Luar Jam Operasional

| Item | Detail |
|---|---|
| **ID** | TC-BOOK-002 |
| **Modul** | Booking |
| **Fitur** | Validasi Jadwal |
| **Skenario** | **Negatif** — Customer mencoba booking di jam di luar jam operasional cabang |
| **Langkah Uji** | 1. Buka menu "Buat Booking Baru"<br>2. Pilih customer dan treatment<br>3. Pilih tanggal<br>4. Pilih jam mulai: pukul 22:00 (cabang tutup jam 21:00)<br>5. Klik "Konfirmasi" |
| **Hasil yang Diharapkan** | Sistem menampilkan pesan: "Jam yang dipilih di luar jam operasional (08:00–21:00). Silakan pilih jam lain." Booking tidak tersimpan. |

---

## 5. Modul: Payment & Receipt

### TC-PAY-001 — Pembayaran Tunai dengan Perhitungan Kembalian

| Item | Detail |
|---|---|
| **ID** | TC-PAY-001 |
| **Modul** | Payment & Receipt |
| **Fitur** | Pembayaran Tunai |
| **Skenario** | **Positif** — Customer membayar tunai dengan nominal lebih besar dari total transaksi |
| **Langkah Uji** | 1. Transaksi selesai dengan total Rp350.000<br>2. Pilih metode pembayaran: **Tunai**<br>3. Masukkan nominal uang customer: Rp500.000<br>4. Klik "Hitung Kembalian" |
| **Hasil yang Diharapkan** | Sistem otomatis menghitung dan menampilkan kembalian: Rp150.000. Status transaksi menjadi `paid`. Struk tercetak menampilkan nominal bayar dan kembalian. |

### TC-PAY-002 — Pembayaran QRIS dengan Referensi Invalid

| Item | Detail |
|---|---|
| **ID** | TC-PAY-002 |
| **Modul** | Payment & Receipt |
| **Fitur** | Pembayaran QRIS |
| **Skenario** | **Negatif** — Sistem menampilkan QR code, tetapi pembayaran gagal (timeout / dibatalkan customer) |
| **Langkah Uji** | 1. Transaksi total Rp275.000<br>2. Pilih metode pembayaran: **QRIS**<br>3. Sistem generate QR code<br>4. Customer scan QR tetapi tidak melanjutkan pembayaran (timeout 5 menit)<br>5. Klik "Cek Status" setelah timeout |
| **Hasil yang Diharapkan** | Sistem mendeteksi status pembayaran `failed` atau `pending` setelah timeout. Menampilkan opsi: "Ulangi Pembayaran" atau "Ganti Metode Pembayaran". Transaksi tetap berstatus `completed` (belum paid). |

### TC-PAY-003 — Split Payment Cash + Kartu Kredit

| Item | Detail |
|---|---|
| **ID** | TC-PAY-003 |
| **Modul** | Payment & Receipt |
| **Fitur** | Split Payment |
| **Skenario** | **Positif** — Customer membayar dengan kombinasi tunai dan kartu kredit |
| **Langkah Uji** | 1. Transaksi total Rp500.000<br>2. Pilih metode **Split Payment**<br>3. Tambah metode pertama: Tunai Rp200.000<br>4. Tambah metode kedua: Kartu Kredit Rp300.000<br>5. Masukkan approval code kartu kredit<br>6. Klik "Konfirmasi Pembayaran" |
| **Hasil yang Diharapkan** | Kedua metode pembayaran tercatat sukses. Total bayar = Rp500.000 (sesuai grand total). Struk menampilkan rincian split payment. Jurnal otomatis mencatat debit ke akun Kas (Rp200.000) dan Bank (Rp300.000). |

---

## 6. Modul: Daily Closing

### TC-CLOS-001 — Daily Closing Berhasil dengan Selisih Nol

| Item | Detail |
|---|---|
| **ID** | TC-CLOS-001 |
| **Modul** | Daily Closing |
| **Fitur** | Penutupan Shift Kasir |
| **Skenario** | **Positif** — Kasir menutup shift dengan saldo fisik sesuai saldo sistem |
| **Langkah Uji** | 1. Pastikan semua transaksi hari ini sudah selesai (`paid`)<br>2. Buka menu "Daily Closing"<br>3. Sistem menampilkan rekap: total transaksi, total penjualan, total pajak, total diskon<br>4. Masukkan saldo akhir fisik (closing balance) — sama dengan expected balance<br>5. Klik "Tutup Shift"<br>6. Supervisor melakukan verifikasi |
| **Hasil yang Diharapkan** | POS Session berstatus `closed` → `verified`. Selisih = Rp0. Data otomatis masuk ke Sync Queue untuk diproses ERP. Nomor EOP tergenerate. Struk closing tercetak. |

### TC-CLOS-002 — Daily Closing dengan Selisih Saldo

| Item | Detail |
|---|---|
| **ID** | TC-CLOS-002 |
| **Modul** | Daily Closing |
| **Fitur** | Penutupan Shift — Selisih Kas |
| **Skenario** | **Negatif** — Saldo fisik berbeda dengan saldo sistem (kurang/lebih) |
| **Langkah Uji** | 1. Buka menu "Daily Closing"<br>2. Sistem menampilkan expected balance: Rp2.500.000<br>3. Masukkan closing balance: Rp2.450.000 (selisih -Rp50.000)<br>4. Sistem menampilkan peringatan selisih<br>5. Masukkan catatan: "Selisih kurang Rp50.000, dugaan salah hitung"<br>6. Supervisor melakukan approve dengan catatan |
| **Hasil yang Diharapkan** | Closing tetap dapat dilanjutkan dengan status `verified` + catatan selisih. Selisih tercatat untuk investigasi lebih lanjut. Jurnal adjustment otomatis untuk selisih kas (debit: Beban Selisih Kas, kredit: Kas). |

---

## 7. Modul: Products / Inventory

### TC-INV-001 — Penerimaan Barang dari Supplier (Goods Receipt)

| Item | Detail |
|---|---|
| **ID** | TC-INV-001 |
| **Modul** | Products / Inventory |
| **Fitur** | Goods Receipt |
| **Skenario** | **Positif** — Penerimaan barang dari supplier sesuai Purchase Order |
| **Langkah Uji** | 1. Buka menu "Penerimaan Barang"<br>2. Pilih Purchase Order yang sudah di-approve (status `sent`)<br>3. Sistem menampilkan daftar item PO<br>4. Masukkan quantity diterima (full receipt)<br>5. Masukkan nomor batch dan tanggal expiry untuk produk yang memerlukan batch<br>6. Klik "Terima Barang" |
| **Hasil yang Diharapkan** | Stok produk bertambah sesuai quantity diterima. Batch baru tercatat dengan nomor batch dan expiry date. Purchase Order berubah status menjadi `fully_received`. Stock Movement (STK) tergenerate. Harga pokok tercatat. |

### TC-INV-002 — Penerimaan Barang Melebihi Quantity PO

| Item | Detail |
|---|---|
| **ID** | TC-INV-002 |
| **Modul** | Products / Inventory |
| **Fitur** | Goods Receipt — Validasi Quantity |
| **Skenario** | **Negatif** — User mencoba menerima barang dengan quantity melebihi Purchase Order |
| **Langkah Uji** | 1. Buka menu "Penerimaan Barang"<br>2. Pilih PO dengan quantity order: 10 unit<br>3. Masukkan quantity diterima: 12 unit<br>4. Klik "Terima Barang" |
| **Hasil yang Diharapkan** | Sistem menolak dan menampilkan pesan: "Quantity diterima tidak boleh melebihi quantity PO." Barang tidak diterima. Tidak ada perubahan stok. |

---

## 8. Modul: Stock Movement

### TC-STK-001 — Mutasi Stok Transfer Antar Cabang

| Item | Detail |
|---|---|
| **ID** | TC-STK-001 |
| **Modul** | Stock Movement |
| **Fitur** | Transfer Stok Antar Cabang |
| **Skenario** | **Positif** — Transfer stok produk dari cabang pusat ke cabang cabang |
| **Langkah Uji** | 1. Buka menu "Transfer Stok"<br>2. Pilih cabang asal: Cabang Pusat<br>3. Pilih cabang tujuan: Cabang 2<br>4. Pilih produk dan quantity yang akan ditransfer<br>5. Klik "Kirim"<br>6. Cabang tujuan buka menu dan klik "Terima"<br>7. Konfirmasi penerimaan |
| **Hasil yang Diharapkan** | Stok cabang asal berkurang, stok cabang tujuan bertambah. Dua Stock Movement tercatat: `transfer_out` (asal) dan `transfer_in` (tujuan). Status transfer: `received`. Nomor STK tergenerate untuk kedua movement. |

### TC-STK-002 — Transfer Stok dengan Stok Tidak Mencukupi

| Item | Detail |
|---|---|
| **ID** | TC-STK-002 |
| **Modul** | Stock Movement |
| **Fitur** | Transfer Stok — Validasi Ketersediaan |
| **Skenario** | **Negatif** — User mencoba mentransfer produk dengan quantity melebihi stok tersedia |
| **Langkah Uji** | 1. Buka menu "Transfer Stok"<br>2. Pilih produk dengan stok saat ini: 5 unit<br>3. Masukkan quantity transfer: 10 unit<br>4. Klik "Kirim" |
| **Hasil yang Diharapkan** | Sistem menampilkan error: "Stok tidak mencukupi. Stok tersedia: 5 unit." Transfer tidak diproses. Tidak ada perubahan stok. |

---

## 9. Modul: Commissions

### TC-COM-001 — Perhitungan Komisi Terapis Otomatis

| Item | Detail |
|---|---|
| **ID** | TC-COM-001 |
| **Modul** | Commissions |
| **Fitur** | Komisi Terapis |
| **Skenario** | **Positif** — Komisi terapis dihitung otomatis dari treatment yang sudah selesai dan dibayar |
| **Langkah Uji** | 1. Pastikan ada transaksi treatment selesai yang dibayar hari ini<br>2. Buka menu "Komisi"<br>3. Pilih periode komisi (hari ini)<br>4. Sistem menampilkan daftar treatment per terapis<br>5. Periksa perhitungan: treatment price × commission_rate (contoh: Rp300.000 × 20% = Rp60.000)<br>6. Klik "Generate Komisi" |
| **Hasil yang Diharapkan** | Komisi setiap terapis terhitung otomatis berdasarkan treatment yang selesai. Total komisi muncul per terapis. Data masuk ke modul finance sebagai beban komisi dan hutang komisi ke staff. |

### TC-COM-002 — Komisi untuk Treatment yang Dibayar Sebagian (Refund)

| Item | Detail |
|---|---|
| **ID** | TC-COM-002 |
| **Modul** | Commissions |
| **Fitur** | Komisi — Refund Adjustment |
| **Skenario** | **Negatif** — Treatment sudah selesai dan komisi sudah dihitung, tetapi kemudian dilakukan refund |
| **Langkah Uji** | 1. Cari transaksi yang sudah di-refund sebagian<br>2. Buka menu "Komisi"<br>3. Sistem menampilkan komisi yang sudah terhitung<br>4. Lakukan proses refund<br>5. Periksa ulang perhitungan komisi |
| **Hasil yang Diharapkan** | Sistem otomatis menyesuaikan komisi: komisi untuk item yang di-refund dihapus atau dikurangi. Jurnal koreksi komisi terbuat otomatis (debit: hutang komisi, kredit: beban komisi). |

---

## 10. Modul: Reports

### TC-RPT-001 — Laporan Penjualan Harian (Sales Report)

| Item | Detail |
|---|---|
| **ID** | TC-RPT-001 |
| **Modul** | Reports |
| **Fitur** | Laporan Penjualan Harian |
| **Skenario** | **Positif** — Owner/Manajer generate laporan penjualan harian dengan filter tanggal |
| **Langkah Uji** | 1. Buka menu "Reports" → "Laporan Penjualan"<br>2. Pilih rentang tanggal: 18 Mei 2026<br>3. Pilih cabang: Semua Cabang<br>4. Klik "Generate"<br>5. Sistem menampilkan tabel: total transaksi, total revenue, rata-rata transaksi, breakdown per metode pembayaran, breakdown per treatment |
| **Hasil yang Diharapkan** | Laporan muncul dengan data akurat sesuai transaksi yang terjadi. Total revenue = jumlah seluruh grand total transaksi yang `paid` di tanggal tersebut. Grafik perbandingan metode pembayaran tampil. Laporan dapat di-export ke PDF/Excel. |

### TC-RPT-002 — Laporan Bookkeeping dengan Ketidakseimbangan Debit-Kredit

| Item | Detail |
|---|---|
| **ID** | TC-RPT-002 |
| **Modul** | Reports |
| **Fitur** | Laporan Bookkeeping / Trial Balance |
| **Skenario** | **Negatif** — Terdapat jurnal yang tidak balance (debit ≠ kredit) dalam periode |
| **Langkah Uji** | 1. Buka menu "Reports" → "Trial Balance"<br>2. Pilih periode akuntansi<br>3. Klik "Generate"<br>4. Sistem menghitung total debit dan total kredit |
| **Hasil yang Diharapkan** | Jika ada ketidakseimbangan, sistem menampilkan peringatan: "Terdapat ketidakseimbangan buku besar. Selisih: RpX.XXX. Segera lakukan koreksi." Daftar jurnal yang tidak balance ditampilkan untuk ditinjau. Laporan tetap dapat di-download dengan catatan "Unbalanced". |

---

## 11. Modul: Expenses

### TC-EXP-001 — Pencatatan Biaya Operasional Harian

| Item | Detail |
|---|---|
| **ID** | TC-EXP-001 |
| **Modul** | Expenses |
| **Fitur** | Input Biaya Operasional |
| **Skenario** | **Positif** — Finance staff mencatat biaya operasional harian (listrik, air, kebersihan) |
| **Langkah Uji** | 1. Buka menu "Expenses"<br>2. Klik "Tambah Biaya Baru"<br>3. Pilih kategori biaya: "Beban Operasional"<br>4. Masukkan deskripsi: "Biaya listrik bulan Mei 2026"<br>5. Masukkan jumlah: Rp1.500.000<br>6. Pilih cost center: Cabang Pusat<br>7. Upload bukti pembayaran (foto struk PLN)<br>8. Klik "Simpan" |
| **Hasil yang Diharapkan** | Biaya tercatat dengan nomor dokumen ekspens. Jurnal otomatis: Debit — Beban Listrik, Kredit — Kas/Bank. Jurnal terposting ke GL periode berjalan. Bukti pembayaran tersimpan sebagai attachment. |

### TC-EXP-002 — Pencatatan Biaya dengan Nominal Negatif

| Item | Detail |
|---|---|
| **ID** | TC-EXP-002 |
| **Modul** | Expenses |
| **Fitur** | Validasi Input Biaya |
| **Skenario** | **Negatif** — User mencoba mencatat biaya dengan nominal ≤ 0 |
| **Langkah Uji** | 1. Buka menu "Tambah Biaya Baru"<br>2. Pilih kategori biaya<br>3. Masukkan nominal: -Rp50.000 (atau Rp0)<br>4. Isi deskripsi<br>5. Klik "Simpan" |
| **Hasil yang Diharapkan** | Sistem menolak penyimpanan. Menampilkan pesan: "Nominal biaya harus lebih dari 0." Data tidak tersimpan. Tidak ada jurnal yang terbuat. |

---

## 12. Modul: User Management

### TC-USER-001 — Tambah User Baru dengan Role Spesifik

| Item | Detail |
|---|---|
| **ID** | TC-USER-001 |
| **Modul** | User Management |
| **Fitur** | Manajemen User & Role |
| **Skenario** | **Positif** — Admin membuat user baru dengan role dan cabang tertentu |
| **Langkah Uji** | 1. Buka menu "Pengaturan" → "User Management"<br>2. Klik "Tambah User"<br>3. Isi username, email, nama lengkap<br>4. Set password (min 8 karakter)<br>5. Pilih role: "Cashier"<br>6. Pilih cabang: "Cabang Pusat"<br>7. Klik "Simpan" |
| **Hasil yang Diharapkan** | User baru terdaftar dengan akses terbatas sesuai role Cashier. User dapat login menggunakan username dan password yang dibuat. Hanya dapat mengakses modul POS, Customer, dan Booking (tidak bisa akses Finance, Inventory, Reports). |

### TC-USER-002 — Tambah User dengan Username Duplikat

| Item | Detail |
|---|---|
| **ID** | TC-USER-002 |
| **Modul** | User Management |
| **Fitur** | Validasi Uniqueness |
| **Skenario** | **Negatif** — Admin mencoba membuat user dengan username yang sudah terdaftar |
| **Langkah Uji** | 1. Buka menu "Tambah User"<br>2. Masukkan username yang sudah digunakan (contoh: `cashier01`)<br>3. Isi data lainnya<br>4. Klik "Simpan" |
| **Hasil yang Diharapkan** | Sistem menampilkan pesan: "Username sudah digunakan. Silakan pilih username lain." Data user tidak tersimpan. Tidak ada perubahan pada data user yang sudah ada. |

---

## Lampiran

### Matrix Coverage Modul

| Modul | Positif | Negatif | Total |
|---|---|---|---|
| Login / Auth | 1 | 1 | 2 |
| POS Transaction | 2 | 1 | 3 |
| Customer Management | 1 | 1 | 2 |
| Booking | 1 | 1 | 2 |
| Payment & Receipt | 2 | 1 | 3 |
| Daily Closing | 1 | 1 | 2 |
| Products / Inventory | 1 | 1 | 2 |
| Stock Movement | 1 | 1 | 2 |
| Commissions | 1 | 1 | 2 |
| Reports | 1 | 1 | 2 |
| Expenses | 1 | 1 | 2 |
| User Management | 1 | 1 | 2 |
| **Total** | **14** | **12** | **26** |
