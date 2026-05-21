#!/bin/bash
# =============================================================================
# build-erp.sh — Build Frontend ERP Core
#
# Menjalankan npm run build untuk frontend ERP Core.
# Hasil build akan tersedia di apps/erp-core/frontend/dist/.
#
# Penggunaan:
#   ./scripts/build-erp.sh
# =============================================================================
cd /home/ubuntu/salon-eyelash-v2/apps/erp-core/frontend && npm run build 2>&1
echo "EXIT_CODE: $?"
