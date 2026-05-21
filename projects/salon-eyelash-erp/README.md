# Salon Eyelash ERP 💅✨

**POS + Booking + Inventory + Expense + Report System** untuk UMKM Salon Eyelash.

> Stack: **React** (Vite) + **Node.js** (Express) + **PostgreSQL** + **Docker** + **Python** (Reports Microservice)

---

## 🚀 Cara Jalanin

### Pake Docker (recommended)

```bash
# 1. Clone repo
git clone https://github.com/Nafsuibukost666/salon-eyelash-erp.git
cd salon-eyelash-erp

# 2. Copy .env & setting database
cp .env.example .env
# edit .env: isi DATABASE_URL

# 3. Jalanin semua service
docker compose up -d

# 4. Buka browser
open http://localhost:3000
```

### Manual (tanpa Docker)

```bash
# 1. Install PostgreSQL, buat database
createdb salon_eyelash
psql salon_eyelash < database/init.sql

# 2. Backend
cd backend
npm install
npm start

# 3. Frontend (beda terminal)
cd frontend
npm install
npm run dev
```

---

## 📸 Fitur

| Menu | Fitur |
|------|-------|
| **POS Kasir** | Transaksi layanan, struk digital, pembayaran multi-metode |
| **Booking** | Jadwal appointment, manajemen status (booked/done/cancelled/no_show) |
| **Laporan** | Omzet harian, breakdown per therapist & layanan, komisi, export CSV/Excel/PDF |
| **Customer** | Data customer + riwayat kunjungan |
| **Stok Produk** | Manajemen stok & bahan baku salon, bulk upload CSV |
| **Pengeluaran** | Catat pengeluaran keuangan harian |
| **Pengguna** | Manajemen user (owner/admin/kasir) |

---

## 🐛 Bug Fixes (v3.1)

### 1️⃣ Blank page tiba-tiba + ErrorBoundary
**Masalah:** Kalo ada error JavaScript (misal data undefined), React crash total → halaman putih.

**Solusi:**
- ✅ Ditambah **ErrorBoundary** component — nangkep error rendering
- ✅ Kalo error, muncul pesan "Ada yang error nih" + tombol refresh
- ✅ Dipasang 2 lapis: outer (App.jsx) + inner per tab (Layout.jsx)

### 2️⃣ `E.map is not a function` di semua tab
**Masalah:** Backend kirim data pake format `{ success: true, data: [...] }` tapi frontend baca `res.data.customers || res.data` → `res.data` adalah **object** bukan array → `.map()` crash.

**Tab yang kena:**
- ❌ Booking → `res.data.bookings || res.data`
- ❌ Pengeluaran → `res.data.expenses || res.data`
- ❌ Customer → `res.data.customers || res.data`
- ❌ Pengguna → `res.data.users || res.data`

**Solusi:** Semua diganti pake:
```js
Array.isArray(res.data?.data) 
  ? res.data.data 
  : (Array.isArray(res.data?.namaField) ? res.data.namaField : [])
```

### 3️⃣ Nama field service/staff mismatch
**Masalah:** Backend pake `service_id` / `service_name` tapi frontend pake `s.id` / `s.name` — dropdown layanan & staff jadi kosong.

**Solusi:** Pake `s.service_id || s.id` dan `s.service_name || s.name` biar kompatibel.

### 4️⃣ Login card miring ke kiri
**Masalah:** Di laptop lebar, login card kejepit di container 1126px + ada border kiri.

**Solusi:** `.login-page` pake `width: 100vw; margin-left: calc(-50vw + 50%)` biar full viewport + card di tengah.

### 5️⃣ Redirect paksa di API interceptor
**Masalah:** `api.js` redirect paksa pake `window.location.href = '/login'` — bentrok sama React Router.

**Solusi:** Dihapus. Biar React Router handle redirect lewat `ProtectedRoute`.

### 6️⃣ Axios timeout
**Masalah:** Kalo server lagi mati/hang, loading "Memuat..." muncul terus.

**Solusi:** Ditambah `timeout: 15000` (15 detik) di axios instance.

---

## 🗺️ Roadmap

| Sprint | Fitur | Status |
|--------|-------|--------|
| 1-8 | SPA GAS + Rose Gold theme | ✅ Done |
| 9 | Manajemen Customer + Riwayat | ✅ Done |
| 10 | Stok Produk & Bahan Baku | ✅ Done |
| 11 | Pengeluaran Keuangan | ✅ Done |
| 12 | **Bug fixes + ErrorBoundary + React stabilization** | ✅ **Done (v3.1)** |
| 13 | Laporan Laba Rugi | 📅 Coming |
| 14 | Dashboard Owner | 📅 Coming |
| 15 | Hak Akses (Admin/Kasir/Owner) | 📅 Coming |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite 8 (SPA)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 16
- **Reports Microservice:** Python + Flask
- **Container:** Docker + Docker Compose + Nginx
- **Deploy:** Cloudflare Tunnel (VPS tanpa port terbuka)

---

Dibuat dengan ❤️ untuk UMKM Salon Eyelash.
