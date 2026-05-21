#!/bin/bash
# =============================================================================
# stop-all.sh — Menghentikan Semua Layanan Salon Eyelash ERP v2
#
# Skrip ini menghentikan tiga layanan dengan membunuh proses yang berjalan
# di port-port berikut menggunakan lsof:
#   - Port 8080 → Gateway
#   - Port 4000 → POS Backend
#   - Port 5000 → ERP Backend
#
# Penggunaan:
#   ./scripts/stop-all.sh
# =============================================================================
echo "=== Stopping all services ==="
kill $(lsof -ti :8080) 2>/dev/null && echo "Gateway stopped" || echo "Gateway not running"
kill $(lsof -ti :4000) 2>/dev/null && echo "POS Backend stopped" || echo "POS Backend not running"
kill $(lsof -ti :5000) 2>/dev/null && echo "ERP Backend stopped" || echo "ERP Backend not running"
echo "=== Done ==="
