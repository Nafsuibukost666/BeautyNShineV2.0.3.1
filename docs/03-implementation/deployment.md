# Panduan Deployment — Salon Eyelash POS/ERP v2

Panduan ini mencakup port mapping, gateway routing, Cloudflare tunnel, Docker Compose services, scripts, dan troubleshooting untuk deployment production.

---

## 1. Struktur Folder Project

```
/home/ubuntu/salon-eyelash-v2/
├── docker-compose.yml              # Docker Compose — 7 services
├── package.json                    # Root (workspaces)
│
├── apps/
│   ├── pos-lite/                    ─── POS Lite (Frontend Kasir)
│   │   ├── backend/                 # NestJS Backend (port 4000)
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma    # Database schema (shared)
│   │   │   ├── src/                 # Controllers, services, modules
│   │   │   ├── dist/                # Build output
│   │   │   ├── .env.example
│   │   │   └── package.json
│   │   │
│   │   └── frontend/                # React + Vite Frontend
│   │       ├── src/                 # Components, pages, hooks
│   │       ├── dist/                # Build output (diserve gateway)
│   │       └── package.json
│   │
│   └── erp-core/                    ─── ERP Core (Manajemen)
│       ├── backend/                 # NestJS Backend (port 5000)
│       │   ├── prisma/
│       │   ├── src/
│       │   ├── dist/
│       │   ├── .env.example
│       │   └── package.json
│       │
│       └── frontend/                # React + Vite Frontend
│           ├── src/
│           ├── dist/
│           └── package.json
│
├── scripts/
│   ├── gateway.py                   # Python HTTP Gateway (port 8080)
│   └── seed.ts                      # Database seed script
│
├── shared/
│   └── prisma/
│       └── schema.prisma            # Shared schema (referensi)
│
└── docs/
    └── 03-implementation/
        ├── setup-guide.md
        ├── api-endpoints.md
        ├── database-schema.md
        └── deployment.md            # ← Dokumen ini
```

---

## 2. Port Mapping

| Port (Host) | Service | Deskripsi |
|:-----------:|---------|-----------|
| **8080** | Gateway (Python) | Entry point utama — merutekan ke frontend/backend |
| **8081** | code-server | Editor VS Code web (opsional, via Docker) |
| **4000** | POS Backend (NestJS) | API backend POS — akses langsung (tanpa gateway) |
| **4001** | POS Frontend (Nginx) | Frontend POS — akses langsung via Docker |
| **5000** | ERP Backend (NestJS) | API backend ERP — akses langsung |
| **5001** | ERP Frontend (Nginx) | Frontend ERP — akses langsung via Docker |
| **5433** | PostgreSQL 16 | Database utama (host:5433 → container:5432) |
| **6379** | Redis 7 | Cache & message broker |

### Akses via Gateway (port 8080)

| URL | Tujuan |
|-----|--------|
| `http://localhost:8080/` | Redirect 302 → /pos |
| `http://localhost:8080/pos` | POS Frontend (SPA) |
| `http://localhost:8080/pos/api/*` | Proxy ke POS Backend (4000) |
| `http://localhost:8080/erp` | ERP Frontend (SPA) |
| `http://localhost:8080/erp/api/*` | Proxy ke ERP Backend (5000) |
| `http://localhost:8080/dashboard` | POS SPA route (fallback index.html) |
| `http://localhost:8080/bookings` | POS SPA route |
| `http://localhost:8080/receipt` | POS SPA route |

### Akses Langsung (tanpa gateway)

| URL | Tujuan |
|-----|--------|
| `http://localhost:4000/api/initial-data` | POS Backend langsung |
| `http://localhost:5000/api/settings` | ERP Backend langsung |
| `http://localhost:4001` | POS Frontend via Nginx (Docker) |
| `http://localhost:5001` | ERP Frontend via Nginx (Docker) |

### Domain Publik (via Cloudflare Tunnel)

| Domain | Tujuan | Port Backend |
|--------|--------|:------------:|
| `code.beautynshine.web.id` | code-server (editor web VS Code) | 8081 |
| `dev.beautynshine.web.id` | Aplikasi (gateway → POS/ERP) | 8080 |

