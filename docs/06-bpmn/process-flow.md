# BPMN Process Flow — Deskripsi Lengkap

**Project:** Salon Eyelash POS/ERP System
**Versi Dokumen:** 1.0
**Tanggal:** 18 Mei 2026

---

## 1. Gambaran Umum BPMN

Diagram BPMN (Business Process Model and Notation) ini menggambarkan alur proses end-to-end sistem Salon Eyelash POS/ERP — mulai dari Customer datang ke salon hingga Period Lock akuntansi. Proses dibagi ke dalam 7 swimlanes (pool) yang merepresentasikan aktor dan sistem yang terlibat.

### 1.1 Tujuh Swimlanes

| # | Swimlane | Warna | Peran |
|---|---|---|---|
| 1 | **End Customer** | Blue (Operational) | Pelanggan yang datang, booking, menerima treatment, dan membayar |
| 2 | **POS App** | Blue (Operational) | Aplikasi Point of Sales — kasir, booking, treatment record, payment |
| 3 | **ERP Core** | Purple (System Control) | Inti sistem ERP — validasi, sinkronisasi, orchestration |
| 4 | **Inventory / WIP / BOM** | Blue (Operational) | Manajemen stok, Bill of Materials, Work In Progress |
| 5 | **Finance / Bank / Asset** | Green cylinder (Ledger) | Akuntansi, jurnal, rekonsiliasi bank, aset tetap |
| 6 | **Reporting / Owner** | Yellow (Review/Costing) | Laporan, dashboard, review owner, approval |
| 7 | **End of Period / Audit** | Red (Lock/Correction) | Period lock, audit trail, adjustment, koreksi |

### 1.2 Legend Simbol

| Simbol / Warna | Makna | Contoh |
|---|---|---|
| 🔵 **Blue** (Operational) | Proses operasional bisnis — interaksi langsung dengan customer / transaksi harian | POS Transaction, Booking, Treatment |
| 🟣 **Purple** (System Control) | Proses sistem internal — kontrol otomatis, validasi, routing | ERP Sync, Document Registry, Queue |
| 🟢 **Green cylinder** (Ledger) | Proses akuntansi dan pencatatan keuangan — posting jurnal, GL | Auto Journal, Bank Reconciliation, GL |
| 🟡 **Yellow** (Review/Costing) | Proses review, analisis biaya, dan costing — Owner/manajemen | Owner Dashboard, Variance Analysis, QC |
| 🔴 **Red** (Lock/Correction) | Proses finalisasi, penguncian, dan koreksi — period lock, reversing entry | Period Lock, Journal Reversal |
| ➖ **Dashed line** | Validation / Data linkage — cross-reference antar dokumen | Document Cross-Reference, Sync Validation |

---

## 2. Alur Proses Detail — Langkah Demi Langkah

Berikut adalah alur proses lengkap dari Customer datang ke salon hingga Period Lock, dijelaskan per swimlane.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ END CUSTOMER (Swimlane 1) — Blue: Operational                              │
│                                                                             │
│   START ──► Walk-in / Online Booking ──► Check-in ──► Treatment ──► Pay    │
│                                                                             │
│   [Customer datang / booking online]                                        │
│         │                                                                   │
│         ▼                                                                   │
│   [Check-in ke meja kasir]                                                  │
│         │                                                                   │
│         ▼                                                                   │
│   [Terima treatment dari terapis]                                           │
│         │                                                                   │
│         ▼                                                                   │
│   [Lakukan pembayaran]                                                      │
│         │                                                                   │
│         ▼                                                                   │
│   [Terima struk / receipt] ──► END                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Swimlane 1: End Customer — Pelanggan

#### Langkah 1: Customer Datang / Booking
- **Deskripsi:** Customer datang langsung ke salon (walk-in) atau melakukan booking via telepon, WhatsApp, atau aplikasi online.
- **Data yang diberikan:** Nama, nomor telepon, treatment yang diinginkan, terapis preferensi (opsional), waktu booking (jika booking).
- **Output:** Customer siap dilayani oleh kasir.

#### Langkah 2: Check-in
- **Deskripsi:** Customer check-in ke meja kasir, mengonfirmasi kedatangan (untuk booking) atau memulai transaksi baru (walk-in).
- **Output:** Customer diarahkan ke bed treatment.

#### Langkah 3: Menerima Treatment
- **Deskripsi:** Customer menerima treatment dari terapis, menandatangani consent form (digital), dan memberikan feedback setelah treatment selesai.
- **Output:** Treatment selesai, foto before/after terdokumentasi.

