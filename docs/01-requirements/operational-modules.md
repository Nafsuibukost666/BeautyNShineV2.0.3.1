# Modul Operasional — Detail Fungsional dan Entitas Data

## 1. POS Transaction

Modul ini adalah pusat interaksi dengan pelanggan — mencakup pencatatan booking, pemilihan treatment, pembayaran, dan pembuatan struk.

### 1.1 Alur Proses
```
Customer datang/booking
        │
        ▼
  Kasir buka POS Session
        │
        ▼
  Pilih Customer (baru/registered)
        │
        ▼
  Pilih Treatment + Add-on + Staff Terapis
        │
        ▼
  Generate Document No (via Document Registry)
        │
        ▼
  Proses Treatment (status berubah ke "in_progress")
        │
        ▼
  Setelah treatment selesai → Pembayaran
        │
        ▼
  Pilih Payment Method
    ├── Cash → hitung kembalian
    ├── QRIS → generate QR
    ├── Kartu Kredit/Debit → input approval code
    ├── Voucher → validasi & redeem
    └── Split Payment → kombinasi metode
        │
        ▼
  Generate struk (thermal/PDF)
        │
        ▼
  Update POS Session total
        │
        ▼
  Queue ke ERP Sync
```

### 1.2 Fitur Utama
- **POS Session** — Buka/tutup shift kasir, hitung setoran awal dan akhir.
- **Customer Management** — Data pelanggan (nama, telepon, histori treatment, poin loyalitas).
- **Quick Booking** — Booking cepat untuk walk-in customer.
- **Scheduled Booking** — Booking janji temu dengan jadwal terapis dan bed tertentu.
- **Treatment Check-in** — Check-in pasien ke bed, update status bed → occupied.
- **Split Payment** — Satu transaksi dibayar dengan beberapa metode.
- **Voucher & Promotion** — Apply voucher otomatis atau manual.
- **Tax Auto Calculation** — PPN dihitung otomatis berdasarkan setting tax master.
- **Print Receipt** — Cetak struk thermal atau export PDF.
- **Cancel Transaction** — Pembatalan dengan alasan dari Cancel Reason master.
- **Refund/Return** — Pengembalian dana (full atau partial).
- **Daily Closing** — Rekapitulasi transaksi harian sebelum sync ke ERP.

### 1.3 Entitas Data

```
POS session
├── id (UUID, PK)
├── branch_id (UUID, FK → Branch)
├── cashier_id (UUID, FK → User)
├── opened_at (timestamp)
├── closed_at (timestamp, nullable)
├── opening_balance (decimal)
├── closing_balance (decimal, nullable)
├── expected_balance (decimal, nullable) — dihitung dari sistem
├── difference (decimal, nullable)
├── status (enum: open, closed, verified)
├── notes (text, nullable)
└── timestamps

Customer
├── id (UUID, PK)
├── code (varchar, unique) — nomor member
├── full_name (varchar)
├── phone (varchar)
├── email (varchar, nullable)
├── birth_date (date, nullable)
├── gender (enum: male, female, nullable)
├── total_visit (int, default: 0)
├── total_spent (decimal, default: 0)
├── loyalty_points (int, default: 0)
├── is_member (boolean, default: false)
├── notes (text, nullable)
└── timestamps

POSOrder (header transaksi)
├── id (UUID, PK)
├── document_no (varchar, unique) — generated via Document Registry
├── branch_id (UUID, FK → Branch)
├── session_id (UUID, FK → POSSession)
├── customer_id (UUID, FK → Customer, nullable)
├── order_type (enum: walk_in, booking, online_booking)
├── booking_datetime (datetime, nullable)
├── status (enum: pending, in_progress, completed, cancelled, refunded)
├── subtotal (decimal)
├── discount_total (decimal)
├── tax_total (decimal)
├── grand_total (decimal)
├── paid_amount (decimal)
├── change_amount (decimal)
├── cancel_reason_id (UUID, FK → CancelReason, nullable)
├── cancel_note (text, nullable)
├── synced (boolean, default: false) — status sync ke ERP
├── synced_at (timestamp, nullable)
└── timestamps

POSOrderItem (detail treatment/produk)
├── id (UUID, PK)
├── order_id (UUID, FK → POSOrder)
├── item_type (enum: treatment, product, add_on)
├── treatment_id (UUID, FK → Treatment, nullable)
├── product_id (UUID, FK → Product, nullable)
├── product_name (varchar) — snapshot nama saat transaksi
├── quantity (int)
├── unit_price (decimal)
├── discount (decimal)
├── subtotal (decimal)
├── assigned_therapist_id (UUID, FK → Staff, nullable)
├── assigned_bed_id (UUID, FK → Bed, nullable)
├── start_time (datetime, nullable)
├── end_time (datetime, nullable)
├── status (enum: pending, in_progress, completed, cancelled)
└── timestamps

POSPayment (pembayaran per transaksi)
├── id (UUID, PK)
├── order_id (UUID, FK → POSOrder)
├── payment_method_id (UUID, FK → PaymentMethod)
├── amount (decimal)
├── reference_number (varchar, nullable) — approval code kartu / QR ref
├── voucher_id (UUID, FK → Voucher, nullable)
├── status (enum: success, pending, failed, refunded)
└── timestamps

POSPromotionApplied
├── id (UUID, PK)
├── order_id (UUID, FK → POSOrder)
├── promotion_id (UUID, FK → Promotion, nullable)
├── voucher_id (UUID, FK → Voucher, nullable)
├── discount_amount (decimal)
├── description (varchar)
└── timestamps
```

