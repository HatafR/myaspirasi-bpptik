#!/bin/sh
# Reset database production: drop semua tabel, jalankan ulang migrasi + seed.
# PERINGATAN: Semua data tiket/admin hilang.
set -e

cd "$(dirname "$0")/.."

echo "==> Menghentikan app & nginx (postgres tetap jalan)..."
docker compose -f docker-compose.prod.yml stop app nginx

echo "==> Reset database (migrate + seed) via container sementara..."
docker compose -f docker-compose.prod.yml run --rm --no-deps \
  --entrypoint "gosu" app nextjs prisma migrate reset --force

echo "==> Menjalankan ulang app & nginx..."
docker compose -f docker-compose.prod.yml up -d app nginx

echo "==> Selesai. Cek log:"
docker compose -f docker-compose.prod.yml logs app --tail 20
