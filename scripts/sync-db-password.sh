#!/bin/sh
# Sinkronkan password user postgres di volume dengan POSTGRES_PASSWORD di .env
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: file .env tidak ditemukan."
  exit 1
fi

# shellcheck disable=SC1091
set -a
. ./.env
set +a

USER="${POSTGRES_USER:-postgres}"
DB="${POSTGRES_DB:-ticketing}"
PW="${POSTGRES_PASSWORD:-password}"

echo "Menyetel password postgres ke nilai POSTGRES_PASSWORD dari .env ..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 \
  -c "ALTER USER \"$USER\" WITH PASSWORD '$PW';"

echo "Menguji koneksi TCP (sama seperti app) ..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c "PGPASSWORD=\"$PW\" psql -h 127.0.0.1 -U \"$USER\" -d \"$DB\" -c 'SELECT 1'"

echo "OK. Restart app ..."
docker compose -f docker-compose.prod.yml up -d app
docker compose -f docker-compose.prod.yml logs app --tail 30