#### Langkah 4: Pembayaran
- **Deskripsi:** Customer melakukan pembayaran di kasir sesuai total tagihan. Metode: Tunai, QRIS, Kartu Kredit/Debit, Voucher, atau Split Payment.
- **Output:** Customer menerima struk pembayaran (thermal/PDF/digital).

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ POS APP (Swimlane 2) — Blue: Operational                                   │
│                                                                             │
│   START ──► Open POS Session ──► Select/Create Customer ──► Select Treatm. │
│         │                                                                   │
│         ▼                                                                   │
│   Generate Document No (BOOK, POS, TRM) ──► Assign Bed & Therapist         │
│         │                                                                   │
│         ▼                                                                   │
│   Treatment Check-in ──► Record Treatment ──► Payment Input                │
│         │                                                                   │
│         ▼                                                                   │
│   Print Receipt ──► Daily Closing ──► Enqueue to Sync ──► END              │
│                                                                             │
│   [Decision: Walk-in or Booking?]                                          │
│     ├── Walk-in  → Create new POS order                                    │
│     └── Booking  → Retrieve existing BOOK, convert to POS order            │
│                                                                             │
│   [Decision: Existing Customer or New?]                                    │
│     ├── Existing → Select from database                                     │
│     └── New     → Register new customer                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Swimlane 2: POS App — Aplikasi Kasir

#### Langkah 1: Buka POS Session
- **Deskripsi:** Kasir membuka shift dengan memasukkan saldo awal (opening balance). POS Session mencatat semua transaksi dalam satu shift.
- **Data:** `branch_id`, `cashier_id`, `opening_balance`, `opened_at`.
- **Validasi:** Kasir harus memiliki role Cashir yang aktif.

#### Langkah 2: Pilih/Buat Customer
- **Decision Point:** Customer sudah terdaftar?
  - **Ya (Existing):** Cari customer berdasarkan nama/telepon, pilih dari database.
  - **Tidak (New):** Daftarkan customer baru (min: nama + telepon). Sistem auto-generate nomor member.
- **Data:** `customer_id`, `full_name`, `phone`, `loyalty_points`.

#### Langkah 3: Pilih Treatment & Staff
- **Deskripsi:** Kasir memilih treatment dari daftar, memilih terapis, dan memilih bed yang tersedia.
- **Data:** `treatment_id`, `assigned_therapist_id`, `assigned_bed_id`, `treatment_items[]`.
- **Validasi:** Bed tidak `occupied`. Terapis tidak sedang menangani customer lain di jam yang sama. Ketersediaan stok material treatment (dicek via Inventory).

#### Langkah 4: Generate Document Number
- **Deskripsi:** POS App memanggil Document Number Registry untuk menghasilkan 3 nomor dokumen:
  1. **BOOK** — Nomor Booking (jika dari booking) atau tetap digenerate untuk tracing
  2. **POS** — Nomor Transaksi POS
  3. **TRM** — Nomor Treatment Record
- **Cross-Reference:** `BOOK → POS → TRM` tercatat di Document Cross-Reference Store.

#### Langkah 5: Treatment Process
- **Deskripsi:** Treatment berlangsung. Terapis mengisi Treatment Record melalui POS App (atau mobile app terapis).
- **Data:** `before_photos[]`, `after_photos[]`, `therapist_notes`, `consent_form`, `material_used[]`.
- **Status Update:** `pending` → `in_progress` → `completed`.

#### Langkah 6: Pembayaran
- **Deskripsi:** Kasir memproses pembayaran setelah treatment selesai.
- **Metode:** Tunai (dengan perhitungan kembalian otomatis), QRIS (generate QR code), Kartu Kredit/Debit (approval code), Voucher (validasi & redeem), Split Payment (kombinasi metode).
- **Data:** `payment_method_id`, `amount`, `reference_number`, `approval_code`.
- **Pajak:** PPN dihitung otomatis berdasarkan setting tax master.
- **Output:** Struk tercetak (thermal) / ter-export (PDF).

#### Langkah 7: Daily Closing
- **Deskripsi:** Di akhir shift, kasir menutup POS Session. Sistem menampilkan rekap transaksi harian (total transaksi, total penjualan, total pajak, total diskon).
- **Data:** `closing_balance` (fisik), `expected_balance` (sistem), `difference`.
- **Validasi:** Selisih saldo dicatat. Jika selisih ≠ 0, supervisor harus approve.