---

## 2. Treatment Records

Modul ini mencatat detail pelaksanaan treatment oleh terapis — termasuk dokumentasi visual dan persetujuan pelanggan.

### 2.1 Alur Proses
```
POSOrderItem status → "in_progress"
        │
        ▼
  Terapis membuka Treatment Record
        │
        ▼
  Input data treatment:
    ├── Foto Before Treatment (wajib)
    ├── Catatan treatment (teknik, produk yang dipakai)
    ├── Kondisi bulu mata awal
    └── Consent form (tanda tangan digital)
        │
        ▼
  Pelaksanaan treatment
        │
        ▼
  Setelah selesai:
    ├── Foto After Treatment (wajib)
    ├── Catatan hasil & rekomendasi
    ├── Produk yang digunakan (actual usage vs BOM)
    └── Tanda tangan terapis + customer
        │
        ▼
  Update status → "completed"
```

### 2.2 Fitur Utama
- **Before/After Photo** — Kamera in-app atau upload dari galeri; foto terenkripsi dan disimpan di storage terpisah.
- **Treatment Notes** — Catatan tekstual bebas untuk teknik, kondisi, dan observasi.
- **Digital Consent Form** — Form persetujuan dengan tanda tangan digital pelanggan.
- **Actual Material Usage** — Pencatatan bahan aktual yang dipakai (dibandingkan dengan BOM standard).
- **Condition Assessment** — Checklist kondisi bulu mata (panjang, keriting, kepadatan, kesehatan).
- **Aftercare Instructions** — Instruksi perawatan pasca-treatment yang dicetak/dikirim ke pelanggan.
- **Photo Gallery per Customer** — Riwayat foto untuk memantau perkembangan.

### 2.3 Entitas Data

```
TreatmentRecord
├── id (UUID, PK)
├── order_item_id (UUID, FK → POSOrderItem, unique)
├── therapist_id (UUID, FK → Staff)
├── customer_id (UUID, FK → Customer)
├── treatment_id (UUID, FK → Treatment)
├── status (enum: draft, in_progress, completed)
├── start_time (datetime)
├── end_time (datetime, nullable)
├── notes (text, nullable)
├── condition_before (jsonb) — kondisi sebelum treatment
│   └── contoh: { "lash_length": "medium", "curl_type": "C", "density": "normal", "health_notes": "sedikit rontok" }
├── condition_after (jsonb, nullable)
├── aftercare_notes (text, nullable)
├── customer_satisfaction (int, nullable) — skala 1-5
├── consent_signed (boolean, default: false)
├── consent_signed_at (timestamp, nullable)
└── timestamps

TreatmentPhoto
├── id (UUID, PK)
├── record_id (UUID, FK → TreatmentRecord)
├── type (enum: before, after, progress)
├── photo_url (varchar) — path ke file storage
├── thumbnail_url (varchar)
├── taken_at (timestamp)
├── angle_label (varchar, nullable) — "kiri", "kanan", "atas", "depan"
└── timestamps

TreatmentMaterialUsage
├── id (UUID, PK)
├── record_id (UUID, FK → TreatmentRecord)
├── product_id (UUID, FK → Product)
├── planned_quantity (decimal) — sesuai BOM
├── actual_quantity (decimal) — yang terpakai
├── batch_id (UUID, FK → ProductBatch, nullable)
├── unit (varchar)
└── variance (decimal, computed: actual - planned)

TreatmentConsentForm
├── id (UUID, PK)
├── record_id (UUID, FK → TreatmentRecord)
├── consent_text (text) — teks persetujuan
├── customer_signature (text) — base64 tanda tangan digital
├── therapist_signature (text)
├── customer_name (varchar)
├── signed_at (timestamp)
└── timestamps
```

---

## 3. Inventory

