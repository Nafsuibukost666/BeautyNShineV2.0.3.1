# Modul Master — Detail Fungsional dan Entitas Data

## 1. Product Master

Modul ini mengelola seluruh data produk dan material yang digunakan di salon, baik yang dijual langsung (retail) maupun yang digunakan sebagai bahan baku treatment.

### 1.1 Fitur Utama
- **CRUD Produk** — Tambah, edit, hapus, dan nonaktifkan produk.
- **Kategori Produk** — Pengelompokan produk (contoh: Bahan Treatment, Retail, Alat Kerja, Suplemen).
- **Bill of Materials (BOM)** — Definisi komposisi bahan untuk setiap treatment/produk racikan.
- **Supplier Management** — Data pemasok lengkap dengan kontak, syarat pembayaran, dan histori pembelian.
- **Batch Management** — Tracking batch/lot produk (nomor batch, tanggal produksi, tanggal kedaluwarsa).
- **Unit of Measure (UOM)** — Satuan produk (pcs, ml, gr, box, pack).

### 1.2 Entitas Data dan Relasi

```
ProductCategory
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── description (text)
├── parent_id (UUID, FK → ProductCategory) — untuk sub-kategori bertingkat
├── is_active (boolean)
└── timestamps

Product
├── id (UUID, PK)
├── code (varchar, unique) — SKU
├── name (varchar)
├── description (text)
├── category_id (UUID, FK → ProductCategory)
├── uom_id (UUID, FK → UnitOfMeasure)
├── unit_price (decimal)
├── cost_price (decimal)
├── is_treatment_material (boolean) — true = bahan treatment, false = retail
├── is_active (boolean)
├── image_url (varchar)
├── min_stock (decimal) — stok minimum untuk peringatan
├── max_stock (decimal)
└── timestamps

UnitOfMeasure
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
└── timestamps

BillOfMaterials
├── id (UUID, PK)
├── product_id (UUID, FK → Product) — produk jadi/treatment
├── material_id (UUID, FK → Product) — bahan baku
├── quantity (decimal) — jumlah material yang dibutuhkan
├── is_active (boolean)
├── valid_from (date)
├── valid_to (date, nullable)
└── timestamps

Supplier
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── contact_person (varchar)
├── phone (varchar)
├── email (varchar)
├── address (text)
├── tax_id (varchar)
├── payment_terms (varchar) — misal: Net30, COD
├── is_active (boolean)
└── timestamps

ProductBatch
├── id (UUID, PK)
├── product_id (UUID, FK → Product)
├── batch_number (varchar)
├── supplier_id (UUID, FK → Supplier, nullable)
├── production_date (date, nullable)
├── expiry_date (date, nullable)
├── initial_quantity (decimal)
├── current_quantity (decimal)
├── purchase_price (decimal)
├── is_expired (boolean)
└── timestamps

PurchaseOrder (penghubung ke modul operasional inventory)
├── id (UUID, PK)
├── supplier_id (UUID, FK → Supplier)
├── po_number (varchar, unique)
├── status (enum: draft, sent, partial_received, fully_received, cancelled)
├── order_date (date)
├── expected_date (date, nullable)
├── notes (text)
├── total_amount (decimal)
├── created_by (UUID, FK → User)
├── approved_by (UUID, FK → User, nullable)
└── timestamps

PurchaseOrderItem
├── id (UUID, PK)
├── po_id (UUID, FK → PurchaseOrder)
├── product_id (UUID, FK → Product)
├── batch_number (varchar, nullable)
├── quantity_ordered (decimal)
├── quantity_received (decimal)
├── unit_price (decimal)
└── subtotal (decimal)
```

### 1.3 Relasi Diagram (Logical)

```
ProductCategory 1──N Product
Product 1──N BillOfMaterials
Product 1──N ProductBatch
Supplier 1──N ProductBatch
Supplier 1──N PurchaseOrder
PurchaseOrder 1──N PurchaseOrderItem
Product 1──N PurchaseOrderItem
```

---

## 2. POS Master

Modul ini berisi data referensi untuk modul Point of Sales dan treatment salon.

### 2.1 Fitur Utama
- **Treatment Definition** — Daftar layanan treatment dengan harga, durasi, dan deskripsi.
- **Bed Management** — Manajemen bed/kursi treatment (nomor bed, lokasi, status).
- **Voucher Management** — Voucher diskon (nominal, persentase, minimal transaksi).
- **Promotion Rules** — Promosi (buy-get, bundle, diskon member, diskon jam tertentu).
- **Cancel Reason** — Daftar alasan pembatalan transaksi untuk reporting.

