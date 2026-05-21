# Panduan Setup — Salon Eyelash POS/ERP v2

Panduan ini menjelaskan langkah-langkah untuk menyiapkan dan menjalankan sistem Salon Eyelash POS/ERP v2 pada server Ubuntu/Debian.

---

## 1. Prasyarat

Pastikan server/PC Anda sudah terinstall:

| Software | Versi Minimal | Catatan |
|----------|--------------|---------|
| Node.js | 20.x | Gunakan NVM untuk manajemen versi |
| npm | 10.x | Sudah termasuk Node.js |
| Docker | 24.x | Engine + Compose plugin |
| Docker Compose | v2 | Sudah include di Docker Desktop/Engine |
| PostgreSQL | 16 | Berjalan via Docker (port 5433) |
| Python | 3.10+ | Untuk gateway script |
| Git | 2.x | Untuk clone repository |

### Instalasi Node.js 20 via NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # Harus v20.x
npm -v   # Harus v10.x
```

### Instalasi Docker

```bash
# Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Logout & login kembali, lalu cek:
docker --version          # Harus 24.x+
docker compose version    # Harus v2.x
```

### Cek Prasyarat Lainnya

```bash
python3 --version   # Harus 3.10+
git --version       # Harus 2.x+
```

---

## 2. Clone Repository

```bash
git clone <repository-url> ~/salon-eyelash-v2
cd ~/salon-eyelash-v2
ls -la
# Harus melihat: apps/, scripts/, docker-compose.yml, docs/
```

---

## 3. Install Dependencies

### Backend POS

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/backend
npm install
# Output: node_modules terinstall, package-lock.json tergenerate
```

### Backend ERP

```bash
cd ~/salon-eyelash-v2/apps/erp-core/backend
npm install
```

### Frontend POS

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/frontend
npm install
```

### Frontend ERP

```bash
cd ~/salon-eyelash-v2/apps/erp-core/frontend
npm install
```

---

## 4. Setup Database

### 4.1 Jalankan PostgreSQL via Docker

```bash
cd ~/salon-eyelash-v2
docker compose up db-v2 -d
```

Tunggu hingga database siap (health check):

```bash
docker compose logs db-v2 -f
# Tunggu sampai muncul: "database system is ready to accept connections"
```

Cek status container:

```bash
docker compose ps
# db-v2 harus status "healthy"
```

Koneksi database:

| Parameter | Nilai |
|-----------|-------|
| Host | localhost |
| Port | 5433 |
| User | salon |
| Password | salon123 |
| Database | salon_v2 |
| URL | `postgresql://salon:salon123@localhost:5433/salon_v2` |

### 4.2 Push Prisma Schema

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/backend
npx prisma db push
# Output: Your database is now in sync with your Prisma schema.
```

Perintah ini akan membuat semua tabel sesuai schema Prisma di database `salon_v2`.

### 4.3 Generate Prisma Client

```bash
npx prisma generate
# Output: ✔ Generated Prisma Client to node_modules/.prisma/client
```

### 4.4 Seed Data Awal

```bash
npx prisma db seed
```

Atau jalankan langsung:

```bash
npx ts-node ../../scripts/seed.ts
```

Seed data yang dibuat:

| Data | Detail |
|------|--------|
| User | admin / admin123 (Role: OWNER) |
| Layanan | Extension Classic (Rp150.000, 90 menit) |
| Layanan | Extension Volume (Rp200.000, 120 menit) |
| Layanan | Lifting (Rp100.000, 60 menit) |
| Staff | Sari — Therapist, komisi 30% |
| Staff | Dinda — Therapist, komisi 30% |

### 4.5 (Opsional) Push Schema ERP

Schema ERP menggunakan database yang sama (`salon_v2`), cukup pastikan Prisma client sudah digenerate:

```bash
cd ~/salon-eyelash-v2/apps/erp-core/backend
cp .env.example .env
npx prisma generate
```

---

## 5. Konfigurasi Environment

### Backend POS

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://salon:salon123@localhost:5433/salon_v2
JWT_SECRET=salon-v2-secret-key-2026
```

### Backend ERP

```bash
cd ~/salon-eyelash-v2/apps/erp-core/backend
cp .env.example .env
```

Edit `.env` dengan nilai yang sama:

```env
DATABASE_URL=postgresql://salon:salon123@localhost:5433/salon_v2
JWT_SECRET=salon-v2-secret-key-2026
PORT=5000
```

---

## 6. Build Backend

### POS Backend

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/backend
npm run build
# Output: dist/main.js, dist/... (semua file JS)
```

### ERP Backend

```bash
cd ~/salon-eyelash-v2/apps/erp-core/backend
npm run build
# Output: dist/main.js, dist/...
```

---

## 7. Build Frontend

### POS Frontend

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/frontend
npm run build
# Output: dist/index.html, dist/assets/...
```

### ERP Frontend

```bash
cd ~/salon-eyelash-v2/apps/erp-core/frontend
npm run build
# Output: dist/index.html, dist/assets/...
```

---

## 8. Jalankan Services

### Jalankan Redis (jika diperlukan)

```bash
cd ~/salon-eyelash-v2
docker compose up redis -d
```

### Terminal 1 — Gateway (Port 8080)

```bash
cd ~/salon-eyelash-v2
python3 scripts/gateway.py 8080
# Output: 🌐 Gateway running on http://localhost:8080
```