Modul ini mengelola stok produk — mulai dari penerimaan barang, pemakaian untuk treatment, penjualan retail, hingga opname.

### 3.1 Alur Proses
```
Purchase Order (draft → approved → received)
        │
        ▼
  Goods Receipt → menambah stok + batch
        │
        ▼
  Pemakaian stok via:
    ├── Treatment Material Usage (otomatis dari TreatmentRecord)
    ├── Retail Sales (dari POS)
    ├── Adjustment (susut, rusak, hilang)
    └── Internal Transfer (antar cabang)
        │
        ▼
  Stock Card → update otomatis (setiap transaksi)
        │
        ▼
  Stock Opname (periodik)
    ├── Cetak Opname Sheet
    ├── Input stok fisik
    └── Hitung selisih → Adjustment
```

### 3.2 Fitur Utama
- **Stock Card** — Riwayat mutasi stok per produk per batch (masuk, keluar, saldo).
- **Batch Tracking** — FIFO/FEFO tracking untuk produk dengan expiry.
- **Expiry Alert** — Notifikasi otomatis H-30, H-7, dan expired untuk produk dengan masa berlaku.
- **Goods Receipt** — Penerimaan barang dari supplier (partial/full).
- **Stock Transfer** — Transfer stok antar cabang.
- **Stock Adjustment** — Penyesuaian stok (susut, rusak, hilang, lebih).
- **Stock Opname** — Proses penghitungan stok fisik periodik.
- **Low Stock Alert** — Peringatan saat stok mencapai minimum.
- **Inventory Valuation** — Valuasi stok (FIFO / Average).

### 3.3 Entitas Data

```
StockMovement (stock card / mutasi stok)
├── id (UUID, PK)
├── product_id (UUID, FK → Product)
├── batch_id (UUID, FK → ProductBatch, nullable)
├── branch_id (UUID, FK → Branch)
├── movement_type (enum: purchase_receipt, sales_return, 
│   treatment_usage, retail_sale, adjustment_in, adjustment_out, 
│   transfer_in, transfer_out, opname_adjustment, production_issue, 
│   production_completion)
├── reference_type (varchar) — tipe dokumen referensi
├── reference_id (UUID) — ID dokumen referensi
├── quantity (decimal) — positif = masuk, negatif = keluar
├── unit_cost (decimal) — harga pokok per unit
├── total_cost (decimal, computed)
├── before_quantity (decimal) — saldo sebelum
├── after_quantity (decimal) — saldo sesudah
├── notes (text, nullable)
├── created_by (UUID, FK → User)
└── timestamps

StockOpname
├── id (UUID, PK)
├── branch_id (UUID, FK → Branch)
├── opname_number (varchar, unique)
├── date (date)
├── status (enum: draft, in_progress, completed, approved)
├── initiated_by (UUID, FK → User)
├── approved_by (UUID, FK → User, nullable)
├── notes (text, nullable)
└── timestamps

StockOpnameItem
├── id (UUID, PK)
├── opname_id (UUID, FK → StockOpname)
├── product_id (UUID, FK → Product)
├── batch_id (UUID, FK → ProductBatch, nullable)
├── system_quantity (decimal)
├── physical_quantity (decimal)
├── difference (decimal, computed: physical - system)
├── unit_cost (decimal)
├── difference_value (decimal, computed)
├── notes (text, nullable)
└── timestamps

StockTransfer
├── id (UUID, PK)
├── transfer_number (varchar, unique)
├── from_branch_id (UUID, FK → Branch)
├── to_branch_id (UUID, FK → Branch)
├── status (enum: draft, in_transit, received, cancelled)
├── requested_by (UUID, FK → User)
├── received_by (UUID, FK → User, nullable)
├── received_at (timestamp, nullable)
├── notes (text, nullable)
└── timestamps

StockTransferItem
├── id (UUID, PK)
├── transfer_id (UUID, FK → StockTransfer)
├── product_id (UUID, FK → Product)
├── batch_id (UUID, FK → ProductBatch, nullable)
├── quantity (decimal)
└── unit_cost (decimal)
```

---

## 4. WIP / Manufacture (Produksi)

Modul ini mengelola proses produksi treatment — tracking pemakaian bahan baku, biaya produksi aktual, dan quality control.

### 4.1 Alur Proses
```
Treatment Record selesai
        │
        ▼
  Hitung BOM Standard Cost (dari BillOfMaterials)
        │
        ▼
  Catat Actual Material Usage (dari TreatmentMaterialUsage)
        │
        ▼
  Hitung Variance (Actual - Standard)
    ├── Material Variance
    ├── Labor Variance (waktu terapis)
    └── Overhead Variance
        │
        ▼
  Quality Control (QC)
    ├── Checklist hasil treatment
    ├── Foto after untuk dokumentasi QC
    └── Skor kualitas
        │
        ▼
  Complete Production → update Inventory (keluarkan bahan baku)
```