---

## 3. Gateway Routing

Gateway (`scripts/gateway.py`) berfungsi sebagai **reverse proxy** dan **static file server**.

### Routing Logic

```
Request Path                          → Action
─────────────────────────────────────────────────────────────────
/                                     → Redirect 302 → /pos
/pos                                  → Serve POS/index.html
/pos/...                              → Serve file dari POS_FRONTEND
/pos/api/*                            → Proxy ke localhost:4000/api/*
/erp                                  → Serve ERP/index.html
/erp/...                              → Serve file dari ERP_FRONTEND
/erp/api/*                            → Proxy ke localhost:5000/api/*
/dashboard, /bookings, /receipt       → POS SPA fallback (index.html)
/serviceWorker.js, /sw.js             → Serve dari POS_FRONTEND (PWA)
/assets/*                             → Serve dari POS_FRONTEND
/icons/*                              → Serve dari POS_FRONTEND
Lainnya                               → 404 Not Found
```

### Konfigurasi Path di Gateway

```python
# scripts/gateway.py — baris 34-35
POS_FRONTEND = "/home/ubuntu/salon-eyelash-v2/apps/pos-lite/frontend/dist"
ERP_FRONTEND = "/home/ubuntu/salon-eyelash-v2/apps/erp-core/frontend/dist"
```

Pastikan folder `dist` sudah ada (hasil `npm run build`) sebelum menjalankan gateway.

### Cara Kerja Proxy

- Method HTTP (GET, POST, PUT, DELETE, PATCH) diteruskan apa adanya
- Header asli (kecuali `Host`, `Connection`, `Accept-Encoding`, `Content-Length`) diteruskan
- Body request diteruskan untuk method POST/PUT/PATCH
- Response dari backend diteruskan ke client
- Jika backend tidak merespon → `502 Bad Gateway`

### Proxy Routing Detail

| Gateway URL | Backend Tujuan |
|-------------|---------------|
| `/pos/api/auth/*` | `localhost:4000/api/auth/*` |
| `/pos/api/initial-data` | `localhost:4000/api/initial-data` |
| `/pos/api/transaction` | `localhost:4000/api/transaction` |
| `/pos/api/receipt/*` | `localhost:4000/api/receipt/*` |
| `/pos/api/customer` | `localhost:4000/api/customer` |
| `/pos/api/products*` | `localhost:4000/api/products*` |
| `/pos/api/inventory/*` | `localhost:4000/api/inventory/*` |
| `/pos/api/bookings/*` | `localhost:4000/api/bookings/*` |
| `/pos/api/reports/*` | `localhost:4000/api/reports/*` |
| `/pos/api/commissions/*` | `localhost:4000/api/commissions/*` |
| `/erp/api/auth/*` | `localhost:5000/api/auth/*` |
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

## 4. Docker Compose

File: `/home/ubuntu/salon-eyelash-v2/docker-compose.yml` — Total 7 services + 1 volume.

### Service: `db-v2`

| Parameter | Nilai |
|-----------|-------|
| Image | `postgres:16-alpine` |
| Port | `5433:5432` (host:container) |
| User | salon |
| Password | salon123 |
| Database | salon_v2 |
| Volume | `pgdata-v2:/var/lib/postgresql/data` |
| Healthcheck | `pg_isready -U salon -d salon_v2` (interval 5s) |

### Service: `redis`

| Parameter | Nilai |
|-----------|-------|
| Image | `redis:7-alpine` |
| Port | `6379:6379` (host:container) |
| Healthcheck | `redis-cli ping` (interval 5s) |

### Service: `pos-backend`

| Parameter | Nilai |
|-----------|-------|
| Build | `./apps/pos-lite/backend` (Dockerfile) |
| Port | `4000:4000` |
| Depends on | db-v2 (healthy), redis (healthy) |
| Env | `DB_HOST=db-v2`, `DB_PORT=5432`, `DB_USER=salon`, `DB_PASSWORD=salon123`, `DB_NAME=salon_v2`, `REDIS_HOST=redis`, `REDIS_PORT=6379`, `JWT_SECRET=salon-v2-secret-key-2026`, `ERP_API_URL=http://erp-backend:5000` |