#### Langkah 8: Enqueue to Sync
- **Deskripsi:** Setelah daily closing, semua data transaksi di-queue untuk sinkronisasi ke ERP Core.
- **Data Queue:** `source: POS`, `target: ERP`, `action: sync`, `payload: {transactions[], sessions[], adjustments[]}`.
- **Status:** `pending` → `processing` → `success` / `failed`.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ERP CORE (Swimlane 3) — Purple: System Control                             │
│                                                                             │
│   START ──► Dequeue Sync Data ──► Validate Master Data                    │
│         │                                                                   │
│         ▼                                                                   │
│   [Decision: Data Valid?]                                                   │
│     ├── Yes  → Transform & Post                                            │
│     │           ├── Write to ERP Tables                                     │
│     │           └── Call Inventory/WIP & Finance services                   │
│     └── No   → Log Error ──► Reject ──► Notify POS ──► END                │
│                                                                             │
│   [Retry Mechanism: max 3x exponential backoff]                            │
│                                                                             │
│   Document Generated: STK, WIP, AP, BP, JE, FA                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Swimlane 3: ERP Core — Inti Sistem ERP

#### Langkah 1: Dequeue & Validasi
- **Deskripsi:** ERP Core mengambil data dari Sync Queue. Melakukan validasi master data: semua `product_id` harus ada di Product Master, `customer_id` valid, `branch_id` terdaftar, `payment_method_id` valid.
- **Decision Point:** Data valid?
  - **Ya:** Lanjut ke transformasi dan posting.
  - **Tidak:** Log error ke Integration Log, kirim notifikasi ke POS App, data ditolak (tidak diproses).

#### Langkah 2: Transform & Post
- **Deskripsi:** Data POS di-transform ke format ERP dan di-post ke tabel-tabel ERP.
- **Output:**
  - Transaksi POS → Tersimpan di tabel `erp_transactions` dengan relasi ke `doc_registry`
  - Treatment Record → Tersimpan di tabel `erp_treatment_records`
  - Informasi pembayaran → Tersimpan untuk diproses Finance

#### Langkah 3: Generate Dokumen ERP
- **Deskripsi:** ERP Core memanggil Document Number Registry untuk menghasilkan dokumen ERP:
  - **STK** (Stock Movement) — untuk konsumsi material treatment
  - **WIP** (Work In Progress) — tracking produksi treatment
  - **AP/BP** — jika transaksi menimbulkan hutang/piutang
  - **JE** (Journal Entry) — setelah Finance selesai memproses
  - **FA** (Fixed Asset) — jika ada transaksi aset
- **Cross-Reference:** Semua dokumen di-link ke `POS` dan `TRM` melalui Document Cross-Reference.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INVENTORY / WIP / BOM (Swimlane 4) — Blue: Operational                     │
│                                                                             │
│   START ──► Check BOM Standard Cost ──► Record Material Usage             │
│         │                                                                   │
│         ▼                                                                   │
│   Hitung Variance (Actual vs Standard) ──► Update Stock Card              │
│         │                                                                   │
│         ▼                                                                   │
│   Adjust Stock Balance ──► Write Stock Movement (STK)                     │
│         │                                                                   │
│         ▼                                                                   │
│   [Decision: QC Required?]                                                  │
│     ├── Yes  → QC Checklist ──► Pass/Fail                                   │
│     │           ├── Pass → Complete Production                              │
│     │           └── Fail → Rework Notes ──► Re-process                      │
│     └── No   → Complete Production                                          │
│                                                                             │
│   Output: Material consumed, stock updated, WIP completed                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Swimlane 4: Inventory / WIP / BOM — Inventaris & Produksi

#### Langkah 1: Check BOM Standard Cost
- **Deskripsi:** Sistem mengambil Bill of Materials (BOM) untuk treatment yang dilakukan. Menghitung standard cost berdasarkan BOM: material cost + labor cost + overhead.
- **Data:** `BOM_id`, `material_items[]`, `standard_quantity`, `standard_unit_cost`.

#### Langkah 2: Record Actual Material Usage
- **Deskripsi:** Mencatat pemakaian bahan aktual dari TreatmentRecord (TreatmentMaterialUsage). Membandingkan dengan standard BOM.
- **Variance:** `actual_quantity — planned_quantity` per material. Jika variance positif (lebih boros), perlu catatan penjelasan.

#### Langkah 3: Update Stock Card & Generate STK
- **Deskripsi:** Stok produk berkurang sesuai material yang terpakai. Stock Card di-update dengan movement type `treatment_usage`. Nomor STK digenerate.
- **Data:** `product_id`, `batch_id` (FIFO/FEFO), `quantity` (negatif = keluar), `unit_cost`, `before_quantity`, `after_quantity`.

#### Langkah 4: Quality Control (Opsional)
- **Decision Point:** QC diperlukan untuk treatment ini?
  - **Ya:** QC Inspector melakukan pengecekan hasil treatment (checklist simetri, kebersihan, daya rekat). Status: `pass` / `conditional_pass` / `fail`.
    - Jika `pass` → treatment selesai.
    - Jika `fail` → catatan rework, treatment diulang (re-process).
  - **Tidak:** Langsung complete production.