### 4.2 Fitur Utama
- **BOM Standard Cost Calculation** — Hitung biaya standar per treatment berdasarkan BOM.
- **Actual Usage Tracking** — Catat pemakaian bahan aktual oleh terapis.
- **Variance Analysis** — Analisis selisih biaya standar vs aktual.
- **Labor Cost Tracking** — Hitung biaya tenaga kerja berdasarkan durasi treatment × tarif terapis.
- **Quality Control** — Form QC dengan checklist dan skor.
- **Production Completion** — Finalisasi produksi, update stok (keluarkan bahan, catat biaya).
- **WIP Report** — Laporan WIP yang belum selesai.

### 4.3 Entitas Data

```
ProductionOrder
├── id (UUID, PK)
├── order_item_id (UUID, FK → POSOrderItem, unique)
├── treatment_record_id (UUID, FK → TreatmentRecord, nullable)
├── production_number (varchar, unique)
├── product_id (UUID, FK → Product) — treatment sebagai produk jadi
├── standard_cost (decimal) — total biaya standar dari BOM
├── actual_material_cost (decimal) — biaya material aktual
├── actual_labor_cost (decimal) — biaya tenaga kerja aktual
├── actual_overhead_cost (decimal) — alokasi overhead
├── total_actual_cost (decimal)
├── total_variance (decimal)
├── status (enum: planned, in_progress, completed, cancelled)
├── completed_at (timestamp, nullable)
├── notes (text, nullable)
└── timestamps

ProductionMaterialUsage
├── id (UUID, PK)
├── production_order_id (UUID, FK → ProductionOrder)
├── product_id (UUID, FK → Product) — bahan baku
├── batch_id (UUID, FK → ProductBatch, nullable)
├── bom_quantity (decimal) — sesuai BOM
├── actual_quantity (decimal) — aktual terpakai
├── standard_unit_cost (decimal) — harga standar per unit
├── actual_unit_cost (decimal) — harga aktual per unit (dari batch)
├── variance (decimal, computed)
└── notes (text, nullable)

ProductionLabor
├── id (UUID, PK)
├── production_order_id (UUID, FK → ProductionOrder)
├── staff_id (UUID, FK → Staff)
├── standard_hours (decimal) — durasi standar treatment
├── actual_hours (decimal) — durasi aktual
├── hourly_rate (decimal) — tarif per jam staff
├── standard_cost (decimal, computed)
├── actual_cost (decimal, computed)
└── variance (decimal, computed)

QualityControl
├── id (UUID, PK)
├── production_order_id (UUID, FK → ProductionOrder, unique)
├── inspector_id (UUID, FK → Staff) — QC inspector
├── inspection_date (date)
├── check_results (jsonb) — detail checklist
│   └── contoh: { "symmetry": "pass", "adhesion": "pass", "cleanliness": "pass" }
├── score (decimal, nullable) — skor kualitas 0-100
├── status (enum: pass, conditional_pass, fail)
├── notes (text, nullable)
├── rework_notes (text, nullable)
└── timestamps

ProductionOverhead
├── id (UUID, PK)
├── production_order_id (UUID, FK → ProductionOrder)
├── overhead_type (varchar) — "sewa", "listrik", "air", "cleaning"
├── allocated_amount (decimal)
└── notes (text, nullable)
```

---

## 5. Finance (AP, Bank, GL, P&L)

Modul keuangan menangani pencatatan transaksi akuntansi secara otomatis dan manual.

### 5.1 Alur Proses
```
Setiap transaksi operasional → Auto Journal Entry
        │
        ▼
  AP Management:
    ├── Purchase Invoice dari supplier
    ├── Approval Payment
    └── Pembayaran (manual / scheduled)
        │
        ▼
  Bank:
    ├── Catat penerimaan (dari POS)
    ├── Catat pengeluaran (pembayaran AP, gaji, biaya)
    └── Rekonsiliasi dengan Bank Reconciliation module
        │
        ▼
  General Ledger:
    ├── Semua jurnal → posting ke GL
    ├── Trial Balance
    └── Adjusting Entries
        │
        ▼
  P&L / Laporan Keuangan:
    ├── Income Statement
    ├── Balance Sheet
    └── Cash Flow Statement
```

