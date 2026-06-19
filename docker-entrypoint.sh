#!/bin/sh
set -e

echo "[entrypoint] Memperbaiki izin direktori upload..."
chown -R nextjs:nodejs /app/private_uploads 2>/dev/null || true

echo "[entrypoint] Menjalankan migrasi database..."
if ! gosu nextjs node_modules/.bin/prisma migrate deploy; then
  echo "[entrypoint] ERROR: prisma migrate deploy gagal. Periksa DATABASE_URL dan log di atas."
  exit 1
fi

echo "[entrypoint] Memulai Next.js server..."
exec gosu nextjs node server.js
