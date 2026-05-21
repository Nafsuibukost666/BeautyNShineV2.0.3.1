# BBO-4: Services (Layanan Salon) — Backend API

## Latar Belakang
Frontend ERP sudah memiliki halaman Services.tsx dengan form CRUD lengkap,
namun backend belum memiliki endpoint yang sesuai. Task ini mengimplementasikan
backend untuk Services agar frontend bisa berfungsi penuh.

## Acceptance Criteria

### AC-1: Model Database
- [x] Tabel `erp_master_service` dengan kolom:
  - `id` — Integer, primary key, auto increment
  - `name` — String(200), NOT NULL
  - `description` — Text, nullable
  - `price` — BigInteger, default 0
  - `duration` — Integer (menit), nullable
  - `category` — String(100), nullable
  - `is_active` — Boolean, default true
  - `created_at`, `updated_at` — Timestamp (dari TimestampMixin)

### AC-2: API Endpoints
- [x] `GET /erp/api/v1/services` — Daftar layanan (dengan search filter by name/category)
- [x] `POST /erp/api/v1/services` — Buat layanan baru (201 Created)
- [x] `GET /erp/api/v1/services/{id}` — Ambil layanan by ID (404 jika tidak ada)
- [x] `PUT /erp/api/v1/services/{id}` — Update layanan
- [x] `DELETE /erp/api/v1/services/{id}` — Soft-delete (set is_active=false)

### AC-3: Frontend Compatibility
- [x] Response format: `{success: true, data: ...}` (wrapper yang digunakan ERP)
- [x] Frontend panggil `api.get('/services')` → backend terima di `/erp/api/v1/services`
- [x] Semua field form (name, description, price, duration, category) tersimpan & terbaca

### AC-4: Error Handling
- [x] 404 jika service tidak ditemukan
- [x] 422 jika validasi field gagal (name required)
- [x] Autentikasi required (Bearer JWT)

## Data Seeding
Seed layanan salon default setelah migration:
1. Classic Lash Extension — Rp 150.000, 90 menit
2. Volume Lash Extension — Rp 200.000, 120 menit
3. Brow Lamination — Rp 100.000, 60 menit
4. Eyebrow Tinting — Rp 50.000, 30 menit
5. Brow Shaping — Rp 35.000, 20 menit
6. Facial Basic — Rp 80.000, 60 menit
7. Facial Gold — Rp 150.000, 75 menit
8. Eyelash Removal — Rp 30.000, 15 menit
