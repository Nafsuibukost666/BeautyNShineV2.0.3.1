# Gambaran Umum Sistem — EYELEASH Beautynshine Platform v4

> **Berdasarkan BPMN 2.0** — Process Flow dengan 7 Swimlanes dan Document Number Registry sebagai backbone cross-module.

## 1. Latar Belakang

Salon eyelash adalah bisnis kecantikan yang berfokus pada layanan perawatan bulu mata (eyelash extensions, lifting, tinting, removal) serta produk-produk pendukung. Platform ini dibangun berdasarkan **BPMN 2.0 Process Flow** yang mencakup seluruh alur bisnis dari hulu ke hilir:

**Alur Utama (BPMN):**
End Customer → POS App (Booking → Treatment → Payment → Closing) → ERP Core (Sync → Validate → Post) → Inventory/WIP/BOM → Finance/Bank/Asset → GL → Reports → Owner Dashboard → Audit → Period Review → Approval → Period Lock

Dokumen ini menjelaskan kebutuhan **EYELEASH Beautynshine Platform v4** — sistem POS + ERP terintegrasi berbasis web dengan arsitektur React + TypeScript + Vite (frontend) dan NestJS + Prisma + PostgreSQL (backend).

---

## 2. Target Pengguna (User Persona)

### 2.1 Owner Salon (Pemilik)
- **Peran:** Pengambil keputusan strategis.
- **Kebutuhan:** Dashboard ringkasan laba-rugi (P&L), laporan penjualan harian/bulanan, performa staff, utilisasi bed, trending produk/layanan, approval period lock.
- **Akses:** Semua modul dalam mode **read-only** kecuali approval dan konfigurasi master.

### 2.2 Admin Kasir (Cashier / Front Office)
- **Peran:** Penanganan transaksi harian, booking pelanggan, dan pembayaran.
- **Kebutuhan:** POS yang cepat, input customer, pilih treatment, checkout (cash/QR/CC/debit), cetak struk, buka/tutup shift.
- **Akses:** POS Transaction, Treatment Records (read), pembuatan booking.

### 2.3 Staff Terapis (Therapist)
- **Peran:** Pelaksana treatment.
- **Kebutuhan:** Melihat jadwal treatment, mengisi Treatment Records (foto before/after, catatan, consent form), update status treatment.
- **Akses:** Treatment Records (CRUD sendiri), jadwal shift, sertifikasi.

### 2.4 Supervisor / Manajer Operasional
- **Peran:** Mengawasi operasional harian, inventory, dan staff.
- **Kebutuhan:** Opname stok, approval pembelian, review treatment records, QC WIP, cek laporan operasional.
- **Akses:** Inventory, WIP/Manufacture, Reporting, Treatment Records (semua staff).

### 2.5 Finance & Accounting Staff
- **Peran:** Pengelolaan keuangan, akuntansi, dan aset.
- **Kebutuhan:** Input AP, rekonsiliasi bank, jurnal umum, generate laporan keuangan, manajemen aset.
- **Akses:** Finance, Bank Reconciliation, Asset Management, Accounting Master.

---

## 3. Alur Bisnis Sederhana (Simplified Business Flow)

```
Pelanggan datang / booking online
        │
        ▼
  Kasir input booking di POS
        │
        ▼
  Generate Nomor Dokumen (Document Registry)
        │
        ▼
  Treatment oleh Terapis
    ├── Foto before/after
    ├── Catatan treatment
    └── Consent form
        │
        ▼
  Pembayaran di POS (cash/QR/CC/debit/voucher)
        │
        ▼
  Daily Closing ──► Sync Queue ──► ERP Sync
        │                              │
        ▼                              ▼
  Document Registry          Validate Master Data
        │                              │
        └──────────────────────────────┘
                       │
                       ▼
               ERP Posting
            ├── Inventory / WIP / BOM
            ├── Auto Journal (GL)
            ├── Bank Reconciliation
            └── Asset Management
                       │
                       ▼
                 Reporting & Dashboard
            ├── Laporan Operasional
            ├── Laporan Keuangan (P&L, Neraca)
            └── Owner Dashboard
                       │
                       ▼
           End of Period ──► Review ──► Owner Approve ──► Period Lock
                       │
                       ▼
                 Audit Trail & Adjustment (jika perlu)
```

---

## 4. Visi Sistem

### 4.1 Visi Umum
Menjadi sistem POS/ERP terpadu yang **membantu salon eyelash mengelola seluruh aspek bisnis** — dari front desk hingga laporan keuangan — dalam satu platform yang mudah digunakan, real-time, dan akurat.

### 4.2 Misi
1. **Efisiensi Operasional** — Mempercepat proses transaksi, booking, dan treatment dengan antarmuka yang responsif.
2. **Akurasi Data** — Memastikan setiap transaksi tercatat secara otomatis ke dalam sistem akuntansi dan inventaris tanpa double-entry.
3. **Visibilitas Bisnis** — Memberikan owner dan manajer dashboard real-time serta laporan yang dapat diandalkan untuk pengambilan keputusan.
4. **Kepatuhan & Audit** — Menyediakan document registry, audit trail, dan approval flow yang memenuhi standar akuntansi dan audit internal.
5. **Skalabilitas** — Mendukung multi-cabang (branch), multi-departemen, dan multi-mata uang untuk ekspansi bisnis ke depan.

### 4.3 Prinsip Desain
- **Mobile-first** untuk kasir dan terapis (tablet/handphone).
- **Offline resilience** — transaksi tetap bisa berjalan saat koneksi terputus, sync saat online kembali.
- **Configurable** — master data dapat dikustomisasi tanpa coding (COA, tax, promotion, dll).
- **Role-based access control (RBAC)** — setiap user hanya melihat dan melakukan aksi sesuai perannya.

---

## 5. Modular Breakdown (Peta Sistem)

| Grup Modul | Modul | Deskripsi |
|---|---|---|
| **MASTER** | Product Master | Produk, kategori, BOM, supplier, batch |
| | POS Master | Treatment, bed management, voucher, promotion, cancel reason |
| | Accounting Master | COA, currency, tax, payment method, cost center, financial period |
| | Company Master | Branch, department, user/role, approval flow, staff, schedule, certification |
| **OPERASIONAL** | POS Transaction | Transaksi penjualan, booking, payment |
| | Treatment Records | Foto, notes, consent |
| | Inventory | Stock card, batch, expiry, opname |
| | WIP/Manufacture | BOM standard cost, actual usage, variance, QC, production |
| | Finance | AP, bank, GL, P&L |
| | Asset Management | Register, depreciation, disposal |
| | Bank Reconciliation | Import statement, auto-match |
| | Reporting | Operational, finance, owner dashboard |
| | End of Period | Review, lock, reopen, adjustment |
| | Document Registry | Unique key generation, cross-reference |

---

## 6. Glossary Istilah Umum

| Istilah | Definisi |
|---|---|
| **Treatment** | Layanan salon (misal: Classic Eyelash Extension, Lifting, Tinting) |
| **BOM** | Bill of Materials — daftar bahan baku untuk 1 unit treatment |
| **COA** | Chart of Accounts — daftar akun akuntansi |
| **GL** | General Ledger — buku besar akuntansi |
| **WIP** | Work in Progress — barang dalam proses produksi |
| **AP** | Account Payable — utang usaha |
| **Opname** | Stock opname — penghitungan stok fisik |
| **QC** | Quality Control — pemeriksaan kualitas |
| **Period** | Periode akuntansi (biasanya bulanan) |
| **Document Registry** | Sistem penomoran dan pencatatan dokumen terpusat |
