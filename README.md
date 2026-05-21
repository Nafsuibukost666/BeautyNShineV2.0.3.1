# Beauty N Shine V2.0.3.1 — Complete Deployment

> **Salon Eyelash Management System** — ERP + POS + Backup + Dokumentasi
> **Dibuat**: 21 Mei 2026

## 📦 Struktur Lengkap

| Folder | Isi |
|--------|-----|
| `backend/` | FastAPI Python backend (port 5000) |
| `erp-frontend/` | React + Vite frontend ERP |
| `pos-frontend/` | POS Expo React Native |
| `nginx/` | Nginx config (port 8080) |
| `scripts/` | Build & utility scripts |
| `config/` | Nginx live, Cloudflare, arsip konfigurasi server |
| `database/` | PostgreSQL dump (schema + data) |
| `docs/` | Dokumentasi BPMN, arsitektur, requirements |
| `projects/` | Google Apps Script + NestJS ERP lama |
| `tools/` | Jira utility scripts |
| `shared/` | Prisma schema |

## 🚀 Quick Deploy

```bash
# 1. Backend
cd backend && python3.11 -m venv .venv
source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env && nano .env
nohup python run.py --no-reload > /tmp/erp.log 2>&1 &

# 2. Database
cd .. && docker compose up -d db-v2
docker exec -i salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 < database/salon_v2_schema.sql
docker exec -i salon-eyelash-v2-db-v2-1 psql -U salon -d salon_v2 < database/salon_v2_data.sql

# 3. Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-enabled/salon-eyelash
sudo nginx -t && sudo systemctl restart nginx

# 4. FRP Frontend
cd ../erp-frontend && npm install && npm run build
```

## 🌐 URLs

| URL | Tujuan |
|-----|--------|
| `http://localhost:8080/erp/` | ERP Dashboard |
| `http://localhost:8080/pos/` | POS Frontend |
| `http://localhost:5000/erp/api/v1/` | API Backend |

## 📋 Referensi

Untuk migrasi server lengkap (termasuk Cloudflare, DuckDNS, dll):
→ Lihat **MIGRASI.md** di repo ini
