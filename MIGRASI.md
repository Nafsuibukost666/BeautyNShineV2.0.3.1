# MIGRASI — Beauty N Shine (Salon Eyelash) ke Server Baru

> **Dokumen**: 21 Mei 2026
> **Repo Backup**: https://github.com/Nafsuibukost666/BeautyNShineV0.1.2
> **Server Lama**: Ubuntu 22.04/24.04 @ VPS
> **Domain**: dev.beautynshine.web.id (Cloudflare Tunnel)
> **DuckDNS**: salon-eyelash.duckdns.org

---

## 📋 Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Prasyarat Server Baru](#2-prasyarat-server-baru)
3. [Step-by-Step Migrasi](#3-step-by-step-migrasi)
4. [Daftar Service & Port](#4-daftar-service--port)
5. [Daftar File Konfigurasi](#5-daftar-file-konfigurasi)
6. [Database](#6-database)
7. [Environment Variables](#7-environment-variables)
8. [Cron Jobs](#8-cron-jobs)
9. [Testing & Verifikasi](#9-testing--verifikasi)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Arsitektur Sistem

```
Internet
   │
   ▼
┌─────────────────────────────────────┐
│  Cloudflare Tunnel                   │
│  dev.beautynshine.web.id             │
│  expo.beautynshine.web.id            │
└────────────┬────────────────────────┘
             │ :8080 (nginx)
             ▼
┌─────────────────────────────────────┐
│  Nginx (Port 8080)                   │
│                                     │
│  /erp/   → React/Vite SPA           │
│  /pos/   → POS Lite SPA (lama)      │
│  /pos-expo/ → POS Expo (baru)       │
│  /api/   → rewrite → FastAPI :5000  │
│  /erp/api/ → rewrite → FastAPI :5000 │
│  /pos/api/ → proxy → NestJS :4000   │
└──┬──────────────┬──────────────┬────┘
   │              │              │
   ▼              ▼              ▼
┌────────┐ ┌───────────┐ ┌──────────┐
│FastAPI │ │  NestJS   │ │  Expo    │
│:5000   │ │  :4000    │ │  :8084   │
│ERP Core│ │POS Lite   │ │POS Stand.│
└───┬────┘ └─────┬─────┘ └──────────┘
    │            │
    ▼            ▼
┌──────────────────────┐
│  PostgreSQL :5433    │
│  Database: salon_v2  │
│  User: salon         │
│  Pass: salon123      │
└──────────────────────┘

Catatan: POS Lite (NestJS) sudah tidak aktif digunakan.
Semua transaksi langsung ke tabel PostgreSQL salon_v2 melalui FastAPI.
```

### Komponen Utama

| Komponen | Teknologi | Port | Status |
|----------|-----------|------|--------|
| **ERP Backend** | Python FastAPI + SQLAlchemy | 5000 | ✅ LIVE |
| **ERP Frontend** | React 18 + Vite + Recharts | (via nginx) | ✅ LIVE |
| **POS Frontend (Expo)** | React Native (Expo 54) | 8084 | 🔧 PROGRESS |
| **NestJS (POS Lite)** | NestJS + Prisma | 4000 | ⛔ NONAKTIF |
| **PostgreSQL (v2)** | PostgreSQL 16 | 5433 | ✅ LIVE |
| **PostgreSQL (lama)** | PostgreSQL 16 | 5432 | ✅ LIVE (arsiF) |
| **Nginx** | Reverse Proxy | 8080 | ✅ LIVE |
| **Cloudflare Tunnel** | cloudflared | - | ✅ LIVE |

---

## 2. Prasyarat Server Baru

### System Requirements
- **OS**: Ubuntu 22.04 LTS atau 24.04 LTS
- **CPU**: Minimal 2 core (recommended 4)
- **RAM**: Minimal 4 GB (recommended 8 GB)
- **Disk**: Minimal 20 GB free
- **Domain**: Sudah terdaftar di Cloudflare

### Software yang Harus Diinstall
```bash
# 1. System packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql-client python3.11 python3.11-venv \
    nodejs npm docker.io docker-compose-plugin

# 2. Node.js v20.x (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 3. Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# 4. Docker
sudo systemctl enable --now docker

# 5. Cloudflare Tunnel
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
```

### SSH Keys
```bash
# Generate deploy key
ssh-keygen -t ed25519 -C "deploy@beautynshine" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# → Add to GitHub: Settings → SSH Keys
```

---

## 3. Step-by-Step Migrasi

### Phase 1: Persiapan Server Baru

```bash
# 1. Clone semua source code
mkdir -p /home/ubuntu
cd /home/ubuntu

# Repo utama
git clone https://github.com/Nafsuibukost666/BeautyNShineV0.1.2.git
cd BeautyNShineV0.1.2

# 2. Setup Python backend
cd source/salon-eyelash-v2/apps/erp-core/backend-python
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# EDIT .env — sesuaikan DATABASE_URL dengan password database yang benar

# 3. Setup ERP Frontend
cd ../frontend
npm install
npm run build    # → menghasilkan dist/

# 4. Setup POS Expo
cd ../../../pos
npm install
npx expo export --platform web   # → menghasilkan dist/

# 5. Setup PostgreSQL
cd ../../..
docker compose up -d db-v2
```

### Phase 2: Restore Database

```bash
# 1. Copy file SQL backup ke server baru
# (dari folder database/ repo backup)

# 2. Restore schema
docker exec -i salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 < database/salon_v2_schema.sql

# 3. Restore data
docker exec -i salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 < database/salon_v2_data.sql

# 4. Verifikasi
docker exec salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 -c "\dt"
docker exec salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 -c "SELECT count(*) FROM public.user;"
```

### Phase 3: Setup Nginx

```bash
# 1. Copy nginx config
sudo cp config/nginx-live-salon-eyelash.conf /etc/nginx/sites-enabled/salon-eyelash

# 2. Test dan restart
sudo nginx -t
sudo systemctl restart nginx
```

### Phase 4: Setup Backend Services

```bash
# 1. Start FastAPI backend
cd /home/ubuntu/BeautyNShineV0.1.2/source/salon-eyelash-v2/apps/erpcore/backend-python
source .venv/bin/activate
nohup python run.py --no-reload > /tmp/erp-backend.log 2>&1 &
echo $! > /tmp/erp-backend.pid

# (Optional) Buat systemd service
sudo tee /etc/systemd/system/erp-backend.service << 'SERVICE'
[Unit]
Description=ERP Core FastAPI Backend
After=network.target docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/BeautyNShineV0.1.2/source/salon-eyelash-v2/apps/erp-core/backend-python
ExecStart=/home/ubuntu/BeautyNShineV0.1.2/source/salon-eyelash-v2/apps/erp-core/backend-python/.venv/bin/python run.py --no-reload
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now erp-backend
```

### Phase 5: Setup Cloudflare Tunnel

```bash
# 1. Login Cloudflare
cloudflared tunnel login

# 2. Copy config
mkdir -p ~/.cloudflared
cp config/cloudflared-config.yml ~/.cloudflared/config.yml
cp config/cloudflared-cert.pem ~/.cloudflared/cert.pem

# 3. Install tunnel service
sudo cloudflared service install
sudo systemctl enable --now cloudflared

# Atau jalankan manual:
nohup cloudflared tunnel --url http://localhost:8080 > /tmp/cloudflared.log 2>&1 &
```

### Phase 6: DuckDNS

```bash
# Setup DuckDNS cron
crontab -e
# Tambahkan:
*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=salon-eyelash&token=YOUR_TOKEN&ip=' >/dev/null
```

---

## 4. Daftar Service & Port

| Port | Service | Protocol | Keterangan |
|------|---------|----------|------------|
| 22 | SSH | TCP | Akses server |
| 5000 | FastAPI ERP | HTTP | Backend API |
| 4000 | NestJS (optional) | HTTP | POS Lite API (nonaktif) |
| 5432 | PostgreSQL lama | TCP | DB arsip (nonaktif) |
| 5433 | PostgreSQL v2 | TCP | DB utama salon_v2 |
| 8080 | Nginx | HTTP | Reverse proxy utama |
| 8084 | Nginx standalone | HTTP | POS Expo standalone |

---

## 5. Daftar File Konfigurasi

Semua file ada di folder `config/` dalam repo backup.

| File | Lokasi Asli | Fungsi |
|------|-------------|--------|
| `nginx-live-salon-eyelash.conf` | `/etc/nginx/sites-enabled/salon-eyelash` | Nginx routing live |
| `nginx-main.conf` | `/etc/nginx/nginx.conf` | Nginx main config |
| `nginx-repo.conf` | `salon-eyelash-v2/nginx/nginx.conf` | Nginx di repo (varian) |
| `nginx-standalone.conf` | `salon-eyelash-v2/nginx/nginx-standalone.conf` | Standalone Nginx port 8084 |
| `cloudflared-config.yml` | `~/.cloudflared/config.yml` | Cloudflare tunnel routing |
| `cloudflared-cert.pem` | `~/.cloudflared/cert.pem` | Sertifikat Cloudflare |
| `docker-compose.yml` | `salon-eyelash-v2/docker-compose.yml` | Docker service definitions |
| `.env.example` | (template) | Template env variables |
| `clasprc.json` | `~/.clasprc.json` | Google Apps Script auth |
| `clasp.json` | `projects/.clasp.json` | GAS project config |

---

## 6. Database

### PostgreSQL 16 — `salon_v2`

**Koneksi:**
- Host: localhost
- Port: 5433
- Database: salon_v2
- User: salon
- Password: salon123

**Tabel Utama:**
```
public.user           → Users & auth
public.product        → Products
public.category       → Categories
public.customer       → Customers
public.staff          → Staff
public.service        → Services
public.treatment      → Treatment records
public.sales_order    → Sales transactions
public.purchase_order → Purchase transactions
public.journal_entry  → Accounting journals
public.account        → Chart of accounts
public.expense        → Expenses
public.fixed_asset    → Fixed assets
public.stock_card     → Inventory tracking
public.bom            → Bill of Materials
public.wip            → Work in Progress
public.period         → Accounting periods
public.audit_log      → Audit trail
...dan lainnya
```

### Backup & Restore

```bash
# Backup (sudah dilakukan)
pg_dump -U salon -d salon_v2 --schema-only > schema.sql
pg_dump -U salon -d salon_v2 --data-only --exclude-table=audit_log > data.sql

# Restore
psql -U salon -d salon_v2 < schema.sql
psql -U salon -d salon_v2 < data.sql
```

File backup ada di folder `database/` repo ini:
- `salon_v2_schema.sql` — Struktur tabel (tanpa data)
- `salon_v2_data.sql` — Data (tanpa audit_log)

---

## 7. Environment Variables

### Backend Python (`apps/erp-core/backend-python/.env`)

```env
ERP_DATABASE_URL=postgresql://salon:PASSWORD@localhost:5433/salon_v2
ERP_SECRET_KEY=erp-secret-key-change-in-production
ERP_DEBUG=true
ERP_PORT=5000
ERP_DEFAULT_BRANCH=BSD
```

### Docker (`docker-compose.yml` built-in)

```yaml
POSTGRES_USER: salon
POSTGRES_PASSWORD: salon123
POSTGRES_DB: salon_v2
```

### DuckDNS (crontab)

```bash
# Token ada di cronjob
DUCKDNS_DOMAIN=salon-eyelash
DUCKDNS_TOKEN=<lihat crontab>
```

### Cloudflare

```yaml
# ~/.cloudflared/config.yml
tunnel: beautynshine
credentials-file: ~/.cloudflared/c9532044-ee43-4f09-a4f9-900815e58d1f.json
```

---

## 8. Cron Jobs

```bash
# DuckDNS update — setiap 5 menit
*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=salon-eyelash&token=***&ip=' >/dev/null
```

---

## 9. Testing & Verifikasi

Setelah migrasi, jalankan checklist berikut:

### ✅ Service Health
```bash
# Cek semua service
systemctl is-active nginx
systemctl is-active docker
systemctl is-active cloudflared
ps aux | grep python | grep -v grep  # FastAPI harus jalan

# Cek port
ss -tlnp | grep -E '5000|5433|8080'
```

### ✅ Web Access
```bash
# ERP
curl -sL http://localhost:8080/erp/ | head -5

# POS
curl -sL http://localhost:8080/pos/ | head -5

# POS Expo
curl -sL http://localhost:8080/pos-expo/ | head -5

# API
curl -s -w "\nHTTP:%{http_code}" http://localhost:8080/erp/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### ✅ Database
```bash
# Cek koneksi DB
docker exec salon-eyelash-v2-db-v2-1 pg_isready -U salon -d salon_v2

# Cek data
docker exec salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 -c "
  SELECT count(*) as total_users FROM public.user;
  SELECT count(*) as total_products FROM public.product;
  SELECT count(*) as total_customers FROM public.customer;
"
```

### ✅ Domain
```bash
# Cek dari luar
curl -sL http://dev.beautynshine.web.id/ | head -3
curl -sL https://dev.beautynshine.web.id/ | head -3
```

---

## 10. Rollback Plan

Jika migrasi gagal, kembalikan DNS ke server lama:

### Step 1: Cloudflare DNS
1. Buka Cloudflare Dashboard → DNS
2. A-record `dev.beautynshine.web.id` → IP server LAMA
3. TTL: Auto (atau 60 detik untuk fast switch)

### Step 2: DuckDNS (Jika Pakai)
```bash
# Update DuckDNS ke IP lama
curl -s "https://www.duckdns.org/update?domains=salon-eyelash&token=TOKEN&ip=IP_LAMA"
```

### Step 3: Server Baru
```bash
# Matikan service di server baru
sudo systemctl stop erp-backend nginx cloudflared
```

### Step 4: Verifikasi
```bash
# Dari luar
curl -sL http://dev.beautynshine.web.id/
# Harus balik ke server lama
```

---

## 📁 Struktur Repo Backup Ini

```
BeautyNShineV0.1.2/
├── MIGRASI.md                ← Dokumen ini
├── README.md                 ← Overview
├── source/
│   ├── salon-eyelash-v2/     ← Source code utama
│   │   ├── apps/
│   │   │   ├── erp-core/     → ERP (FastAPI + React)
│   │   │   └── pos/          → POS (Expo)
│   │   ├── docs/             → Dokumentasi project
│   │   ├── scripts/          → Build & utility scripts
│   │   ├── shared/           → Prisma schema
│   │   ├── tools/            → Jira utility scripts
│   │   ├── nginx/            → Nginx config dari repo
│   │   ├── docker-compose.yml
│   │   └── README.md
│   └── projects/             → GAS (Google Apps Script) + arsitektur
├── config/
│   ├── nginx-live-salon-eyelash.conf  ← Nginx config LIVE
│   ├── nginx-main.conf                ← Nginx main config
│   ├── nginx-repo.conf                ← Nginx dari repo
│   ├── nginx-standalone.conf          ← Standalone Nginx :8084
│   ├── cloudflared-config.yml         ← Cloudflare tunnel config
│   ├── cloudflared-cert.pem           ← Cloudflare cert
│   ├── clasprc.json                   ← Google Apps Script auth
│   └── clasp.json                     ← GAS project config
├── database/
│   ├── salon_v2_schema.sql   ← Struktur DB (schema-only)
│   └── salon_v2_data.sql     ← Data DB (no audit_log)
├── docs/
│   └── hermes/               ← Hermes agent config (optional)
└── .env.example              ← Template semua env variables
```

---

> **Catatan Penting:**
> - Jangan commit `.env` asli ke GitHub — gunakan `.env.example` saja
> - Password database di docker-compose.yml sudah diganti placeholder
> - Token Cloudflare & DuckDNS harus disimpan aman (password manager)
> - Setelah migrasi, test login dengan user admin/admin123 dulu
