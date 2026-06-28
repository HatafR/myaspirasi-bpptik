# Panduan Deploy Remediasi VAPT
# Nomor laporan: 141/3/KCSIRT/05/2026 — Request 19174

## Urutan deploy (production)

### 1. Backup
```bash
# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres ticketing > backup-pre-vapt.sql

# Backup file upload lama (jika ada)
tar -czf uploads-backup.tar.gz public/uploads/
```

### 2. Pull & build
```bash
git pull
docker compose -f docker-compose.prod.yml build --no-cache app
```

### 3. Migrasi database
```bash
# Schema: tambah kolom trackingToken
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Konversi tiket lama TKT-* → UUID + generate trackingToken
docker compose -f docker-compose.prod.yml run --rm app npm run migrate:uuid
```

### 4. Deploy
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5. Bersihkan file berbahaya dari VAPT
```bash
# Hapus file malicious yang diupload saat pentest
rm -f public/uploads/malicious.*
# Atau hapus seluruh folder lama jika sudah tidak dipakai:
# rm -rf public/uploads/*
```

### 6. Verifikasi keamanan
```bash
# Dari mesin yang bisa akses app internal:
TEST_BASE_URL=http://127.0.0.1:3000 npm run test:security
```

### 7. Konfigurasi Nginx Proxy Manager (TLS + headers) — **WAJIB untuk temuan VAPT**

Domain publik `ticketing-bpt.komdigi.go.id` dilayani NPM, bukan langsung dari Next.js.
Header di `next.config` saja **tidak cukup** — pasang juga di NPM.

1. **Proxy Host → Details**
   - Forward Hostname: `app` (bukan `ticketing-app`)
   - Forward Port: `3000`
   - Pastikan NPM satu Docker network dengan stack (`docker network connect myaspirasi-bpptik_default nginx-proxy-manager`)

2. **Tab SSL**
   - Aktifkan **Force SSL** (redirect HTTP → HTTPS)
   - Aktifkan **HTTP/2 Support**

3. **Tab Advanced** — tempel isi file `deploy/npm-proxy-advanced.conf`

4. Verifikasi:
```bash
curl -sI https://ticketing-bpt.komdigi.go.id | grep -iE 'x-frame|content-security|strict-transport|referrer|permissions|cross-origin|x-content|x-permitted'
```

Clickjacking harus gagal di Burp Clickbandit setelah `X-Frame-Options: DENY` dan `frame-ancestors 'none'`.

### 8. Konfigurasi OpenResty (alternatif)
Pasang snippet di `deploy/openresty-snippet.conf` pada server OpenResty.
Pastikan:
- HTTPS aktif dengan sertifikat valid
- Port 3000 **tidak** terbuka ke internet
- Header keamanan muncul di response

```bash
curl -I https://ticketing-bpt.komdigi.go.id
```

## Checklist temuan VAPT

| # | Temuan | Status kode | Verifikasi manual |
|---|--------|-------------|-------------------|
| 1 | IDOR /api/track | UUID + trackingToken + rate limit | POST dengan TKT-* harus 400 |
| 2 | PII /api/services | Public DTO tanpa assignedAdmin | GET /api/services tanpa auth |
| 3 | TLS + headers | NPM Advanced + middleware + nginx internal | curl -I https://... |
| 4 | File upload | Token + allowlist + private_uploads | POST .php tanpa token harus gagal |

## Variabel environment penting

```env
JWT_SECRET=<random-64-chars>
REDIS_URL=redis://redis:6379
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_REQUIRED=true
NEXT_PUBLIC_BASE_URL=https://ticketing-bpt.komdigi.go.id
```

## Catatan migrasi tiket lama

Setelah `npm run migrate:uuid`, nomor tiket lama berubah ke UUID.
User yang punya tiket aktif perlu diberitahu nomor + token baru melalui admin/email manual.