#### Langkah 5: Complete Production
- **Deskripsi:** WIP di-set ke `completed`. Biaya produksi aktual dihitung (material + labor + overhead). Selisih (variance) antara standard cost dan actual cost dicatat untuk analisis.
- **Output:** Production Order selesai, WIP record final.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FINANCE / BANK / ASSET (Swimlane 5) — Green: Ledger                        │
│                                                                             │
│   START ──► Auto Journal Engine ──► Generate JE (Debit & Credit)          │
│         │                                                                   │
│         ▼                                                                   │
│   Post to General Ledger ──► Trial Balance ──► Bank Reconciliation         │
│         │                                                                   │
│         ▼                                                                   │
│   [Decision: Bank Statement Match?]                                         │
│     ├── Yes  → Mark reconciled                                              │
│     └── No   → Create Adjustment JE ──► Flag for review                     │
│         │                                                                   │
│         ▼                                                                   │
│   Asset Management (Depreciation, Disposal) ──► Update Fixed Asset Reg.   │
│         │                                                                   │
│         ▼                                                                   │
│   Generate Financial Reports (P&L, Balance Sheet, Cash Flow) ──► END      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Swimlane 5: Finance / Bank / Asset — Keuangan

#### Langkah 1: Auto Journal
- **Deskripsi:** Finance Engine secara otomatis membuat jurnal akuntansi dari setiap transaksi POS yang sudah di-sync.
- **Jurnal yang dihasilkan:**
  - **Transaksi POS Tunai:** Debit — Kas, Kredit — Pendapatan Treatment, Kredit — PPN Keluaran
  - **Transaksi POS QRIS/Kartu Kredit:** Debit — Bank/QRIS Clearing, Kredit — Pendapatan Treatment, Kredit — PPN Keluaran
  - **Konsumsi Material:** Debit — Beban Material Treatment, Kredit — Persediaan Bahan
  - **Komisi Terapis:** Debit — Beban Komisi, Kredit — Hutang Komisi
  - **Biaya Operasional:** Debit — Beban terkait, Kredit — Kas/Bank
- **Dokumen:** Nomor **JE** (Journal Entry) digenerate per jurnal.

#### Langkah 2: Post to General Ledger
- **Deskripsi:** Semua jurnal (auto + manual) di-post ke General Ledger.
- **Validasi:** Total Debit harus sama dengan Total Kredit untuk setiap jurnal.
- **Output:** Trial Balance (Neraca Saldo) dapat digenerate setiap saat.

#### Langkah 3: Bank Reconciliation
- **Deskripsi:** Sistem mencocokkan transaksi yang tercatat di sistem dengan statement bank (import statement dari bank).
- **Decision Point:** Apakah transaksi match dengan statement bank?
  - **Ya:** Transaksi di-mark sebagai `reconciled`.
  - **Tidak:** Finance staff membuat Adjustment JE untuk mencatat selisih. Transaksi di-flag untuk review.
- **Output:** Bank Reconciliation Report.

#### Langkah 4: Asset Management
- **Deskripsi:** Mencatat pembelian aset baru (jika ada), menghitung depresiasi periodik, mencatat disposal/mutasi aset.
- **Dokumen:** Nomor **FA** (Fixed Asset) digenerate.
- **Output:** Depreciation Journal (JE) terposting ke GL.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REPORTING / OWNER (Swimlane 6) — Yellow: Review/Costing                    │
│                                                                             │
│   START ──► Aggregate Data ──► Generate Operational Reports               │
│         │                                                                   │
│         ▼                                                                   │
│   Generate Financial Reports ──► Owner Dashboard                           │
│         │                                                                   │
│         ▼                                                                   │
│   [Owner Review Period Performance]                                         │
│         │                                                                   │
│         ▼                                                                   │
│   [Decision: Approve Period Closing?]                                       │
│     ├── Yes  → Trigger Period Lock Process                                 │
│     └── No   → Request Review Again ──► Owner provides notes ──► Loop      │
│                  ├── Review specific transactions                           │
│                  ├── Request adjustments                                    │
│                  └── Re-approve after fixes                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Swimlane 6: Reporting / Owner — Laporan & Pemilik

#### Langkah 1: Aggregate Data
- **Deskripsi:** Reporting Data Mart meng-aggregasi data dari seluruh modul: POS (transaksi), Inventory (stok, movement), Finance (GL, jurnal), WIP (produksi).
- **Frekuensi:** Real-time untuk dashboard, batch harian untuk laporan periodik.

#### Langkah 2: Generate Reports
- **Laporan Operasional:**
  - Laporan Penjualan Harian (per cabang, per treatment, per terapis)
  - Laporan Booking & Customer
  - Laporan Stok & Material Usage
  - Laporan Komisi Terapis
  - Laporan Biaya Operasional