### Service: `pos-frontend`

| Parameter | Nilai |
|-----------|-------|
| Build | `./apps/pos-lite/frontend` (Nginx + build output) |
| Port | `4001:80` (Nginx) |
| Depends on | pos-backend |

### Service: `erp-backend`

| Parameter | Nilai |
|-----------|-------|
| Build | `./apps/erp-core/backend` (Dockerfile) |
| Port | `5000:5000` |
| Depends on | db-v2 (healthy), redis (healthy) |
| Env | `DB_HOST=db-v2`, `DB_PORT=5432`, `DB_USER=salon`, `DB_PASSWORD=salon123`, `DB_NAME=salon_v2`, `REDIS_HOST=redis`, `REDIS_PORT=6379`, `JWT_SECRET=salon-v2-secret-key-2026` |

### Service: `erp-frontend`

| Parameter | Nilai |
|-----------|-------|
| Build | `./apps/erp-core/frontend` (Nginx + build output) |
| Port | `5001:80` (Nginx) |
| Depends on | erp-backend |

### Service: `sync-worker`

| Parameter | Nilai |
|-----------|-------|
| Build | `./apps/erp-core/backend` (image sama dengan erp-backend) |
| Command | `node dist/worker.js` |
| Port | None (internal only) |
| Depends on | db-v2 (healthy), redis (healthy) |
| Env | Sama dengan erp-backend |

### Volume

| Volume | Mount | Deskripsi |
|--------|-------|-----------|
| `pgdata-v2` | `/var/lib/postgresql/data` | Persistensi data PostgreSQL |

---

## 5. Cloudflare Tunnel

Cloudflare Tunnel digunakan untuk mengakses aplikasi dari internet tanpa perlu membuka port di firewall.

### Instalasi cloudflared

```bash
# Download cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Verifikasi
cloudflared version
```

### Autentikasi

```bash
cloudflared tunnel login
# Akan membuka browser — login ke akun Cloudflare
# Setelah sukses, file cert.pem dibuat di ~/.cloudflared/
```

### Buat Tunnel

```bash
# Buat tunnel baru
cloudflared tunnel create salon-eyelash-v2

# Hasil: file credential di ~/.cloudflared/<tunnel-id>.json
# Catat tunnel-id untuk konfigurasi selanjutnya
```

### Konfigurasi Tunnel

Buat file `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/ubuntu/.cloudflared/<tunnel-id>.json

ingress:
  # code-server (editor web VS Code)
  - hostname: code.beautynshine.web.id
    service: http://localhost:8081

  # Aplikasi utama (gateway → POS/ERP)
  - hostname: dev.beautynshine.web.id
    service: http://localhost:8080

  # Semua lalu lintas lain ditolak
  - service: http_status:404
```

### DNS Configuration

```bash
# Tambahkan CNAME record ke Cloudflare DNS
cloudflared tunnel route dns <tunnel-id> dev.beautynshine.web.id
cloudflared tunnel route dns <tunnel-id> code.beautynshine.web.id
```

### Jalankan Tunnel

```bash
# Mode manual
cloudflared tunnel run <tunnel-id>

# Atau sebagai service systemd (auto-start saat reboot)
sudo cloudflared service install

# Cek status
sudo systemctl status cloudflared
```

### Verifikasi

```bash
# Cek status tunnel
cloudflared tunnel info <tunnel-id>

# Cek dari browser
curl -I https://dev.beautynshine.web.id
curl -I https://code.beautynshine.web.id
```

---

## 6. Cara Start / Stop Services

### Production Mode (Docker Compose)

```bash
cd ~/salon-eyelash-v2

# Start semua service
docker compose up -d

# Start service tertentu
docker compose up -d pos-backend erp-backend

# Lihat status
docker compose ps

# Lihat log real-time
docker compose logs -f

# Lihat log service tertentu
docker compose logs -f pos-backend

# Stop semua service
docker compose down

# Restart service
docker compose restart pos-backend

# Hapus container + volume (⚠️ DATA HILANG!)
docker compose down -v
```

### Production Mode (Manual + PM2)

Gateway dan backend dijalankan di luar Docker dengan PM2:

