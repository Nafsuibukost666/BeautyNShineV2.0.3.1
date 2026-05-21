#!/bin/bash
# push.sh — Commit & push semua perubahan ke GitHub BeautyNShineV2.0.3.1
# Gunakan: ./push.sh "pesan commit"
# Atau:    ./push.sh (tanpa pesan → auto-generate timestamp)

set -e

cd "$(dirname "$0")"

MSG="${1:-Update $(date '+%Y-%m-%d %H:%M')}"

# Cek apakah ada perubahan
if ! git status --porcelain | grep -q .; then
    echo "✅ Tidak ada perubahan untuk di-commit."
    exit 0
fi

# Tampilkan perubahan
echo "📦 Perubahan yang akan di-push:"
git status --short

# Add all
git add -A

# Commit
git commit -m "$MSG"

# Push
echo "☁️  Push ke GitHub..."
git push origin main

echo ""
echo "✅ Berhasil! Commit: $MSG"
echo "   https://github.com/Nafsuibukost666/BeautyNShineV2.0.3.1"
