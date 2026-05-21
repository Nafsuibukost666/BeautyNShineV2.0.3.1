#!/bin/bash
# =============================================================================
# start-all.sh — Memulai Semua Layanan Salon Eyelash ERP v2
#
# Skrip ini menjalankan tiga layanan secara berurutan:
#   1. Gateway  → python3 scripts/gateway.py  (port 8080)
#   2. POS Backend → node dist/main.js          (port 4000)
#   3. ERP Backend → node dist/src/main.js       (port 5000)
#
# Setiap layanan dijalankan sebagai background process via nohup.
# Log masing-masing disimpan di /tmp/ untuk debugging.
#
# Penggunaan:
#   ./scripts/start-all.sh
# =============================================================================
set -e

echo "=== Starting Salon Eyelash ERP v2 ==="

# Start gateway (port 8080)
echo "[1/3] Starting Gateway..."
cd /home/ubuntu/salon-eyelash-v2
nohup python3 scripts/gateway.py 8080 > /tmp/gateway.log 2>&1 &
echo "  Gateway PID: $!"

# Wait for gateway
sleep 1

# Start POS backend
echo "[2/3] Starting POS Backend..."
cd /home/ubuntu/salon-eyelash-v2/apps/pos-lite/backend
export DATABASE_URL=postgresql://salon:salon123@localhost:5433/salon_v2
export JWT_SECRET=salon-eyelash-jwt-secret-key-2024
nohup node dist/main.js > /tmp/pos-backend.log 2>&1 &
echo "  POS Backend PID: $!"

# Start ERP backend
echo "[3/3] Starting ERP Backend..."
cd /home/ubuntu/salon-eyelash-v2/apps/erp-core/backend
export DATABASE_URL=postgresql://salon:salon123@localhost:5433/salon_v2
export JWT_SECRET=salon-eyelash-jwt-secret-key-2024
nohup node dist/src/main.js > /tmp/erp-backend.log 2>&1 &
echo "  ERP Backend PID: $!"

echo ""
echo "=== All services started ==="
echo "Gateway: http://localhost:8080"
echo "Cloudflare: https://merchant-english-practitioners-draws.trycloudflare.com"
echo "POS API: http://localhost:8080/pos/api"
echo "ERP API: http://localhost:8080/erp/api"