- **Laporan Keuangan:**
  - Laporan Laba Rugi (P&L)
  - Neraca (Balance Sheet)
  - Laporan Arus Kas (Cash Flow)
  - Trial Balance
  - Laporan Perubahan Modal

#### Langkah 3: Owner Dashboard
- **Deskripsi:** Dashboard eksekutif untuk Owner dengan KPI real-time:
  - Revenue hari ini vs kemarin
  - Jumlah customer (total, baru, returning)
  - Average ticket size
  - Utilisasi bed
  - Performa staff/terapis (jumlah treatment, rating)
  - Top treatment & products
  - Profit margin

#### Langkah 4: Owner Review Period
- **Deskripsi:** Owner melakukan review period (biasanya akhir bulan). Mengecek laporan keuangan, membandingkan dengan target, dan memeriksa transaksi mencurigakan.
- **Decision Point:** Owner menyetujui penutupan periode?
  - **Ya (Approve):** Trigger Period Lock Process.
  - **Tidak (Reject):** Owner memberikan catatan. Tim finance/operasional melakukan perbaikan.
    - *Review transaksi tertentu*
    - *Buat adjustment journal*
    - *Setelah diperbaiki, owner review lagi*
    - **Loop** sampai Owner approve.

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ END OF PERIOD / AUDIT (Swimlane 7) — Red: Lock/Correction                  │
│                                                                             │
│   START ──► Owner Approves Closing ──► Generate EOP Document              │
│         │                                                                   │
│         ▼                                                                   │
│   Lock All Financial Periods ──► Freeze Transactions                      │
│         │                                                                   │
│         ▼                                                                   │
│   [Decision: Adjustments Needed After Lock?]                                │
│     ├── No  → Period fully closed ──► Archive data ──► END                 │
│     └── Yes → Create Reversing JE ──► Re-open Period ──►                    │
│                 ├── Make adjustment                                          │
│                 ├── Re-lock period                                           │
│                 └── Audit trail updated ──► END                              │
│                                                                             │
│   Audit Trail:                                                             │
│   - All Document Registry entries archived                                  │
│   - Integration Log archived                                                │
│   - Approval History captured                                               │
│   - Snapshot of GL balances taken                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.7 Swimlane 7: End of Period / Audit — Penutupan Periode & Audit

#### Langkah 1: Generate EOP Document
- **Deskripsi:** Setelah Owner approve, ERP Core memanggil Document Number Registry untuk menghasilkan nomor **EOP** (End of Period).
- **Data EOP:** `period_start`, `period_end`, `locked_by`, `locked_at`, `document_count`, `total_revenue`, `total_expense`, `net_profit`.
- **Cross-Reference:** `EOP` mengelompokkan (groups) semua dokumen dalam periode tersebut: `POS`, `TRM`, `STK`, `WIP`, `AP`, `BP`, `JE`, `FA`.

#### Langkah 2: Lock Period
- **Deskripsi:** Periode akuntansi di-lock. Semua financial period di-set ke `locked`.
- **Efek Lock:**
  - Tidak ada transaksi baru yang bisa masuk ke periode terkunci
  - Tidak ada jurnal baru yang bisa di-post ke periode terkunci
  - Data bersifat read-only (kecuali untuk adjustment dengan approval khusus)
  - Laporan keuangan periode terkunci menjadi final

#### Langkah 3: Audit Trail
- **Deskripsi:** Semua data di-archive untuk audit:
  - Document Registry entries untuk periode tersebut di-export
  - Integration Log di-archive
  - Approval History (Owner approval, Supervisor approval) di-capture
  - Snapshot of General Ledger balances diambil (untuk perbandingan masa depan)

#### Langkah 4: Post-Lock Adjustment (Jika Diperlukan)
- **Decision Point:** Apakah ada adjustment yang diperlukan setelah lock?
  - **Tidak:** Periode fully closed. Data diarchive. Proses selesai.
  - **Ya:** 
    1. Buat Reversing Journal Entry (JE reversal) untuk membuka
    2. Re-open period sementara
    3. Lakukan adjustment (jurnal koreksi)
    4. Re-lock period
    5. Update audit trail dengan catatan adjustment

---

## 3. Document Number Registry — Backbone Cross-Reference

Document Number Registry adalah **tulang punggung** yang menghubungkan seluruh proses. Setiap langkah dalam BPMN menghasilkan atau merujuk dokumen tertentu.

### 3.1 Mapping BPMN Step → Document Type