### 2.2 Entitas Data dan Relasi

```
Treatment
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar) — contoh: "Classic Eyelash Extension 120s"
├── description (text)
├── category_id (UUID, FK → ProductCategory) — treatment masuk dalam kategori produk
├── duration_minutes (int) — durasi treatment
├── standard_price (decimal)
├── is_active (boolean)
├── required_certification_id (UUID, FK → Certification, nullable)
├── bom_id (UUID, FK → BillOfMaterials, nullable) — BOM untuk treatment ini
├── image_url (varchar)
└── timestamps

TreatmentAddon (add-on option untuk treatment)
├── id (UUID, PK)
├── treatment_id (UUID, FK → Treatment)
├── name (varchar) — contoh: "Express 30 menit"
├── additional_price (decimal)
├── additional_duration (int) — menit tambahan
└── is_active (boolean)

Bed
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "BED-01"
├── name (varchar) — contoh: "Bed VIP 1"
├── branch_id (UUID, FK → Branch)
├── location_description (varchar)
├── is_active (boolean)
├── current_status (enum: available, occupied, maintenance)
└── timestamps

Voucher
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── type (enum: nominal, percentage, free_treatment)
├── value (decimal) — nominal / persentase
├── min_transaction (decimal, nullable)
├── max_discount (decimal, nullable) — untuk persentase
├── valid_from (datetime)
├── valid_to (datetime)
├── usage_limit (int, nullable) — 0 = unlimited
├── used_count (int)
├── is_active (boolean)
├── applicable_treatment_ids (UUID[] → Treatment, nullable) — null = semua
└── timestamps

Promotion
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── type (enum: buy_get_discount, bundle, member_only, time_based)
├── rules (jsonb) — aturan promosi fleksibel (contoh: beli 2 treatment cashback 10%)
├── valid_from (datetime)
├── valid_to (datetime)
├── is_active (boolean)
└── timestamps

CancelReason
├── id (UUID, PK)
├── code (varchar, unique)
├── reason (varchar)
├── is_active (boolean)
└── timestamps
```

### 2.3 Relasi Diagram

```
Treatment 1──N TreatmentAddon
Branch 1──N Bed
Treatment N──M Voucher (through applicable_treatment_ids)
```

---

## 3. Accounting Master

Modul ini menyediakan kerangka akuntansi yang digunakan oleh seluruh modul operasional. Setiap transaksi operasional akan menghasilkan jurnal otomatis berdasarkan konfigurasi di modul ini.

### 3.1 Fitur Utama
- **Chart of Accounts (COA)** — Struktur akun akuntansi bertingkat (Hierarki).
- **Currency** — Daftar mata uang dengan kurs.
- **Tax Definition** — Pajak (PPN, PPh) dengan tarif dan aturan.
- **Payment Method** — Metode pembayaran (Cash, QRIS, Kartu Kredit, Debit, Transfer).
- **Cost Center** — Pusat biaya untuk alokasi expense per cabang/departemen.
- **Financial Period** — Periode akuntansi (bulan/tahun) dengan status buka/tutup.

### 3.2 Entitas Data dan Relasi

```
Account (COA)
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "1-1000" untuk Kas, "4-0000" untuk Pendapatan
├── name (varchar)
├── type (enum: asset, liability, equity, revenue, expense)
├── parent_id (UUID, FK → Account, nullable) — parent untuk hierarki
├── is_header (boolean) — true = akun header (tidak bisa di-jurnal langsung)
├── is_active (boolean)
├── normal_balance (enum: debit, credit)
├── account_group (varchar) — pengelompokan untuk laporan: current_asset, fixed_asset, dll
└── timestamps

Currency
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "IDR", "USD", "SGD"
├── name (varchar)
├── symbol (varchar)
├── is_base (boolean) — mata uang utama perusahaan
├── exchange_rate (decimal) — terhadap base currency
├── updated_at (timestamp)
└── timestamps

Tax
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "PPN-11"
├── name (varchar) — contoh: "PPN 11%"
├── rate (decimal) — 11.00 untuk 11%
├── type (enum: sales_tax, purchase_tax, withholding_tax)
├── account_id (UUID, FK → Account) — akun utang pajak / piutang pajak
├── is_active (boolean)
└── timestamps

PaymentMethod
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar) — contoh: "Cash", "QRIS", "Kartu Kredit"
├── type (enum: cash, debit_card, credit_card, e_wallet, transfer, voucher)
├── account_id (UUID, FK → Account) — akun yang didebit saat penerimaan
├── fee_percentage (decimal, nullable) — fee merchant
├── is_active (boolean)
└── timestamps

CostCenter
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── branch_id (UUID, FK → Branch, nullable)
├── department_id (UUID, FK → Department, nullable)
├── is_active (boolean)
└── timestamps

FinancialPeriod
├── id (UUID, PK)
├── name (varchar) — contoh: "Januari 2026"
├── start_date (date)
├── end_date (date)
├── status (enum: open, locked, closed)
├── locked_at (timestamp, nullable)
├── locked_by (UUID, FK → User, nullable)
├── closed_at (timestamp, nullable)
├── closed_by (UUID, FK → User, nullable)
└── timestamps
```