### 5.2 Fitur Utama
- **Auto Journal** — Jurnal otomatis dari POS, Inventory, WIP, Asset.
- **Manual Journal** — Jurnal manual untuk penyesuaian.
- **Accounts Payable (AP)** — Manajemen utang ke supplier, approval, jadwal bayar.
- **Bank Transaction** — Catat transaksi bank (setoran, transfer, biaya bank).
- **General Ledger (GL)** — Buku besar dengan drill-down ke transaksi asal.
- **Trial Balance** — Neraca saldo sebelum penutupan.
- **Income Statement (P&L)** — Laba rugi per periode.
- **Balance Sheet** — Neraca.
- **Cash Flow Statement** — Laporan arus kas.
- **Sub-ledger Integration** — Setiap transaksi bisa di-trace ke dokumen asal.

### 5.3 Entitas Data

```
JournalHeader
├── id (UUID, PK)
├── journal_number (varchar, unique)
├── branch_id (UUID, FK → Branch)
├── financial_period_id (UUID, FK → FinancialPeriod)
├── journal_type (enum: sales_revenue, payment_receipt, purchase, 
│   expense, adjustment, depreciation, closing, opening_balance)
├── reference_type (varchar) — tipe dokumen sumber
├── reference_id (UUID) — ID dokumen sumber
├── description (text)
├── post_date (date)
├── is_posted (boolean, default: false)
├── posted_at (timestamp, nullable)
├── posted_by (UUID, FK → User, nullable)
└── timestamps

JournalEntry (detail jurnal — debit/credit)
├── id (UUID, PK)
├── journal_header_id (UUID, FK → JournalHeader)
├── account_id (UUID, FK → Account)
├── cost_center_id (UUID, FK → CostCenter, nullable)
├── line_order (int)
├── description (varchar)
├── debit (decimal)
├── credit (decimal)
├── reference_type (varchar, nullable) — referensi ke sub-ledger
├── reference_id (UUID, nullable)
└── timestamps (note: balanced = sum(debit) = sum(credit) dipastikan di aplikasi)

AccountPayable
├── id (UUID, PK)
├── supplier_id (UUID, FK → Supplier)
├── purchase_order_id (UUID, FK → PurchaseOrder, nullable)
├── invoice_number (varchar)
├── invoice_date (date)
├── due_date (date)
├── total_amount (decimal)
├── outstanding_amount (decimal)
├── status (enum: unpaid, partial, paid, cancelled)
├── notes (text, nullable)
└── timestamps

APPayment (pembayaran utang)
├── id (UUID, PK)
├── ap_id (UUID, FK → AccountPayable)
├── payment_date (date)
├── amount (decimal)
├── payment_method_id (UUID, FK → PaymentMethod)
├── bank_account_id (UUID, FK → BankAccount, nullable)
├── reference_number (varchar, nullable)
├── notes (text, nullable)
└── timestamps

BankAccount
├── id (UUID, PK)
├── branch_id (UUID, FK → Branch)
├── account_name (varchar)
├── bank_name (varchar)
├── account_number (varchar)
├── account_id (UUID, FK → Account) — COA bank
├── currency_id (UUID, FK → Currency)
├── opening_balance (decimal)
├── current_balance (decimal)
├── is_active (boolean)
└── timestamps

BankTransaction
├── id (UUID, PK)
├── bank_account_id (UUID, FK → BankAccount)
├── transaction_date (date)
├── type (enum: deposit, withdrawal, transfer_in, transfer_out, fee, interest)
├── amount (decimal)
├── reference_number (varchar, nullable)
├── description (text)
├── is_reconciled (boolean, default: false)
├── reconciled_at (timestamp, nullable)
└── timestamps

FinancialReport (snapshot laporan periodik)
├── id (UUID, PK)
├── branch_id (UUID, FK → Branch)
├── period_id (UUID, FK → FinancialPeriod)
├── report_type (enum: trial_balance, income_statement, balance_sheet, cash_flow)
├── report_data (jsonb) — data laporan
├── generated_at (timestamp)
└── timestamps
```

### 5.4 Contoh Auto Journal Mapping

| Transaksi | Debit | Kredit |
|---|---|---|
| POS Payment - Cash | 1-1100 Kas Kecil | 4-1000 Pendapatan Treatment |
| POS Payment - QRIS | 1-1200 Bank BCA | 4-1000 Pendapatan Treatment |
| Treatment Material Usage | 5-3000 Beban Perlengkapan | 1-3100 Bahan Treatment |
| Pembayaran AP | 2-1000 Utang Usaha | 1-1200 Bank BCA |
| Penyusutan Aset | 5-4000 Beban Penyusutan | 1-4200 Akum. Penyusutan |

---

## 6. Asset Management

Modul ini mengelola aset tetap salon — peralatan, furnitur, dan aset lainnya.

