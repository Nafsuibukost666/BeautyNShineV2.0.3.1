# Database Schema — Salon Eyelash POS/ERP v2

**Database:** PostgreSQL 16
**ORM:** Prisma 6.5
**Nama Database:** `salon_v2`
**Port Host:** 5433 | **Port Container:** 5432
**User:** salon | **Password:** salon123

Dokumen ini mendokumentasikan seluruh model database dari file `apps/pos-lite/backend/prisma/schema.prisma` (shared dengan ERP).

---

## ENUMS

### UserRole
| Value | Deskripsi |
|-------|-----------|
| `OWNER` | Pemilik salon — akses penuh ke semua fitur |
| `ADMIN` | Admin cabang — akses manajerial terbatas |
| `STAFF` | Karyawan/terapis — akses terbatas pada fitur operasional |

### CommissionType
| Value | Deskripsi |
|-------|-----------|
| `PERCENTAGE` | Komisi dihitung sebagai persentase dari harga jasa |
| `FIXED` | Komisi berupa nominal tetap per transaksi |

### PaymentStatus
| Value | Deskripsi |
|-------|-----------|
| `PAID` | Lunas |
| `PARTIAL` | Dibayar sebagian |
| `UNPAID` | Belum dibayar |

### BookingStatus
| Value | Deskripsi |
|-------|-----------|
| `BOOKED` | Terjadwal |
| `DONE` | Selesai |
| `CANCELLED` | Dibatalkan |
| `NO_SHOW` | Tidak datang |

---

## MODELS

---

### 1. User — Akun Login (`users` table)

Menyimpan akun pengguna yang dapat login ke sistem.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key, auto-generated |
| `username` | String (unique) | `username` | Nama pengguna untuk login |
| `password` | String | `password` | Password terenkripsi (bcrypt hash) |
| `role` | UserRole (enum) | `role` | Hak akses: OWNER / ADMIN / STAFF |
| `active` | Boolean (default: true) | `active` | Status aktif akun |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:** Tidak ada relasi foreign key. Model ini independent.

---

### 2. Customer — Pelanggan (`customers` table)

Menyimpan data pelanggan salon beserta riwayat kunjungan.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `name` | String | `name` | Nama lengkap pelanggan |
| `phone` | String? | `phone` | Nomor telepon / WhatsApp |
| `instagram` | String? | `instagram` | Akun Instagram (untuk promosi) |
| `birthday` | DateTime? | `birthday` | Tanggal lahir (ucapan/diskon) |
| `notes` | String? | `notes` | Catatan khusus (alergi, preferensi) |
| `totalVisit` | Int (default: 0) | `total_visit` | Total kunjungan |
| `totalSpending` | BigInt (default: 0) | `total_spending` | Total belanja (dalam rupiah) |
| `active` | Boolean (default: true) | `active` | Status aktif |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:**
- `transactions` → **Transaction[]** (satu pelanggan bisa punya banyak transaksi)
- `bookings` → **Booking[]** (satu pelanggan bisa punya banyak booking)

---

### 3. Service — Layanan Jasa (`services` table)

Menyimpan daftar layanan jasa salon (lash extensions, lift, tint, dll).

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `name` | String | `name` | Nama layanan (e.g. "Classic Lash Extension") |
| `category` | String? | `category` | Kategori layanan |
| `price` | BigInt | `price` | Harga layanan (dalam rupiah) |
| `durationMin` | Int (default: 60) | `duration_min` | Durasi pengerjaan (menit) |
| `active` | Boolean (default: true) | `active` | Status aktif |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:**
- `bookings` → **Booking[]** (satu layanan bisa dipakai di banyak booking)

---

### 4. Staff — Karyawan (`staffs` table)

Menyimpan data staff/karyawan salon termasuk skema komisi.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `name` | String | `name` | Nama staff |
| `role` | String (default: "Therapist") | `role` | Jabatan (Therapist, Admin, dll) |
| `phone` | String? | `phone` | Nomor telepon |
| `commissionType` | CommissionType (enum) | `commission_type` | Tipe komisi (PERCENTAGE / FIXED) |
| `commissionValue` | Decimal (default: 0) | `commission_value` | Nilai komisi (30 = 30% atau Rp30.000) |
| `active` | Boolean (default: true) | `active` | Status aktif |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:**
- `transactions` → **Transaction[]** (staff menangani banyak transaksi)
- `transactionItems` → **TransactionItem[]** (staff mengerjakan item jasa)
- `commissions` → **Commission[]** (staff menerima komisi)
- `bookings` → **Booking[]** (staff dijadwalkan di booking)