### 3.3 Relasi Diagram

```
Account 1──N Account (self-referencing parent-child)
Branch N──1 CostCenter
Department N──1 CostCenter
```

### 3.4 Contoh Struktur COA (Hierarki)

```
1-0000 ASET
├── 1-1000 Kas & Bank
│   ├── 1-1100 Kas Kecil
│   ├── 1-1200 Bank BCA
│   └── 1-1300 Bank Mandiri
├── 1-2000 Piutang
│   └── 1-2100 Piutang Usaha
├── 1-3000 Persediaan
│   ├── 1-3100 Bahan Treatment
│   └── 1-3200 Retail Product
└── 1-4000 Aset Tetap
    ├── 1-4100 Peralatan Salon
    └── 1-4200 Akumulasi Penyusutan

4-0000 PENDAPATAN
├── 4-1000 Pendapatan Treatment
├── 4-2000 Pendapatan Retail
└── 4-3000 Pendapatan Lain

5-0000 BEBAN
├── 5-1000 Beban Gaji
├── 5-2000 Beban Sewa
├── 5-3000 Beban Perlengkapan
└── 5-4000 Beban Operasional
```

---

## 4. Company Master

Modul ini mengelola data organisasi, sumber daya manusia, dan konfigurasi akses sistem.

### 4.1 Fitur Utama
- **Branch Management** — Cabang-cabang salon (multi-branch ready).
- **Department** — Departemen dalam satu cabang (Front Office, Treatment, Finance).
- **User & Role** — Manajemen pengguna sistem dengan RBAC (Role-Based Access Control).
- **Approval Flow** — Workflow persetujuan multi-level (contoh: PO butuh approve supervisor + finance).
- **Staff / Therapist** — Data staff, spesialisasi, kontak.
- **Schedule** — Jadwal kerja staff dan booking treatment.
- **Certification** — Sertifikasi terapis (misal: Lash Lift Certified, Extension Master).

### 4.2 Entitas Data dan Relasi