### 6.1 Fitur Utama
- **Asset Register** — Daftar aset (nama, kode, kategori, nilai perolehan, lokasi).
- **Depreciation Calculation** — Perhitungan penyusutan (Straight Line / Declining Balance).
- **Disposal/Retirement** — Penghapusan / penjualan aset.
- **Asset Transfer** — Mutasi aset antar cabang.
- **Maintenance Schedule** — Jadwal perawatan aset.
- **Asset Tagging** — Label/QR code untuk identifikasi aset.

### 6.2 Entitas Data

```
Asset
├── id (UUID, PK)
├── asset_code (varchar, unique)
├── name (varchar)
├── category (enum: equipment, furniture, vehicle, renovation, other)
├── description (text, nullable)
├── branch_id (UUID, FK → Branch)
├── location (varchar, nullable)
├── acquisition_date (date)
├── acquisition_cost (decimal)
├── useful_life_years (int)
├── depreciation_method (enum: straight_line, declining_balance)
├── salvage_value (decimal)
├── accumulated_depreciation (decimal, default: 0)
├── net_book_value (decimal, computed)
├── status (enum: active, fully_depreciated, disposed, sold, maintenance)
├── asset_tag (varchar, nullable) — QR code / RFID tag
└── timestamps

AssetDepreciation (detail penyusutan per periode)
├── id (UUID, PK)
├── asset_id (UUID, FK → Asset)
├── period_id (UUID, FK → FinancialPeriod)
├── depreciation_amount (decimal)
├── accumulated_after (decimal) — akumulasi setelah penyusutan
├── journal_header_id (UUID, FK → JournalHeader, nullable)
└── timestamps

AssetDisposal
├── id (UUID, PK)
├── asset_id (UUID, FK → Asset)
├── disposal_date (date)
├── disposal_type (enum: sold, scrapped, donated, lost)
├── proceeds_amount (decimal, nullable) — hasil penjualan
├── book_value_at_disposal (decimal)
├── gain_loss (decimal, computed)
├── notes (text, nullable)
├── journal_header_id (UUID, FK → JournalHeader, nullable)
└── timestamps

AssetMaintenance
├── id (UUID, PK)
├── asset_id (UUID, FK → Asset)
├── maintenance_date (date)
├── type (enum: routine, repair, overhaul)
├── description (text)
├── cost (decimal)
├── vendor (varchar, nullable)
├── next_maintenance_date (date, nullable)
└── timestamps
```

---

## 7. Bank Reconciliation

Modul ini mencocokkan transaksi bank internal dengan statement dari bank.

### 7.1 Alur Proses
```
Import Bank Statement (CSV/MT940/OFX)
        │
        ▼
  Parse & map ke entitas BankStatementLine
        │
        ▼
  Auto-match dengan BankTransaction:
    ├── By amount + date range
    ├── By reference number
    └── Fuzzy match
        │
        ▼
  Manual match (jika auto-match gagal)
        │
        ▼
  Create adjustment entries (jika ada selisih)
        │
        ▼
  Finalize reconciliation
```

### 7.2 Fitur Utama
- **Import Bank Statement** — Upload CSV/Excel statement bank.
- **Auto-Match** — Matching otomatis berdasarkan amount, date, reference.
- **Manual Match** — Drag-and-drop matching untuk transaksi yang tidak cocok.
- **Unreconciled Items** — Daftar transaksi yang belum cocok.
- **Reconciliation Report** — Laporan rekonsiliasi.
- **Adjustment Journal** — Jurnal otomatis untuk selisih (bank charge, interest).

### 7.3 Entitas Data

```
BankStatement
├── id (UUID, PK)
├── bank_account_id (UUID, FK → BankAccount)
├── statement_date (date)
├── statement_number (varchar, nullable)
├── beginning_balance (decimal)
├── ending_balance (decimal)
├── imported_at (timestamp)
├── imported_by (UUID, FK → User)
├── status (enum: imported, in_progress, reconciled)
└── timestamps

BankStatementLine
├── id (UUID, PK)
├── statement_id (UUID, FK → BankStatement)
├── transaction_date (date)
├── description (varchar)
├── reference_number (varchar, nullable)
├── debit (decimal, nullable)
├── credit (decimal, nullable)
├── balance (decimal)
└── timestamps

ReconciliationMatch
├── id (UUID, PK)
├── statement_id (UUID, FK → BankStatement)
├── statement_line_id (UUID, FK → BankStatementLine)
├── bank_transaction_id (UUID, FK → BankTransaction, nullable)
├── match_type (enum: auto, manual, adjustment)
├── match_confidence (decimal, nullable) — untuk auto-match, 0-100%
├── is_reversed (boolean, default: false)
├── notes (text, nullable)
└── timestamps
```