```bash
# Install PM2
npm install -g pm2

# Build semua
cd ~/salon-eyelash-v2/apps/pos-lite/frontend && npm run build
cd ~/salon-eyelash-v2/apps/erp-core/frontend && npm run build
cd ~/salon-eyelash-v2/apps/pos-lite/backend && npm run build
cd ~/salon-eyelash-v2/apps/erp-core/backend && npm run build

# Start services via PM2
cd ~/salon-eyelash-v2
pm2 start apps/pos-lite/backend/dist/main.js --name pos-backend
pm2 start apps/erp-core/backend/dist/main.js --name erp-backend
pm2 start scripts/gateway.py --interpreter python3 --name gateway -- 8080

# Simpan config (agar auto-restart saat reboot)
pm2 save
pm2 startup

# Manajemen PM2
pm2 status
pm2 logs pos-backend
pm2 restart all
pm2 stop all
```

### Development Mode (Manual)

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

# Session 6: Gateway (port 8080)
cd ~/salon-eyelash-v2 && python3 scripts/gateway.py
```

---

## 7. Scripts yang Tersedia

| Script | Lokasi | Fungsi |
|--------|--------|--------|
| `gateway.py` | `~/salon-eyelash-v2/scripts/gateway.py` | Gateway HTTP (reverse proxy + static file server) |
| `seed.ts` | `~/salon-eyelash-v2/scripts/seed.ts` | Seed database dengan data awal |

### Gateway Script

```bash
# Jalankan di port default (8080)
python3 scripts/gateway.py

# Jalankan di port tertentu
python3 scripts/gateway.py 8080

# Jalankan di background
nohup python3 scripts/gateway.py 8080 > gateway.log 2>&1 &
```

### Seed Script

```bash
# Via Prisma
cd apps/pos-lite/backend
npx prisma db push
npx prisma db seed

# Atau langsung
npx ts-node ../../scripts/seed.ts
```

---

## 8. Troubleshooting

### a. Database — Connection Refused

**Gejala:** Backend error `ECONNREFUSED :5433` atau `connect ECONNREFUSED 127.0.0.1:5433`

**Solusi:**
```bash
# Cek apakah container berjalan
docker compose ps | grep db-v2

# Cek log database
docker compose logs db-v2

# Pastikan port tidak bentrok
sudo lsof -i :5433

# Restart database
docker compose restart db-v2