| BPMN Step | Swimlane | Dokumen Digenerate | Cross-Reference |
|---|---|---|---|
| Booking dibuat | POS App | **BOOK** | — |
| Transaksi POS dibuat | POS App | **POS** | `BOOK → POS` |
| Treatment dimulai | POS App | **TRM** | `POS → TRM` |
| Material dikonsumsi | Inventory/WIP | **STK** | `TRM → STK` |
| Produksi treatment | Inventory/WIP | **WIP** | `POS → WIP` |
| Pembayaran (kredit) | Finance | **BP** (piutang) | `POS → BP` |
| Jurnal otomatis | Finance | **JE** | `POS → JE`, `STK → JE` |
| Pembelian aset | Finance | **FA** | `AP → FA` |
| Period Lock | End of Period | **EOP** | `EOP groups all docs` |

### 3.2 Contoh Rantai Cross-Reference Lengkap

```
BOOK-001-20260518-0001  ──generates──►  POS-001-20260518-0042
POS-001-20260518-0042   ──generates──►  TRM-001-20260518-0019
TRM-001-20260518-0019   ──generates──►  STK-001-20260518-0007  (material: lem eyelash 5ml)
POS-001-20260518-0042   ──generates──►  JE-001-20260518-0011   (jurnal pendapatan)
STK-001-20260518-0007   ──generates──►  JE-001-20260518-0012   (jurnal persediaan)
JE-001-20260518-0011    ──groups──────►  EOP-001-20260518-0001
JE-001-20260518-0012    ──groups──────►  EOP-001-20260518-0001
STK-001-20260518-0007   ──references──►  JE-001-20260518-0012
```

---

## 4. Decision Points dalam BPMN

### 4.1 Daftar Decision Points

| # | Decision Point | Swimlane | Ya | Tidak |
|---|---|---|---|---|
| DP-1 | Walk-in atau Booking? | POS App | Walk-in → buat transaksi baru | Booking → retrive BOOK, konversi ke POS |
| DP-2 | Customer baru atau existing? | POS App | Existing → pilih dari database | Baru → registrasi customer |
| DP-3 | Data sync valid? | ERP Core | Valid → transform & post | Invalid → log error, reject, notify |
| DP-4 | QC diperlukan? | Inventory/WIP | Ya → QC checklist | Tidak → complete production |
| DP-5 | QC pass? | Inventory/WIP | Pass → complete production | Fail → rework, re-process |
| DP-6 | Bank statement match? | Finance | Match → reconciled | No match → adjustment JE, flag |
| DP-7 | **Owner approve period closing?** | Reporting/Owner | **Ya → Trigger Period Lock** | **Tidak → Review lagi (loop)** |
| DP-8 | Adjustment after lock? | End of Period/Audit | Tidak → period closed | Ya → reversing JE, re-open, adjust, re-lock |

### 4.2 Decision Point Kritis: Owner Approve Period Closing

**Ini adalah decision point paling penting dalam keseluruhan BPMN.**

```
                    ┌──────────────────┐
                    │  Owner Review    │
                    │  Period Reports  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Data OK?       │
                    │  All matched?   │
                    └────────┬─────────┘
                             │
             ┌───────────────┴───────────────┐
             │                               │
             ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │  YES: Approve   │           │  NO: Reject      │
    │                  │           │                  │
    │  Trigger Period  │           │  Owner provides  │
    │  Lock Process    │           │  notes & reason  │
    └────────┬─────────┘           └────────┬─────────┘
             │                              │
             ▼                              ▼
    ┌──────────────────┐           ┌──────────────────┐
    │  Generate EOP    │           │  Finance Team    │
    │  Lock Period     │           │  review & fix    │
    │  Archive Data    │           │                  │
    └──────────────────┘           │  - Adjust journal│
                                   │  - Correct data  │
                                   │  - Re-validate   │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  Loop Back to    │
                                   │  Owner Review    │
                                   └──────────────────┘
```

**Alur detail jika Owner Reject:**

1. Owner memberikan catatan spesifik: "Biaya operasional bulan ini terlalu tinggi, mohon review transaksi #EXP-XXX"
2. Finance team melakukan investigasi
3. Jika diperlukan, buat adjustment journal (JE manual) atau koreksi data
4. Setelah perbaikan selesai, system notifikasi Owner untuk review ulang
5. Owner review dashboard & laporan yang sudah diperbaiki
6. **Loop** berulang sampai Owner approve

**Alur detail jika Owner Approve:**

1. Sistem mengunci semua Financial Period untuk periode tersebut
2. Generate EOP document sebagai penanda final
3. Semua data periode di-archive
4. Tidak ada perubahan data yang bisa dilakukan tanpa approval khusus (re-open)
5. Laporan final periode di-generate dan disimpan

---

## 5. Ringkasan Alur Lengkap (End-to-End)