---

## 8. Reporting

Modul laporan menyediakan berbagai laporan untuk kebutuhan operasional, keuangan, dan dashboard owner.

### 8.1 Fitur Utama
- **Operational Reports**
  - Laporan Penjualan Harian — rekap transaksi per hari.
  - Layanan/Treatment Terpopuler — ranking treatment.
  - Utilisasi Bed — persentase pemakaian bed.
  - Performa Staff — jumlah treatment per staff, revenue, rating.
  - Inventory Report — stok, slow-moving, near-expiry.
- **Financial Reports**
  - Income Statement (P&L) — laba rugi per periode.
  - Balance Sheet — neraca.
  - Cash Flow Statement — arus kas.
  - AP Aging — umur utang.
  - Revenue by Branch/Category — pendapatan per cabang/kategori.
- **Owner Dashboard**
  - Ringkasan real-time: revenue hari ini, treatment count, active customers.
  - Trend grafik: penjualan 7/30 hari terakhir.
  - Top 5 treatment & produk.
  - Staff performance leaderboard.
  - Alert: stok kritis, aset maintenance, periode hampir tutup.

### 8.2 Laporan Export
- Format: PDF, Excel (.xlsx), CSV.
- Scheduled delivery via email (untuk owner).

### 8.3 Entitas Data (Laporan Lebih Banyak Query/Fungsi daripada Entitas)
```
UserReportPreference
├── id (UUID, PK)
├── user_id (UUID, FK → User)
├── report_type (varchar)
├── config (jsonb) — filter default, kolom, sort
└── timestamps

ScheduledReport
├── id (UUID, PK)
├── user_id (UUID, FK → User)
├── report_type (varchar)
├── frequency (enum: daily, weekly, monthly)
├── recipients (varchar[]) — email tujuan
├── format (enum: pdf, excel, csv)
├── config (jsonb)
├── is_active (boolean)
├── last_sent_at (timestamp, nullable)
└── timestamps
```

*Catatan: Sebagian besar laporan di-generate secara real-time dari data yang sudah ada di database melalui query agregasi, bukan disimpan sebagai entitas terpisah.*

---

## 9. End of Period

Modul ini mengelola siklus penutupan periode akuntansi — memastikan data konsisten sebelum periode dikunci.

### 9.1 Alur Proses
```
Review Period:
    ├── Cek transaksi yang belum diposting
    ├── Cek selisih kas/bank
    ├── Cek stok negatif
    └── Cek AP aging
        │
        ▼
  Buat Adjustment Entries (jika perlu)
        │
        ▼
  Hitung & Post Depreciation
        │
        ▼
  Generate Laporan Akhir Periode
        │
        ▼
  Owner Review & Approval
        │
        ▼
  Lock Period → tidak bisa input/edit transaksi di periode tsb
        │
        ▼
  Jika perlu revisi → Reopen Period (dengan audit trail)
        │
        ▼
  Finalize → Close Period (permanen / membutuhkan force reopen)
```

### 9.2 Fitur Utama
- **Period Review Checklist** — Ceklist item yang harus diverifikasi sebelum lock.
- **Adjustment Journal** — Jurnal penyesuaian akhir periode.
- **Auto Depreciation Posting** — Posting penyusutan aset otomatis.
- **Period Lock** — Kunci periode, cegah perubahan data.
- **Period Reopen** — Buka kembali periode terkunci (dengan approval owner dan audit trail).
- **Period Close** — Tutup periode permanen.
- **Audit Trail** — Catatan siapa yang lock/unlock dan kapan.

### 9.3 Entitas Data

```
PeriodReviewChecklist
├── id (UUID, PK)
├── period_id (UUID, FK → FinancialPeriod)
├── item_code (varchar) — contoh: "ALL_POSTED", "BALANCE_ZEROED"
├── item_name (varchar)
├── status (enum: pending, pass, fail, skipped)
├── checked_by (UUID, FK → User, nullable)
├── checked_at (timestamp, nullable)
├── notes (text, nullable)
└── timestamps

PeriodAudit
├── id (UUID, PK)
├── period_id (UUID, FK → FinancialPeriod)
├── action (enum: review, adjust, lock, reopen, close, force_reopen)
├── user_id (UUID, FK → User)
├── approval_id (UUID, FK → ApprovalInstance, nullable)
├── description (text)
├── metadata (jsonb, nullable) — snapshot data sebelum perubahan
└── timestamps
```

---

## 10. Document Registry

Modul ini bertanggung jawab untuk penomoran dokumen secara unik dan konsisten di seluruh sistem.