---

### 5. Product — Produk (`products` table)

Menyimpan data produk yang dijual di salon beserta manajemen stok.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `name` | String | `name` | Nama produk |
| `category` | String? | `category` | Kategori produk |
| `sku` | String? | `sku` | Kode SKU produk |
| `costPrice` | BigInt (default: 0) | `cost_price` | Harga modal / beli |
| `sellingPrice` | BigInt (default: 0) | `selling_price` | Harga jual |
| `stockQty` | Int (default: 0) | `stock_qty` | Stok saat ini |
| `minStock` | Int (default: 5) | `min_stock` | Batas minimal stok (alert) |
| `unit` | String (default: "pcs") | `unit` | Satuan produk (pcs, box, botol) |
| `active` | Boolean (default: true) | `active` | Status aktif |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:**
- `stockMovements` → **StockMovement[]** (satu produk punya banyak riwayat stok)

---

### 6. StockMovement — Riwayat Pergerakan Stok (`stock_movements` table)

Mencatat setiap mutasi stok masuk/keluar produk.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `productId` | String (FK) | `product_id` | Foreign key ke Product |
| `type` | String | `type` | "IN" (barang masuk) / "OUT" (barang keluar) |
| `qty` | Int | `qty` | Jumlah pergerakan |
| `note` | String? | `note` | Keterangan (e.g. "Pembelian supplier", "Opname", "Rusak") |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |

**Relasi:**
- `product` → **Product** (many-to-one)

---

### 7. Transaction — Transaksi Penjualan (`transactions` table)

Inti dari POS Kasir. Mencatat setiap pembelian jasa/produk oleh pelanggan.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `code` | String (unique) | `code` | Kode transaksi (e.g. "INV-20260501-001") |
| `date` | DateTime | `date` | Tanggal transaksi |
| `customerId` | String? (FK) | `customer_id` | Foreign key ke Customer |
| `customerName` | String | `customer_name` | Nama pelanggan (denormalized) |
| `staffId` | String? (FK) | `staff_id` | Foreign key ke Staff |
| `staffName` | String? | `staff_name` | Nama staff (denormalized) |
| `subtotal` | BigInt | `subtotal` | Subtotal sebelum diskon |
| `discount` | BigInt (default: 0) | `discount` | Diskon transaksi |
| `grandTotal` | BigInt | `grand_total` | Total setelah diskon |
| `paymentStatus` | PaymentStatus (enum) | `payment_status` | Status pembayaran (PAID / PARTIAL / UNPAID) |
| `notes` | String? | `notes` | Catatan transaksi |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |

**Relasi:**
- `customer` → **Customer?** (many-to-one)
- `staff` → **Staff?** (many-to-one)
- `transactionItems` → **TransactionItem[]** (satu transaksi punya banyak item)
- `payments` → **Payment[]** (satu transaksi punya banyak pembayaran)
- `commissions` → **Commission[]** (satu transaksi menghasilkan komisi)

---

### 8. TransactionItem — Item Transaksi (`transaction_items` table)

Item dalam transaksi — bisa berupa jasa (service) atau produk.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `transactionId` | String (FK) | `transaction_id` | Foreign key ke Transaction |
| `itemType` | String (default: "service") | `item_type` | "service" / "product" |
| `itemName` | String | `item_name` | Nama item |
| `qty` | Int | `qty` | Jumlah |
| `unitPrice` | BigInt | `unit_price` | Harga satuan |
| `discount` | BigInt (default: 0) | `discount` | Diskon per item |
| `lineTotal` | BigInt | `line_total` | Total baris (qty × price − discount) |
| `staffId` | String? (FK) | `staff_id` | Staff yang mengerjakan (untuk komisi) |
| `staffName` | String? | `staff_name` | Nama staff (denormalized) |

**Relasi:**
- `transaction` → **Transaction** (many-to-one)
- `staff` → **Staff?** (many-to-one)

---

### 9. Payment — Pembayaran (`payments` table)

Satu transaksi bisa punya beberapa metode pembayaran.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `transactionId` | String (FK) | `transaction_id` | Foreign key ke Transaction |
| `method` | String | `method` | Metode bayar: "CASH", "QRIS", "TRANSFER", "DEBIT" |
| `amount` | BigInt | `amount` | Jumlah bayar dengan metode ini |
| `referenceNo` | String? | `reference_no` | No referensi (untuk transfer/QRIS) |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |

**Relasi:**
- `transaction` → **Transaction** (many-to-one)

---