# Jika semua gagal, reset
docker compose down -v
docker compose up db-v2 -d
```

### b. Prisma — "Table does not exist"

**Gejala:** Error `relation "public.User" does not exist`

**Solusi:**
```bash
cd apps/pos-lite/backend
npx prisma db push
npx prisma generate
```

### c. Prisma — "Environment variable not found"

**Gejala:** Error `PrismaClientInitializationError: env(DATABASE_URL)` saat startup

**Solusi:** Pastikan file `.env` ada dan terisi dengan benar.
```bash
cat apps/pos-lite/backend/.env
# Output harus:
# DATABASE_URL=postgresql://salon:salon123@localhost:5433/salon_v2
# JWT_SECRET=salon-v2-secret-key-2026
```

### d. Gateway — 502 Bad Gateway

**Gejala:** Akses `/pos/api/*` atau `/erp/api/*` mengembalikan `502`

**Solusi:**
```bash
# Cek apakah backend berjalan
curl http://localhost:4000/api/initial-data   # Harus 200
curl http://localhost:5000/api/settings        # Harus 401 (karena butuh token, tapi server hidup)

# Jika tidak berjalan, start backend
cd apps/pos-lite/backend && node dist/main.js
```

### e. Frontend — Blank Page

**Gejala:** Akses `/pos` muncul halaman kosong (blank)

**Solusi:**
```bash
# Cek apakah build output ada
ls -la apps/pos-lite/frontend/dist/index.html
# Jika tidak ada, rebuild
cd apps/pos-lite/frontend && npm run build

# Cek apakah gateway bisa serve static files
curl http://localhost:8080/pos/index.html

# Cek console browser untuk error JavaScript (CORS, React Router, dll)
```

### f. Port Already in Use

**Gejala:** Error saat start service — `Address already in use` atau `EADDRINUSE`

**Solusi:**
```bash
# Cari proses yang menggunakan port
sudo lsof -i :8080   # Gateway
sudo lsof -i :4000   # POS Backend
sudo lsof -i :5000   # ERP Backend
sudo lsof -i :5433   # PostgreSQL
sudo lsof -i :6379   # Redis

# Matikan proses
sudo kill -9 <PID>

# Atau gunakan port alternatif saat start
PORT=4001 node dist/main.js
python3 scripts/gateway.py 8081
```

### g. Docker — Volume Issues

**Gejala:** Data hilang setelah restart container

**Solusi:** Pastikan tidak menggunakan `-v` untuk restart normal.
```bash
# ⚠️ HATI-HATI: ini menghapus volume dan SEMUA DATA!
docker compose down -v

# Gunakan ini untuk restart normal (data aman)
docker compose down
docker compose up -d
```

### h. Docker — Build Failed

**Gejala:** `docker compose build` gagal

**Solusi:**
```bash
# Rebuild tanpa cache
docker compose build --no-cache

# Atau build per service
docker compose build --no-cache pos-backend

# Cek log build detail
docker compose build --progress=plain pos-backend
```

### i. Cloudflare Tunnel — 1033 Error

**Gejala:** Error `ARGO Tunnel error: 1033` atau `Failed to connect to origin`

**Solusi:**
```bash
# Pastikan tunnel berjalan
cloudflared tunnel run <tunnel-id>

# Cek log error
journalctl -u cloudflared -f

# Pastikan ingress route benar
cat ~/.cloudflared/config.yml

# Cek apakah service target (localhost:8080) berjalan
curl http://localhost:8080

# Restart tunnel
sudo systemctl restart cloudflared
```

### j. Seed Error

**Gejala:** Error saat menjalankan `npx prisma db seed`

**Solusi:**
```bash
# Pastikan database sudah running dan schema sudah dipush
cd apps/pos-lite/backend
npx prisma db push
npx prisma generate

# Jalankan seed script langsung
npx ts-node ../../scripts/seed.ts
```

### k. JWT Token Expired

**Gejala:** Error `401 Unauthorized` setelah login

**Solusi:**
```bash
# Login ulang untuk mendapatkan token baru
curl -X POST http://localhost:8080/pos/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### l. CORS Error

**Gejala:** Error CORS di browser saat development dengan hot reload

**Solusi:**
- Pastikan frontend dev server (Vite) diakses via port 5173/5174, bukan via gateway
- Atau set proxy di `vite.config.ts` untuk development

---

## 9. Quick Reference

```bash
# ===== DEVELOPMENT =====

# 1. Start database
docker compose up db-v2 redis -d

# 2. Setup database
cd apps/pos-lite/backend
cp .env.example .env
npx prisma db push
npx prisma db seed

# 3. Start backend (hot reload)
npm run start:dev

# 4. Start gateway (terminal lain)
cd ~/salon-eyelash-v2
python3 scripts/gateway.py

# 5. Akses: http://localhost:8080/pos


# ===== PRODUCTION =====

# 1. Build semua
cd apps/pos-lite/frontend && npm run build
cd apps/erp-core/frontend && npm run build
cd apps/pos-lite/backend && npm run build
cd apps/erp-core/backend && npm run build

# 2. Start Docker services
cd ~/salon-eyelash-v2
docker compose up -d

# 3. Start gateway (manual, di luar Docker)
python3 scripts/gateway.py 8080 &

# 4. Start cloudflare tunnel
cloudflared tunnel run salon-eyelash-v2

# 5. Akses: https://dev.beautynshine.web.id


# ===== DIAGNOSIS =====

# Cek semua service
docker compose ps
pm2 status

# Cek log service tertentu
docker compose logs -f pos-backend
pm2 logs pos-backend

# Cek koneksi database
psql -h localhost -p 5433 -U salon -d salon_v2 -c "SELECT count(*) FROM \"User\";"

# Cek API langsung
curl -s http://localhost:4000/api/initial-data | head -c 200
curl -s http://localhost:5000/api/settings | head -c 200
```