### 10.1 Konsep
Setiap dokumen bisnis membutuhkan **nomor dokumen unik** yang dapat dijadikan referensi silang (cross-reference) antar modul. Document Registry adalah **satu-satunya sumber kebenaran (single source of truth)** untuk penomoran dokumen.

### 10.2 Fitur Utama
- **Unique Key Generation** — Generate nomor dokumen otomatis berdasarkan template format.
- **Format Configurable** — Template nomor bisa dikustomisasi per cabang dan tipe dokumen.
- **Cross-Reference** — Mapping antar nomor dokumen dari modul berbeda.
- **Sequence Management** — Manajemen urutan nomor (reset per bulan/tahun).
- **Tracking** — Siapa yang membuat, kapan, dan status dokumen (draft, final, cancelled).

### 10.3 Contoh Format Nomor Dokumen

| Tipe Dokumen | Format | Contoh |
|---|---|---|
| POS Order | `{BR}-POS-{YYYYMM}-{SEQ:5}` | SBY-POS-202605-00012 |
| Purchase Order | `{BR}-PO-{YYYYMM}-{SEQ:5}` | SBY-PO-202605-00005 |
| Goods Receipt | `{BR}-GR-{YYYYMM}-{SEQ:5}` | SBY-GR-202605-00003 |
| Production Order | `{BR}-PRD-{YYYYMM}-{SEQ:5}` | SBY-PRD-202605-00021 |
| Journal | `{BR}-JRN-{YYYYMM}-{SEQ:5}` | SBY-JRN-202605-00045 |
| Opname | `{BR}-OPN-{YYYYMM}-{SEQ:5}` | SBY-OPN-202605-00001 |
| Treatment Record | `{BR}-TR-{YYYYMM}-{SEQ:5}` | SBY-TR-202605-00067 |

### 10.4 Entitas Data

```
DocumentRegistry
├── id (UUID, PK)
├── document_type (varchar) — tipe: "pos_order", "purchase_order", "journal", dll
├── document_id (UUID) — UUID dokumen yang diregistrasi
├── document_number (varchar, unique) — nomor yang sudah di-generate
├── branch_id (UUID, FK → Branch)
├── prefix (varchar) — komponen prefix
├── sequence (int) — nomor urut
├── period (varchar) — periode format (YYYYMM)
├── status (enum: active, cancelled, voided)
├── created_by (UUID, FK → User)
└── timestamps

DocumentNumberingFormat
├── id (UUID, PK)
├── branch_id (UUID, FK → Branch)
├── document_type (varchar)
├── format_template (varchar) — contoh: "{BR}-{TYPE}-{YYYYMM}-{SEQ:5}"
├── reset_frequency (enum: never, yearly, monthly, daily)
├── last_sequence (int, default: 0)
├── is_active (boolean)
└── timestamps

DocumentCrossReference
├── id (UUID, PK)
├── source_document_type (varchar)
├── source_document_id (UUID)
├── source_document_number (varchar)
├── target_document_type (varchar)
├── target_document_id (UUID)
├── target_document_number (varchar)
├── relationship_type (enum: refers_to, generated_from, reversed_by)
└── timestamps
```

### 10.5 Cross-Reference Examples

| Source | Target | Relasi |
|---|---|---|
| POS Order | Treatment Record | generated_from |
| POS Order | Journal Header | generated_from |
| Purchase Order | Goods Receipt | refers_to |
| Goods Receipt | Journal Header (AP) | generated_from |
| Production Order | Stock Movement | generated_from |
| Journal (depreciation) | Asset Depreciation | refers_to |
| POS Order (cancelled) | POS Order (original) | reversed_by |

---

## Ringkasan Aliran Data Lintas Modul Operasional

```
POS Transaction ───► Document Registry ───► Generate No Dokumen
        │
        ├──► Treatment Records ──► WIP/Manufacture ──► Inventory (material usage)
        │
        ├──► POS Payment ──► Auto Journal (Finance/GL)
        │       │
        │       └──► Bank Reconciliation (jika bank)
        │
        ├──► Inventory (retail product sold)
        │
        └──► Customer (update loyalitas, poin)

Finance ───► Auto Journal ──► GL ──► Trial Balance ──► P&L / Balance Sheet
    │
    ├──► AP ──► Payment ──► Bank Transaction
    │
    └──► Asset Management ──► Depreciation ──► Auto Journal

End of Period ───► Review ───► Adjustments ───► Lock ───► Audit Trail

Document Registry ───► Cross-reference antar semua modul
```

Setiap modul operasional bergantung pada **modul master** untuk data referensi (produk, treatment, akun, dll), dan setiap transaksi akan **tercatat secara otomatis** melalui auto-journal ke modul Finance/GL tanpa perlu input ganda oleh user.