```
[CUSTOMER] ──► [POS APP] ──► [ERP CORE] ──► [INVENTORY/WIP] ──► [FINANCE] ──► [REPORTING] ──► [END OF PERIOD]
                                                                                                       
Step 1: Customer datang / booking                                                                   
Step 2: Kasir buka POS Session, input transaksi                                                     
Step 3: Document Number Registry generate BOOK, POS, TRM                                             
Step 4: Treatment oleh terapis (foto, catatan, consent)                                              
Step 5: Pembayaran di POS (tunai/non-tunai/split)                                                    
Step 6: Cetak struk, update status transaksi                                                         
Step 7: Daily Closing (tutup shift, rekap, selisih)                                                  
Step 8: Enqueue data ke ERP Sync Queue                                                              
─────────────────────────────────────────────────────────────────────────────────────                
Step 9: ERP Core dequeue, validasi master data                                                       
Step 10: Generate dokumen ERP: STK, WIP, AP, BP                                                      
Step 11: Inventory: check BOM, catat material usage, update stock card                               
Step 12: WIP: hitung variance (actual vs standard), QC (pass/fail)                                    
Step 13: Finance: Auto Journal Engine generate JE                                                    
Step 14: Post ke General Ledger, generate Trial Balance                                              
Step 15: Bank Reconciliation (cocokkan dengan statement bank)                                        
Step 16: Asset Management (depresiasi, disposal)                                                     
─────────────────────────────────────────────────────────────────────────────────────                
Step 17: Aggregate data ke Reporting Data Mart                                                       
Step 18: Generate laporan operasional & keuangan                                                     
Step 19: Owner Dashboard tampilkan KPI real-time                                                     
Step 20: Owner Review Period (decision point)                                                        
──┬── Approve → Step 21                                                                             
  └── Reject → Finance fix → loop ke Step 20                                                       
─────────────────────────────────────────────────────────────────────────────────────                
Step 21: Generate EOP document via Document Registry                                                 
Step 22: Lock financial period (read-only)                                                           
Step 23: Archive data untuk audit                                                                    
Step 24: Selesai (Period Closed)                                                                     
```

---

## 6. Diagram BPMN (Textual Representation)

