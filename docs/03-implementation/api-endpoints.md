# Dokumentasi API — Salon Eyelash POS/ERP v2

Dokumentasi ini mencakup seluruh endpoint API yang tersedia di sistem. Backend dibagi menjadi dua service:

- **POS Backend** (port 4000) — Transaksi kasir, booking, inventori, komisi, laporan
- **ERP Backend** (port 5000) — Manajemen master data, laporan keuangan, pengaturan

Keduanya diakses melalui **Gateway** di port 8080 dengan prefix `/pos/api/` dan `/erp/api/`.

Semua endpoint kecuali login memerlukan **Bearer Token** JWT di header `Authorization`:

```
Authorization: Bearer eyJhbGci...s...
```

---

## Autentikasi

### POS Backend — `/api/auth/*`

- **POST** `/api/auth/login`
  - Deskripsi: Login pengguna, mengembalikan token JWT
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "access_token": "eyJhbGci..." }`

- **POST** `/api/auth/register`
  - Deskripsi: Mendaftarkan user baru
  - Body: `{ "username": "...", "password": "...", "name": "...", "role?": "OWNER|ADMIN|STAFF" }`
  - Response: `{ "success": true, "data": { "id", "username", "role" } }`

### ERP Backend — `/api/auth/*`

- **POST** `/api/auth/login`
  - Deskripsi: Login pengguna
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "access_token": "eyJhbGci...", "user": { "id", "username", "role" } }`

- **GET** `/api/auth/profile`
  - Deskripsi: Mengambil profil user yang sedang login
  - Header: `Authorization: Bearer <token>`
  - Response: `{ "id", "username", "role" }`

---

## POS — Point of Sale (Kasir)

Base: `/api/` (POS Backend, port 4000)

### Initial Data

- **GET** `/api/initial-data`
  - Deskripsi: Mengambil semua data awal yang dibutuhkan halaman kasir (layanan, produk, staf, pelanggan)
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "services": [{ "id", "name", "category", "price", "durationMin", "active" }],
        "products": [{ "id", "name", "category", "sku", "sellingPrice", "stockQty", "minStock" }],
        "staff": [{ "id", "name", "role", "commissionType", "commissionValue", "active" }],
        "customers": [{ "id", "name", "phone", "instagram", "totalVisit", "totalSpending" }]
      }
    }
    ```

### Customer (dari Kasir)

- **POST** `/api/customer`
  - Deskripsi: Membuat pelanggan baru dari halaman kasir
  - Body: `{ "nama": "string", "no_hp?": "string" }`
  - Response: `{ "success": true, "data": { "id", "name", "phone", ... } }`

### Transaksi

- **POST** `/api/transaction`
  - Deskripsi: Membuat transaksi penjualan baru
  - Body:
    ```json
    {
      "customer": { "name": "...", "phone?": "...", "instagram?": "..." },
      "items": [{ "item_type": "service|product", "item_name": "...", "qty": 1, "unit_price": 150000, "discount?": 0, "staff_id?": "...", "staff_name?": "..." }],
      "payments": [{ "method": "CASH|QRIS|TRANSFER|DEBIT", "amount": 150000, "reference_no?": "..." }],
      "staff_id?": "...",
      "staff_name?": "...",
      "discount?": 0,
      "notes?": "..."
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid",
        "code": "INV-20260518-001",
        "date": "2026-05-18T00:00:00.000Z",
        "customerName": "...",
        "subtotal": 150000,
        "discount": 0,
        "grandTotal": 150000,
        "paymentStatus": "PAID"
      }
    }
    ```

- **GET** `/api/receipt/:code`
  - Deskripsi: Mengambil data struk transaksi berdasarkan kode
  - Param: `code` (contoh: `INV-20260518-001`)
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "transaction": { "id", "code", "date", "customerName", "subtotal", "discount", "grandTotal", "paymentStatus" },
        "items": [{ "itemType", "itemName", "qty", "unitPrice", "discount", "lineTotal", "staffName" }],
        "payments": [{ "method", "amount", "referenceNo" }]
      }
    }
    ```

---

## Reports — Laporan

### POS Backend — `/api/reports/*`

- **GET** `/api/reports/sales`
  - Deskripsi: Laporan penjualan ringkasan dalam rentang tanggal
  - Query: `start=2026-01-01&end=2026-01-31`
  - Response: `{ "success": true, "data": { "totalSales": 5000000, "totalTransactions": 25, "chart": { "labels": [...], "values": [...] } } }`

- **GET** `/api/reports/sales-detail`
  - Deskripsi: Laporan penjualan detail dengan paginasi
  - Query: `start=2026-01-01&end=2026-01-31&page=1&limit=20`
  - Response: `{ "success": true, "data": { "transactions": [...], "total": 100, "page": 1, "limit": 20 } }`

- **GET** `/api/reports/bookkeeping`
  - Deskripsi: Laporan laba/rugi (bookkeeping)
  - Query: `start=2026-01-01&end=2026-01-31`
  - Response: `{ "success": true, "data": { "revenue": 5000000, "expenses": 1000000, "profit": 4000000 } }`

### ERP Backend — `/api/reports/*`

- **GET** `/api/reports/dashboard`
  - Deskripsi: Data dashboard ringkasan (total revenue, transaksi, pelanggan)
  - Response: `{ "totalRevenue": 5000000, "totalTransactions": 25, "totalCustomers": 50, "totalServices": 3, "totalStaff": 2 }`

- **GET** `/api/reports/range`
  - Deskripsi: Laporan rentang tanggal
  - Query: `start=2026-01-01&end=2026-01-31`
  - Response: `{ "revenue": 5000000, "expenses": 1000000, "bookings": 10 }`

- **GET** `/api/reports/daily/:date`
  - Deskripsi: Laporan harian untuk tanggal tertentu
  - Param: `date` (format: `YYYY-MM-DD`)
  - Response: `{ "date": "2026-05-18", "revenue": 500000, "transactions": 5, "expenses": 100000 }`

---

## Expense — Pengeluaran

### POS Backend — `/api/reports/expenses/*`

- **GET** `/api/reports/expenses`
  - Deskripsi: Daftar pengeluaran dalam rentang tanggal
  - Query: `start=2026-01-01&end=2026-01-31`
  - Response: `{ "success": true, "data": [{ "id", "description", "amount", "category", "expenseDate" }] }`

- **POST** `/api/reports/expenses`
  - Deskripsi: Mencatat pengeluaran baru
  - Body: `{ "keterangan": "Listrik", "jumlah": 500000, "kategori?": "OPERATIONAL", "tanggal": "2026-01-15" }`
  - Response: `{ "success": true, "data": { "id", "description": "Listrik", "amount": 500000, "category": "OPERATIONAL", "expenseDate": "2026-01-15" } }`

- **DELETE** `/api/reports/expenses/:id`
  - Deskripsi: Menghapus pengeluaran berdasarkan ID
  - Response: `{ "success": true }`

### ERP Backend — `/api/expenses/*`

- **GET** `/api/expenses`
  - Deskripsi: Daftar pengeluaran dengan filter
  - Query: `start=...&end=...&category=OPERATIONAL`
  - Response: `[{ "id", "description", "amount", "category", "expenseDate", "createdAt" }]`

- **GET** `/api/expenses/:id`
  - Deskripsi: Detail pengeluaran

- **POST** `/api/expenses`
  - Deskripsi: Membuat pengeluaran baru

- **PUT** `/api/expenses/:id`
  - Deskripsi: Mengupdate pengeluaran

- **DELETE** `/api/expenses/:id`
  - Deskripsi: Menghapus pengeluaran

---

## Inventory — Inventori

### POS Backend — `/api/*`

### Products

- **GET** `/api/products`
  - Deskripsi: Daftar produk dengan filter
  - Query: `category=...&search=...&low_stock=true`
  - Response: `{ "success": true, "data": [{ "id", "name", "category", "sku", "costPrice", "sellingPrice", "stockQty", "minStock", "unit", "active" }] }`

- **POST** `/api/products`
  - Deskripsi: Membuat produk baru
  - Body: `{ "name": "...", "category?": "...", "sku?": "...", "costPrice": 50000, "sellingPrice": 75000, "stockQty?": 10, "minStock?": 5, "unit?": "pcs" }`
  - Response: `{ "success": true, "data": { "id", "name", ... } }`

- **PUT** `/api/products/:id`
  - Deskripsi: Mengupdate produk
  - Body: (field opsional) `{ "name?": "...", "category?": "...", "sellingPrice?": 80000 }`
  - Response: `{ "success": true, "data": { ... } }`

- **DELETE** `/api/products/:id`
  - Deskripsi: Menghapus produk (soft delete via field `active`)
  - Response: `{ "success": true, "data": { ... } }`

### Stock Movements

- **GET** `/api/inventory/stock-movements/:productId`
  - Deskripsi: Riwayat pergerakan stok untuk suatu produk
  - Response: `{ "success": true, "data": [{ "id", "type": "IN|OUT", "qty": 10, "note": "...", "createdAt" }] }`

- **POST** `/api/inventory/stock-in`
  - Deskripsi: Mencatat stok masuk (penambahan)
  - Body: `{ "productId": "...", "qty": 10, "note?": "Pembelian supplier" }`
  - Response: `{ "success": true, "data": { "id", "type": "IN", "qty": 10, ... } }`

- **POST** `/api/inventory/stock-out`
  - Deskripsi: Mencatat stok keluar (pengurangan)
  - Body: `{ "productId": "...", "qty": 5, "note?": "Rusak/kadaluarsa" }`
  - Response: `{ "success": true, "data": { "id", "type": "OUT", "qty": 5, ... } }`

### ERP Backend — `/api/products/*`

- **GET** `/api/products`
  - Deskripsi: Daftar semua produk

- **GET** `/api/products/low-stock`
  - Deskripsi: Produk dengan stok di bawah threshold
  - Query: `threshold=10`
  - Response: `[{ "id", "name", "stockQty", "minStock" }]`

- **GET** `/api/products/:id`
  - Deskripsi: Detail produk

- **POST** `/api/products`
  - Deskripsi: Membuat produk baru

- **PUT** `/api/products/:id`
  - Deskripsi: Mengupdate produk

- **DELETE** `/api/products/:id`
  - Deskripsi: Menghapus produk

---

## Commissions — Komisi Staff

### POS Backend — `/api/*`

- **GET** `/api/commissions`
  - Deskripsi: Daftar komisi dengan filter
  - Query: `staffId=...&startDate=...&endDate=...&calculated=true|false`
  - Response: `{ "success": true, "data": [{ "id", "staffId", "staffName", "transactionId", "amount", "calculated", "createdAt" }] }`

- **GET** `/api/commissions/summary`
  - Deskripsi: Ringkasan komisi (total, sudah dibayar, belum dibayar)
  - Response: `{ "success": true, "data": { "total": 500000, "paid": 300000, "unpaid": 200000 } }`

- **POST** `/api/commissions/calculate/:transactionId`
  - Deskripsi: Menghitung komisi untuk transaksi tertentu
  - Response: `{ "success": true, "data": { "id", "staffId", "amount", "calculated": false } }`

- **POST** `/api/commissions/calculate-batch`
  - Deskripsi: Menghitung komisi untuk semua transaksi yang belum dihitung
  - Response: `{ "success": true, "data": { "count": 5, "total": 450000 } }`

### ERP Backend — `/api/commissions`

- **GET** `/api/commissions`
  - Deskripsi: Daftar komisi (filter)
  - Query: `start=...&end=...&staff_id=...`
  - Response: `[{ "id", "staffId", "staff", "transactionId", "amount", "calculated", "createdAt" }]`

---

## Bookings — Booking / Janji Temu

### POS Backend — `/api/bookings/*`

- **GET** `/api/bookings/available-slots`
  - Deskripsi: Slot waktu yang tersedia untuk suatu tanggal dan staf
  - Query: `date=2026-05-18&staffId=...`
  - Response: `{ "success": true, "data": ["10:00", "10:30", "11:00", ...] }`

- **GET** `/api/bookings/calendar`
  - Deskripsi: Kalender booking untuk satu bulan
  - Query: `month=2026-05&staffId=...`
  - Response: `{ "success": true, "data": { "2026-05-01": [...], "2026-05-02": [...] } }`

- **GET** `/api/bookings`
  - Deskripsi: Daftar booking dengan filter
  - Query: `date=...&staffId=...&serviceId=...&status=BOOKED|DONE|CANCELLED|NO_SHOW`
  - Response: `{ "success": true, "data": [{ "id", "date", "time", "customerName", "customerPhone", "serviceName", "staffName", "status" }] }`

- **POST** `/api/bookings`
  - Deskripsi: Membuat booking baru
  - Body: `{ "date": "2026-05-18", "time": "10:00", "customerName": "...", "customerId?": "...", "customerPhone?": "...", "serviceId?": "...", "staffId?": "...", "notes?": "..." }`
  - Response: `{ "success": true, "data": { "id", "date", "time", "customerName", "status": "BOOKED" } }`

- **PUT** `/api/bookings/:id`
  - Deskripsi: Mengupdate data booking
  - Body: (field opsional) `{ "date?": "...", "time?": "...", "customerName?": "...", "serviceId?": "..." }`
  - Response: `{ "success": true, "data": { ... } }`

- **PUT** `/api/bookings/:id/status`
  - Deskripsi: Mengupdate status booking
  - Body: `{ "status": "DONE|CANCELLED|NO_SHOW" }`
  - Response: `{ "success": true, "data": { ..., "status": "DONE" } }`

- **DELETE** `/api/bookings/:id`
  - Deskripsi: Menghapus booking
  - Response: `{ "success": true, "data": { "id", ... } }`

### ERP Backend — `/api/booking/*`

- **GET** `/api/booking/initial-data`
  - Deskripsi: Data awal untuk halaman booking (daftar layanan & staf)

- **POST** `/api/booking`
  - Deskripsi: Membuat booking baru

- **GET** `/api/booking/by-date/:date`
  - Deskripsi: Booking berdasarkan tanggal
  - Param: `date` (format: `YYYY-MM-DD`)

- **PATCH** `/api/booking/:id/status`
  - Deskripsi: Mengupdate status booking
  - Body: `{ "status": "DONE|CANCELLED|NO_SHOW" }`

---

## Master Data (ERP Backend)

### Customers — `/api/customers/*`

- **GET** `/api/customers`
  - Deskripsi: Daftar semua pelanggan
  - Query: `search=nama`
  - Response: `[{ "id", "name", "phone", "instagram", "birthday", "notes", "totalVisit", "totalSpending", "active" }]`

- **GET** `/api/customers/:id`
  - Deskripsi: Detail pelanggan

- **POST** `/api/customers`
  - Deskripsi: Membuat pelanggan baru
  - Body: `{ "name": "...", "phone?": "...", "instagram?": "...", "birthday?": "1990-01-01", "notes?": "..." }`

- **PUT** `/api/customers/:id`
  - Deskripsi: Mengupdate data pelanggan

- **DELETE** `/api/customers/:id`
  - Deskripsi: Menghapus pelanggan (soft delete)

### Staff — `/api/staff/*`

- **GET** `/api/staff`
  - Deskripsi: Daftar semua staff
  - Response: `[{ "id", "name", "role": "Therapist", "phone", "commissionType": "PERCENTAGE|FIXED", "commissionValue": 30, "active" }]`

- **GET** `/api/staff/:id`
  - Deskripsi: Detail staff

- **POST** `/api/staff`
  - Deskripsi: Membuat staff baru
  - Body: `{ "name": "...", "role?": "Therapist", "commissionType": "PERCENTAGE", "commissionValue": 30, "phone?": "..." }`

- **PUT** `/api/staff/:id`
  - Deskripsi: Mengupdate data staff

- **DELETE** `/api/staff/:id`
  - Deskripsi: Menghapus staff (soft delete)

### Services — `/api/services/*`

- **GET** `/api/services`
  - Deskripsi: Daftar semua layanan
  - Response: `[{ "id", "name", "category", "price": 150000, "durationMin": 90, "active" }]`

- **GET** `/api/services/:id`
  - Deskripsi: Detail layanan

- **POST** `/api/services`
  - Deskripsi: Membuat layanan baru
  - Body: `{ "name": "...", "category?": "Extension", "price": 150000, "durationMin?": 60 }`

- **PUT** `/api/services/:id`
  - Deskripsi: Mengupdate layanan

- **DELETE** `/api/services/:id`
  - Deskripsi: Menghapus layanan (soft delete)

### Settings — `/api/settings/*`

- **GET** `/api/settings`
  - Deskripsi: Mengambil semua pengaturan aplikasi
  - Response: `[{"key": "salon_name", "value": "Beauty N Shine"}, {"key": "phone", "value": "08123456789"}]`

- **PUT** `/api/settings`
  - Deskripsi: Mengupdate pengaturan (bulk update)
  - Body: `{ "salon_name": "Beauty N Shine", "phone": "08123456789", "address": "Jl. Contoh No. 123" }`
  - Response: `{ "success": true }`

---

## Gateway Routing

Semua API diakses melalui Gateway (port 8080) yang merutekan ke backend yang sesuai:

| URL Gateway | Backend Tujuan |
|-------------|---------------|
| `/pos/api/auth/login` | `localhost:4000/api/auth/login` |
| `/pos/api/initial-data` | `localhost:4000/api/initial-data` |
| `/pos/api/transaction` | `localhost:4000/api/transaction` |
| `/pos/api/receipt/:code` | `localhost:4000/api/receipt/:code` |
| `/pos/api/customer` | `localhost:4000/api/customer` |
| `/pos/api/products` | `localhost:4000/api/products` |
| `/pos/api/products/:id` | `localhost:4000/api/products/:id` |
| `/pos/api/inventory/stock-in` | `localhost:4000/api/inventory/stock-in` |
| `/pos/api/inventory/stock-out` | `localhost:4000/api/inventory/stock-out` |
| `/pos/api/inventory/stock-movements/:id` | `localhost:4000/api/inventory/stock-movements/:id` |
| `/pos/api/bookings/*` | `localhost:4000/api/bookings/*` |
| `/pos/api/reports/*` | `localhost:4000/api/reports/*` |
| `/pos/api/commissions/*` | `localhost:4000/api/commissions/*` |
| `/erp/api/auth/login` | `localhost:5000/api/auth/login` |
| `/erp/api/auth/profile` | `localhost:5000/api/auth/profile` |
| `/erp/api/customers/*` | `localhost:5000/api/customers/*` |
| `/erp/api/staff/*` | `localhost:5000/api/staff/*` |
| `/erp/api/services/*` | `localhost:5000/api/services/*` |
| `/erp/api/products/*` | `localhost:5000/api/products/*` |
| `/erp/api/expenses/*` | `localhost:5000/api/expenses/*` |
| `/erp/api/reports/*` | `localhost:5000/api/reports/*` |
| `/erp/api/settings/*` | `localhost:5000/api/settings/*` |
| `/erp/api/booking/*` | `localhost:5000/api/booking/*` |
| `/erp/api/commissions/*` | `localhost:5000/api/commissions/*` |

---

## Format Response Standar

**Sukses (POS Backend):**

```json
{
  "success": true,
  "data": { ... }
}
```

**Sukses (ERP Backend):**
ERP Backend mengembalikan data langsung (tanpa wrapper `success`/`data`), kecuali endpoint tertentu.

**Error:**

```json
{
  "statusCode": 400,
  "message": "Nama pelanggan wajib diisi",
  "error": "Bad Request"
}
```

**Unauthorized:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Proxy Error (Gateway):**

```json
502 Bad Gateway — Proxy error: ...
```