```
Branch
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar)
├── address (text)
├── phone (varchar)
├── email (varchar)
├── tax_id (varchar)
├── is_active (boolean)
├── timezone (varchar)
└── timestamps

Department
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar) — contoh: "Treatment", "Front Office", "Finance"
├── branch_id (UUID, FK → Branch)
├── is_active (boolean)
└── timestamps

User
├── id (UUID, PK)
├── username (varchar, unique)
├── email (varchar, unique)
├── password_hash (varchar)
├── full_name (varchar)
├── phone (varchar)
├── is_active (boolean)
├── last_login (timestamp, nullable)
└── timestamps

Role
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "OWNER", "SUPERVISOR", "CASHIER", "THERAPIST", "FINANCE"
├── name (varchar)
├── description (text)
├── is_system (boolean) — role default sistem, tidak bisa dihapus
└── timestamps

Permission
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "pos.transaction.create"
├── name (varchar)
├── module (varchar) — modul: "pos", "inventory", "finance", dll
└── timestamps

RolePermission
├── id (UUID, PK)
├── role_id (UUID, FK → Role)
├── permission_id (UUID, FK → Permission)
└── unique (role_id, permission_id)

UserRole
├── id (UUID, PK)
├── user_id (UUID, FK → User)
├── role_id (UUID, FK → Role)
├── branch_id (UUID, FK → Branch, nullable) — role spesifik cabang
└── unique (user_id, role_id, branch_id)

ApprovalFlow
├── id (UUID, PK)
├── code (varchar, unique) — contoh: "PO_APPROVAL", "PERIOD_CLOSE"
├── name (varchar)
├── description (text)
├── is_active (boolean)
└── timestamps

ApprovalStep
├── id (UUID, PK)
├── flow_id (UUID, FK → ApprovalFlow)
├── step_order (int) — urutan approval
├── role_id (UUID, FK → Role) — role yang bisa approve di step ini
├── approval_type (enum: any_one, all_required) — cukup 1 atau semua harus approve
├── min_amount (decimal, nullable) — step berlaku jika di atas amount tertentu
└── timestamps

ApprovalInstance (instance approval yang sedang berjalan)
├── id (UUID, PK)
├── flow_id (UUID, FK → ApprovalFlow)
├── document_type (varchar) — contoh: "PURCHASE_ORDER"
├── document_id (UUID) — ID dokumen yang di-approve
├── status (enum: pending, approved, rejected, cancelled)
├── current_step (int)
├── requested_by (UUID, FK → User)
├── requested_at (timestamp)
└── timestamps

ApprovalAction (aksi approval per step)
├── id (UUID, PK)
├── instance_id (UUID, FK → ApprovalInstance)
├── step_order (int)
├── user_id (UUID, FK → User)
├── action (enum: approve, reject, return)
├── note (text, nullable)
├── acted_at (timestamp)
└── timestamps

Staff
├── id (UUID, PK)
├── user_id (UUID, FK → User) — user akun sistem (nullable untuk staff non-user)
├── employee_code (varchar, unique)
├── full_name (varchar)
├── phone (varchar)
├── email (varchar)
├── branch_id (UUID, FK → Branch)
├── department_id (UUID, FK → Department)
├── position (varchar) — contoh: "Senior Therapist", "Junior Therapist"
├── is_therapist (boolean)
├── commission_rate (decimal, nullable) — persentase komisi
├── hire_date (date)
├── is_active (boolean)
└── timestamps

StaffCertification
├── id (UUID, PK)
├── staff_id (UUID, FK → Staff)
├── certification_id (UUID, FK → Certification)
├── certificate_number (varchar)
├── issued_date (date)
├── expiry_date (date, nullable)
├── is_verified (boolean)
└── timestamps

Certification
├── id (UUID, PK)
├── code (varchar, unique)
├── name (varchar) — contoh: "Lash Extension Certified"
├── issuing_body (varchar) — badan penerbit sertifikat
├── description (text)
├── is_active (boolean)
└── timestamps

Schedule
├── id (UUID, PK)
├── staff_id (UUID, FK → Staff)
├── branch_id (UUID, FK → Branch)
├── date (date)
├── start_time (time)
├── end_time (time)
├── break_start (time, nullable)
├── break_end (time, nullable)
├── status (enum: scheduled, present, absent, leave)
└── timestamps

ScheduleException (cuti, sakit, izin)
├── id (UUID, PK)
├── staff_id (UUID, FK → Staff)
├── type (enum: annual_leave, sick_leave, personal_leave, training)
├── start_date (date)
├── end_date (date)
├── reason (text)
├── approved_by (UUID, FK → User, nullable)
├── status (enum: pending, approved, rejected)
└── timestamps
```

### 4.3 Relasi Diagram

```
Branch 1──N Department
Branch 1──N Staff
Department 1──N Staff
User 1──1 Staff (optional)
User N──M Role (through UserRole)
Role N──M Permission (through RolePermission)
ApprovalFlow 1──N ApprovalStep
ApprovalFlow 1──N ApprovalInstance
ApprovalInstance 1──N ApprovalAction
Staff N──M Certification (through StaffCertification)
Staff 1──N Schedule
Staff 1──N ScheduleException
```

---

## 5. Ringkasan Relasi Antar Modul Master

```
ProductMaster ──────► ProductCategory ◄────── Treatment (POS Master)
                    │
ProductMaster ──────► Product ──────► BillOfMaterials ◄────── Treatment
                    │
ProductMaster ──────► Supplier ◄────── PurchaseOrder (Operational)
                    │
POS Master ──────► Bed ◄────── Branch (Company Master)
                    │
Accounting Master ──► FinancialPeriod
                    │
Company Master ────► Staff ──────► User ──────► Role ──────► Permission
                    │
Company Master ────► ApprovalFlow ──────► Modul Operasional (PO, Period Close, dll)
```

Setiap entitas master menjadi referensi fundamental bagi modul operasional. Validasi data master (seperti yang digambarkan di BPMN — "Validate Master Data") memastikan bahwa setiap transaksi operasional menggunakan data yang valid dan konsisten sebelum diposting ke ERP.