Atau jalankan di background:

```bash
cd ~/salon-eyelash-v2
nohup python3 scripts/gateway.py 8080 > gateway.log 2>&1 &
```

### Terminal 2 — POS Backend (Port 4000)

```bash
cd ~/salon-eyelash-v2/apps/pos-lite/backend
node dist/main.js
# Output: [Nest] LOG ... Listening on port 4000
```

Atau background:

```bash
nohup node dist/main.js > pos-backend.log 2>&1 &
```

### Terminal 3 — ERP Backend (Port 5000)

```bash
cd ~/salon-eyelash-v2/apps/erp-core/backend
node dist/main.js
# Output: [Nest] LOG ... Listening on port 5000
```

Atau background:

```bash
nohup node dist/main.js > erp-backend.log 2>&1 &
```

### Verifikasi Semua Service Berjalan

```bash
# Cek gateway
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
# Output: 302 (redirect ke /pos)

# Cek POS backend
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/initial-data
# Output: 200

# Cek ERP backend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/settings
# Output: 401 (karena butuh token, tapi berarti server merespons)
```

---

## 9. Akses Aplikasi

Setelah semua service berjalan, akses melalui:

| URL | Deskripsi | Service |
|-----|-----------|---------|
| `http://localhost:8080` | Redirect ke /pos | Gateway |
| `http://localhost:8080/pos` | **POS Lite Frontend** | Gateway → POS dist |
| `http://localhost:8080/pos/api/*` | **POS Backend API** | Gateway → localhost:4000 |
| `http://localhost:8080/erp` | **ERP Core Frontend** | Gateway → ERP dist |
| `http://localhost:8080/erp/api/*` | **ERP Backend API** | Gateway → localhost:5000 |
| `http://localhost:4000/api` | POS Backend langsung | Backend langsung |
| `http://localhost:5000/api` | ERP Backend langsung | Backend langsung |
| `http://localhost:8081` | **code-server** (IDE web) | Editor VS Code |

### Domain Publik

| Domain | Tujuan | Deskripsi |
|--------|--------|-----------|
| `code.beautynshine.web.id` | code-server | Editor web VS Code (port 8081) |
| `dev.beautynshine.web.id` | Aplikasi | Gateway → POS/ERP (port 8080) |

### Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | OWNER |

---

## 10. Opsi: Development Mode (Hot Reload)

Gunakan `tmux` atau `screen` untuk multi-terminal:

```bash
# Session 1: Database
cd ~/salon-eyelash-v2 && docker compose up db-v2 redis -d

# Session 2: POS Backend (hot reload, port 4000)
cd ~/salon-eyelash-v2/apps/pos-lite/backend && npm run start:dev

# Session 3: ERP Backend (hot reload, port 5000)
cd ~/salon-eyelash-v2/apps/erp-core/backend && npm run start:dev

# Session 4: POS Frontend (hot reload, port 5173)
cd ~/salon-eyelash-v2/apps/pos-lite/frontend && npm run dev

# Session 5: ERP Frontend (hot reload, port 5174)
cd ~/salon-eyelash-v2/apps/erp-core/frontend && npm run dev

# Session 6: Gateway
cd ~/salon-eyelash-v2 && python3 scripts/gateway.py
```

---

## 11. Opsi: Production Mode (Docker Compose)

```bash
cd ~/salon-eyelash-v2
docker compose up -d

# Cek status
docker compose ps

# Lihat log
docker compose logs -f

# Akses langsung via port masing-masing service
# POS Frontend: http://localhost:4001
# ERP Frontend: http://localhost:5001
# Atau via Gateway (harus jalan manual): http://localhost:8080
```

**Catatan:** Gateway (Python) tetap harus dijalankan manual di luar Docker:

```bash
cd ~/salon-eyelash-v2
python3 scripts/gateway.py 8080 &
```

---

## 12. Perintah Cepat

```bash
# ===== UNTUK DEVELOPMENT =====

# 1. Start database
docker compose up db-v2 redis -d

# 2. Setup database
cd apps/pos-lite/backend
cp .env.example .env  # lalu edit
npx prisma db push
npx prisma db seed

# 3. Start backend (hot reload)
npm run start:dev

# 4. Start gateway (terminal lain)
cd ~/salon-eyelash-v2
python3 scripts/gateway.py 8080

# 5. Akses: http://localhost:8080/pos

# ===== UNTUK PRODUCTION =====

# 1. Build semua
cd apps/pos-lite/frontend && npm run build
cd apps/erp-core/frontend && npm run build
cd apps/pos-lite/backend && npm run build
cd apps/erp-core/backend && npm run build

# 2. Start semua service
cd ~/salon-eyelash-v2
docker compose up -d

# 3. Start gateway (manual, di luar Docker)
cd ~/salon-eyelash-v2 && python3 scripts/gateway.py 8080 &

# 4. Start cloudflare tunnel
cloudflared tunnel run salon-eyelash-v2

# 5. Akses: https://dev.beautynshine.web.id

# ===== MANAJEMEN =====

# Stop semua service
docker compose down

# Lihat log
docker compose logs -f

# Restart service tertentu
docker compose restart pos-backend

# Reset database (hapus semua data)
docker compose down -v
docker compose up db-v2 -d
cd apps/pos-lite/backend && npx prisma db push && npx prisma db seed
```
