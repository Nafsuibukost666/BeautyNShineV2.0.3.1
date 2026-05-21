#!/bin/bash
# =============================================================================
# build-pos.sh — Build Frontend POS Lite
#
# Menjalankan npm run build untuk frontend POS Lite.
# Hasil build akan tersedia di apps/pos-lite/frontend/dist/.
#
# Penggunaan:
#   ./scripts/build-pos.sh
# =============================================================================
cd /home/ubuntu/salon-eyelash-v2/apps/pos-lite/frontend
npm run build 2>&1
echo "EXIT_CODE: $?"