Berikut representasi tekstual dari diagram BPMN untuk referensi implementasi:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: END CUSTOMER (Blue)                                                                          │
│       ╭─────╮     ┌────────┐     ┌──────────┐     ┌────────────┐     ┌─────────┐      ╔═════╗     │
│       │Start│────►│Walk-in │────►│Check-in  │────►│Receive     │────►│Pay      │─────►║ End ║     │
│       ╰─────╯     │/Booking│     │Ke Kasir  │     │Treatment   │     │Payment  │      ╚═════╝     │
│                   └────────┘     └──────────┘     └────────────┘     └─────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: POS APP (Blue)                                                                               │
│  ┌────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐     │
│  │Open│─►│Select/   │─►│Select   │─►│Generate  │─►│Treatment   │─►│Payment   │─►│Print     │     │
│  │POS │  │Create    │  │Treatment│  │Doc No    │  │Check-in &  │  │Input     │  │Receipt   │     │
│  │Ssn │  │Customer  │  │+ Staff  │  │BOOK/POS │  │Record      │  │          │  │          │     │
│  └────┘  └─────────┘  └─────────┘  └──────────┘  └────────────┘  └──────────┘  └──────────┘     │
│                                        ──◇──                                                        │
│                                    Decision:                                                        │
│                                   Walk-in/Booking                                                    │
│                                                                                                     │
│  ┌──────────────┐  ┌────────────────┐  ┌───────────┐                                              │
│  │Daily Closing │─►│Enqueue to Sync │─►│ END       │                                              │
│  │Rekap &       │  │Queue to ERP    │  ║           ║                                               │
│  │Selisih Kas   │  │                │  └───────────┘                                              │
│  └──────────────┘  └────────────────┘                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: ERP CORE (Purple)                                                                            │
│  ┌──────────┐  ┌───────────────┐  ──◇──  ┌────────────┐  ┌─────────────┐  ┌───────┐               │
│  │Dequeue   │─►│Validate Master│  Data  │Transform & │─►│Generate ERP │─►│ END   │               │
│  │Sync Data │  │Data (product, │  Valid?│Post to ERP │  │Documents    │  ║       ║               │
│  │          │  │customer, etc) │──┼──   │Tables      │  │STK,WIP,AP,BP│  └───────┘               │
│  └──────────┘  └───────────────┘  │    └────────────┘  └─────────────┘                              │
│                                    │                                                                 │
│                                    ▼                                                                 │
│                             ┌───────────┐                                                            │
│                             │Log Error  │                                                            │
│                             │Reject     │                                                            │
│                             │Notify POS │                                                            │
│                             └───────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: INVENTORY / WIP / BOM (Blue)                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ──◇──  ┌──────────────┐          │
│  │Check BOM │─►│Record      │─►│Update Stock  │─►│Generate    │  QC    │Complete      │          │
│  │Standard  │  │Actual      │  │Card & Calc   │  │STK Document│  Req?  │Production    │          │
│  │Cost      │  │Usage       │  │Variance      │  │            │──┼──   │(WIP Complete)│          │
│  └──────────┘  └────────────┘  └──────────────┘  └────────────┘  │    └──────────────┘          │
│                                                                    │                                │
│                                                                    ▼                                │
│                                                             ┌────────────────┐                       │
│                                                             │QC Checklist    │                       │
│                                                             │─ Pass/Fail     │                       │
│                                                             └────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: FINANCE / BANK / ASSET (Green)                                                                │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐  ┌───────────┐  ┌───────────┐ │
│  │Auto      │─►│Post to       │─►│Bank      │  │Asset Management  │─►│Generate   │─►│ END       │ │
│  │Journal   │  │General Ledger│  │Reconcil. │  │(Depreciation,    │  │GL Reports │  ║           ║ │
│  │(JE Gen)  │  │              │  │          │  │ Disposal)        │  │(Trial Bal)│  └───────────┘ │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────────────┘  └───────────┘                  │
│                                        ──◇──                                                        │
│                                    Statement                                                        │
│                                    Match?                                                           │
│                                    ├── Yes → Reconciled                                              │
│                                    └── No → Adjustment JE + Flag                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: REPORTING / OWNER (Yellow)                                                                    │
│  ┌──────────┐  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐                        │
│  │Aggregate │─►│Generate Reports  │─►│Owner Dashboard  │─►│Owner Review    │                        │
│  │Data      │  │(Operational +    │  │(Real-time KPI)  │  │Period Reports  │                        │
│  │          │  │ Financial)       │  │                 │  │                │                        │
│  └──────────┘  └──────────────────┘  └────────────────┘  └───────┬────────┘                        │
│                                                                   │                                  │
│                                                                  ──◇──  Approve?                     │
│                                                                   │                                  │
│                                            ┌──────────────────────┼──────────────┐                    │
│                                            │                      │              │                    │
│                                            ▼                      ▼              ▼                    │
│                                     ┌──────────────┐   ┌──────────────┐   ┌─────────┐               │
│                                     │Loop to       │◄──│Finance Team  │◄──│ NO      │               │
│                                     │Owner Review  │   │Review & Fix  │   │ (Reject)│               │
│                                     └──────────────┘   └──────────────┘   └─────────┘               │
│                                                                                                      │
│                                            ┌─────────────┐                                           │
│                                            │ YES (Approve)│                                           │
│                                            └──────┬──────┘                                           │
│                                                   │                                                  │
│                                                   ▼                                                  │
│                                            ┌────────────────┐                                        │
│                                            │Trigger Period  │                                        │
│                                            │Lock Process    │                                        │
│                                            └────────────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                      
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ POOL: END OF PERIOD / AUDIT (Red)                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ──◇──  ┌──────────────────┐                       │
│  │Generate  │─►│Lock Financial│─►│Archive for │  Adj.  │Period Fully      │                       │
│  │EOP       │  │Period        │  │Audit       │  After │Closed ──► End     │                       │
│  │Document  │  │(Read-Only)   │  │            │──┼──   │                  │                       │
│  └──────────┘  └──────────────┘  └────────────┘  │    └──────────────────┘                       │
│                                                    │                                                  │
│                                                    ▼                                                  │
│                                             ┌────────────────┐                                       │
│                                             │Reversing JE    │                                       │
│                                             │Re-open Period  │                                       │
│                                             │Make Adjustment │                                       │
│                                             │Re-lock Period  │                                       │
│                                             │Update Audit    │                                       │
│                                             └────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Glossary BPMN Terminology

| Istilah | Deskripsi |
|---|---|
| **Swimlane** | Jalur vertikal/horizontal yang merepresentasikan aktor atau sistem dalam BPMN |
| **Pool** | Kumpulan swimlane yang merepresentasikan entitas bisnis |
| **Task** | Aktivitas dalam proses (kotak persegi panjang) |
| **Sub-process** | Proses yang memiliki detail langkah di dalamnya (kotak dengan +) |
| **Gateway (◇)** | Decision point — percabangan alur berdasarkan kondisi |
| **Start Event (○)** | Titik awal proses |
| **End Event (●)** | Titik akhir proses |
| **Sequence Flow (→)** | Aliran proses dari satu task ke task lain |
| **Message Flow (---►)** | Aliran pesan/data antar pool/swimlane |
| **Data Object** | Dokumen atau data yang digunakan/dihasilkan oleh proses |
| **Document Number Registry** | Sistem penomoran dokumen terpusat yang menjadi backbone cross-reference seluruh proses |