### 10. Booking — Janji Temu Online (`bookings` table)

Booking janji temu pelanggan secara online.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `date` | DateTime | `date` | Tanggal booking |
| `time` | String | `time` | Jam booking (e.g. "10:00", "14:30") |
| `customerName` | String | `customer_name` | Nama pelanggan |
| `customerId` | String? (FK) | `customer_id` | Foreign key ke Customer |
| `customerPhone` | String? | `customer_phone` | No HP pelanggan (tanpa login) |
| `serviceId` | String? (FK) | `service_id` | Foreign key ke Service |
| `serviceName` | String? | `service_name` | Nama layanan (denormalized) |
| `staffId` | String? (FK) | `staff_id` | Foreign key ke Staff |
| `staffName` | String? | `staff_name` | Nama staff (denormalized) |
| `status` | BookingStatus (enum) | `status` | Status booking |
| `notes` | String? | `notes` | Catatan pelanggan |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |
| `updatedAt` | DateTime | `updated_at` | Waktu terakhir diubah |

**Relasi:**
- `customer` → **Customer?** (many-to-one)
- `service` → **Service?** (many-to-one)
- `staff` → **Staff?** (many-to-one)

---

### 11. Expense — Pengeluaran (`expenses` table)

Mencatat biaya operasional salon (listrik, sewa, gaji, perlengkapan, dll).

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `description` | String | `description` | Deskripsi pengeluaran |
| `amount` | BigInt | `amount` | Jumlah pengeluaran |
| `category` | String? | `category` | Kategori: OPERATIONAL, SUPPLIES, RENT, UTILITY, SALARY, OTHER |
| `expenseDate` | DateTime | `expense_date` | Tanggal pengeluaran |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |

**Relasi:** Tidak ada relasi foreign key. Model ini independent.

---

### 12. Commission — Komisi Staff (`commissions` table)

Mencatat komisi yang diterima staff dari transaksi jasa.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `staffId` | String (FK) | `staff_id` | Foreign key ke Staff |
| `transactionId` | String (FK) | `transaction_id` | Foreign key ke Transaction |
| `amount` | BigInt | `amount` | Jumlah komisi |
| `calculated` | Boolean (default: false) | `calculated` | Apakah sudah dihitung/dibayarkan |
| `createdAt` | DateTime | `created_at` | Waktu dibuat |

**Relasi:**
- `staff` → **Staff** (many-to-one)
- `transaction` → **Transaction** (many-to-one)

---

### 13. Setting — Pengaturan Aplikasi (`settings` table)

Key-value store untuk konfigurasi dinamis aplikasi.

| Field | Tipe | Mapping DB | Keterangan |
|-------|------|-----------|-----------|
| `id` | String (UUID) | `id` | Primary key |
| `key` | String (unique) | `key` | Nama pengaturan (e.g. "salon_name", "phone", "address") |
| `value` | String | `value` | Nilai pengaturan |

**Relasi:** Tidak ada relasi foreign key. Model ini independent.

---

## Diagram Relasi (Textual)

```
User (independent — tidak punya relasi FK ke tabel lain)

Customer ◄──┐
  │          ├── Booking ◄── Service
  │          │       │
  │          │       └── Staff
  │          │
  └── Transaction ◄─── TransactionItem ◄── Staff
          │                │
          ├── Payment      │
          │                │
          └── Commission ◄─┘
                  │
                  └── Staff

Product ◄── StockMovement

Expense (independent)
Setting (independent)
```

---

## Catatan Penting

1. **BigInt untuk uang:** Semua field harga menggunakan tipe `BigInt` (bukan `Int`) untuk menghindari overflow dan masalah pembulatan. Nilai disimpan dalam satuan rupiah (bukan sen).

2. **Denormalized fields:** Beberapa field seperti `customerName`, `staffName`, `serviceName` di-*denormalize* (disimpan langsung di tabel transaksi/booking) untuk mempercepat query dan mengurangi jumlah JOIN saat menampilkan struk/laporan.

3. **UUID sebagai primary key:** Semua tabel menggunakan UUID v4 sebagai primary key untuk menghindari konflik ID di distributed system.

4. **Soft delete:** Model `User`, `Customer`, `Service`, `Staff`, `Product` menggunakan field `active` (Boolean) untuk soft delete — data tidak dihapus secara fisik, hanya dinonaktifkan.

5. **Snake case mapping:** Semua field di database menggunakan snake_case (`created_at`, `customer_name`, `grand_total`, dll) via `@map()` di Prisma, sementara di kode TypeScript menggunakan camelCase.
