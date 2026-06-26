#!/bin/sh
# Reset database production: drop semua tabel, jalankan ulang migrasi + seed.
# PERINGATAN: Semua data tiket/admin hilang.
set -e

cd "$(dirname "$0")/.."

echo "==> Menghentikan app (postgres tetap jalan)..."
docker compose -f docker-compose.prod.yml stop app nginx

echo "==> Reset database (migrate + seed)..."
docker compose -f docker-compose.prod.yml exec -T app \
  gosu nextjs prisma migrate reset --force

echo "==> Menjalankan ulang app..."
docker compose -f docker-compose.prod.yml up -d app nginx

echo "==> Selesai. Cek log:"
docker compose -f docker-compose.prod.yml logs app --tail 20
